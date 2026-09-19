import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
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
  onSnapshot,
  query, 
  orderBy, 
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

// Connection test helper
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
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
 * Initializes and binds RecaptchaVerifier to a DOM container
 */
export function setUpRecaptcha(containerId: string): RecaptchaVerifier {
  try {
    if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // ignore reset error
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please try again.');
      }
    });

    if (typeof window !== 'undefined') {
      (window as any).recaptchaVerifier = verifier;
    }

    return verifier;
  } catch (err) {
    console.error("Error setting up reCAPTCHA:", err);
    throw err;
  }
}

/**
 * Sends Phone OTP via Firebase Authentication
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string, 
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

/**
 * Verifies 6-digit OTP code against confirmation result
 */
export async function verifyFirebasePhoneOtp(
  confirmationResult: ConfirmationResult, 
  otpCode: string
): Promise<User> {
  const result = await confirmationResult.confirm(otpCode);
  return result.user;
}

/**
 * Signs out current user from Firebase Auth
 */
export async function signOutUser() {
  return await signOut(auth);
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
  try {
    const docRef = await addDoc(collection(db, "tailoring_orders"), {
      ...measurementData,
      createdAt: new Date().toISOString()
    });
    console.log("Document successfully written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document to Firebase: ", error);
    return { success: false, error };
  }
}

/**
 * Firestore سے تمام محفوظ شدہ آرڈرز حاصل کرنے کا فنکشن
 */
export async function getTailoringOrdersFromFirebase() {
  try {
    const q = query(collection(db, "tailoring_orders"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching orders from Firebase: ", error);
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
 * گاہک اور ناپ کے تمام ریکارڈ، پیمائش اور کھاتہ کو کلاؤڈ فائر اسٹور میں خودکار محفوظ کرنا
 */
export async function saveCustomerToFirestore(customer: Customer) {
  const path = `tailoring_customers/${customer.id}`;
  try {
    const docId = String(customer.id);
    const docRef = doc(db, "tailoring_customers", docId);
    await setDoc(docRef, {
      id: customer.id,
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
  try {
    let count = 0;
    for (const customer of customers) {
      if (customer && customer.id) {
        await saveCustomerToFirestore(customer);
        count++;
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
  const path = `tailoring_customers/${customerId}`;
  try {
    const docRef = doc(db, "tailoring_customers", String(customerId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error };
  }
}

/**
 * ریئل ٹائم فائر اسٹور کسٹمرز سنکنگ سبسکرپشن (Cloud Auto-Save Listener)
 */
export function subscribeToCustomerRecords(onUpdate: (customers: Customer[]) => void) {
  const path = 'tailoring_customers';
  try {
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cloudCustomers: Customer[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: typeof data.id === 'number' ? data.id : Number(d.id) || Date.now(),
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
        onUpdate(cloudCustomers);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}
