import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where,
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Customer } from './types';

// Firebase Initialization
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as required for Firestore Enterprise in AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Enable local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not enable browser local persistence:", err);
});

// Connection test helper
export async function testFirebaseConnection() {
  try {
    if (!auth.currentUser) {
      // If not logged in yet, connection is ready once user signs in
      return true;
    }
    await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    console.log("Firebase Firestore connected successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Please check network/config.");
    }
    return false;
  }
}

/**
 * Signs in user with Google Authentication Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Signs in user with Google Redirect (useful if popups/cookies are blocked in iframe)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}

/**
 * Checks for redirect auth results upon page return
 */
export async function checkRedirectAuthResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.warn("Redirect result error:", error);
    throw error;
  }
}

/**
 * Signs out current user from Firebase Auth
 */
export async function signOutUser() {
  return await signOut(auth);
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  phone?: string;
  updatedAt?: string;
}

/**
 * Save / Update tailor master profile in Firestore scoped to user's UID
 */
export async function saveUserProfileToFirestore(profile: Partial<UserProfile>): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  const path = `users/${currentUser.uid}`;
  try {
    const docRef = doc(db, 'users', currentUser.uid);
    await setDoc(docRef, {
      uid: currentUser.uid,
      name: profile.name || currentUser.displayName || 'Master Tailor',
      email: currentUser.email || '',
      photo: profile.photo !== undefined ? profile.photo : currentUser.photoURL || null,
      phone: profile.phone || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Fetch tailor master profile from Firestore
 */
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Gemini AI سے ٹیکسٹ یا ناپ کو پروسیس کرنے کا فنکشن
 * @param userInput - صارف کا بولا یا لکھا ہوا پیغام
 */
export async function processWithGeminiAI(userInput: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userInput })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      reply: data.reply,
      parsedMeasurements: data.parsedMeasurements || null
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}

export interface TailoringOrderData {
  ownerId?: string;
  customerName?: string;
  phone?: string;
  suitType?: string;
  status?: string;
  measurements: Record<string, string>;
  notes?: string;
  createdAt?: string;
}

/**
 * تصدیق ہونے کے بعد ناپ کا ڈیٹا Firebase Firestore میں محفوظ کرنے کا فنکشن
 * @param measurementData - فائنل ناپ اور کسٹمر ڈیٹا
 */
export async function saveMeasurementToFirebase(measurementData: TailoringOrderData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("Cannot save measurement: User not authenticated.");
    return { success: false, error: "Not authenticated" };
  }
  const path = 'tailoring_orders';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...measurementData,
      ownerId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
    console.log("Order document successfully written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return { success: false, error };
  }
}

/**
 * Firestore سے تمام محفوظ شدہ آرڈرز حاصل کرنے کا فنکشن (صرف موجودہ لاگ ان ٹیلر کے آرڈرز)
 */
export async function getTailoringOrdersFromFirebase() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }
  const path = 'tailoring_orders';
  try {
    const q = query(
      collection(db, path),
      where('ownerId', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * گاہک اور ناپ کے تمام ریکارڈ، پیمائش اور کھاتہ کو کلاؤڈ فائر اسٹور میں محفوظ کرنا
 * محفوظ ID کا پیٹرن: ${ownerId}_${customer.id} تاکہ الگ الگ ٹیلرز کا ڈیٹا ایک دوسرے سے الگ رہے
 */
export async function saveCustomerToFirestore(customer: Customer) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("Save aborted: No authenticated user.");
    return { success: false, error: "Not authenticated" };
  }
  const uid = currentUser.uid;
  const docId = `${uid}_${customer.id}`;
  const path = `tailoring_customers/${docId}`;
  try {
    const docRef = doc(db, "tailoring_customers", docId);
    await setDoc(docRef, {
      id: customer.id,
      ownerId: uid,
      name: customer.name || '',
      phone: customer.phone || '',
      date: customer.date || new Date().toLocaleDateString('en-GB'),
      deliveryDate: customer.deliveryDate || '',
      details: customer.details || '',
      suitType: customer.suitType || 'gents_suit',
      status: customer.status || 'pending',
      totalAmount: customer.totalAmount !== undefined && customer.totalAmount !== null ? String(customer.totalAmount) : '',
      advanceAmount: customer.advanceAmount !== undefined && customer.advanceAmount !== null ? String(customer.advanceAmount) : '',
      balanceAmount: customer.balanceAmount !== undefined && customer.balanceAmount !== null ? String(customer.balanceAmount) : '',
      measurementsObj: customer.measurementsObj || {},
      imageUri: customer.imageUri || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error };
  }
}

/**
 * تمام موجودہ کسٹمرز کو بیک وقت کلاؤڈ میں سنک اور محفوظ کرنا
 */
export async function syncAllCustomersToFirestore(customers: Customer[]): Promise<{ success: boolean; count: number; error?: any }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, count: 0, error: "Not authenticated" };
  }
  try {
    let count = 0;
    for (const customer of customers) {
      if (customer && customer.id) {
        const res = await saveCustomerToFirestore(customer);
        if (res.success) {
          count++;
        }
      }
    }
    return { success: true, count };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tailoring_customers/batch');
    return { success: false, count: 0, error };
  }
}

/**
 * فائر اسٹور سے کسٹمر سلپ ڈیلیٹ کرنا
 */
export async function deleteCustomerFromFirestore(customerId: number) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: "Not authenticated" };
  }
  const uid = currentUser.uid;
  const docId = `${uid}_${customerId}`;
  const path = `tailoring_customers/${docId}`;
  try {
    const docRef = doc(db, "tailoring_customers", docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error };
  }
}

/**
 * ریئل ٹائم فائر اسٹور کسٹمرز سنکنگ سبسکرپشن (Cloud Auto-Save Listener)
 * جہاں صرف لاگ ان ٹیلر کے اپنے کسٹمرز (ownerId == auth.currentUser.uid) سنک ہوتے ہیں
 * اور جب کسٹمر ڈیلیٹ ہو تو خالی لسٹ بھی واپس کی جاتی ہے تاکہ اسکرین فوراً اپڈیٹ ہو
 */
export function subscribeToCustomerRecords(onUpdate: (customers: Customer[]) => void) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    onUpdate([]);
    return () => {};
  }
  const uid = currentUser.uid;
  const path = 'tailoring_customers';
  try {
    const q = query(
      collection(db, path),
      where('ownerId', '==', uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudCustomers: Customer[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: typeof data.id === 'number' ? data.id : Number(data.id) || Date.now(),
          name: data.name || '',
          phone: data.phone || '',
          date: data.date || '',
          deliveryDate: data.deliveryDate || '',
          details: data.details || '',
          suitType: data.suitType || 'gents_suit',
          status: data.status || 'pending',
          totalAmount: data.totalAmount !== undefined ? String(data.totalAmount) : '',
          advanceAmount: data.advanceAmount !== undefined ? String(data.advanceAmount) : '',
          balanceAmount: data.balanceAmount !== undefined ? String(data.balanceAmount) : '',
          measurementsObj: data.measurementsObj || {},
          imageUri: data.imageUri || null
        } as Customer;
      });
      // CRITICAL: Call onUpdate even if snapshot is empty so screen updates on deletion of last customer
      onUpdate(cloudCustomers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}
