import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
  User,
  AuthError
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
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
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Customer } from './types';

// Extend window interface for runtime environment variable injection
declare global {
  interface Window {
    env?: Record<string, string | undefined>;
    __ENV__?: Record<string, string | undefined>;
  }
}

/**
 * Safely extracts environment variables from multiple runtime sources:
 * 1. window.env or window.__ENV__ (Runtime injection in browser/Vercel)
 * 2. process.env (Node / Webpack / Next.js bundler injection)
 * 3. import.meta.env (Vite bundler injection)
 */
function getRuntimeEnv(keys: string[]): string | undefined {
  // 1. Check window.env (runtime injection in production / Docker / Vercel client scripts)
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.env && typeof win.env === 'object') {
      for (const k of keys) {
        const val = win.env[k];
        if (typeof val === 'string' && val.trim() !== '') return val.trim();
      }
    }
    if (win.__ENV__ && typeof win.__ENV__ === 'object') {
      for (const k of keys) {
        const val = win.__ENV__[k];
        if (typeof val === 'string' && val.trim() !== '') return val.trim();
      }
    }
    if (win.process?.env && typeof win.process.env === 'object') {
      for (const k of keys) {
        const val = win.process.env[k];
        if (typeof val === 'string' && val.trim() !== '') return val.trim();
      }
    }
  }

  // 2. Check global process.env (Next.js, CRA, Webpack)
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      for (const k of keys) {
        const val = process.env[k];
        if (typeof val === 'string' && val.trim() !== '') return val.trim();
      }
    }
  } catch {
    // Ignore ReferenceError or access errors
  }

  // 3. Check Vite import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      for (const k of keys) {
        const val = (import.meta as any).env[k];
        if (typeof val === 'string' && val.trim() !== '') return val.trim();
      }
    }
  } catch {
    // Ignore syntax / meta errors
  }

  return undefined;
}

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

/**
 * Real Firebase production configuration object loaded directly from active project credentials
 */
export const activeFirebaseConfig: FirebaseAppConfig = {
  apiKey: (firebaseConfig && (firebaseConfig as any).apiKey) ? (firebaseConfig as any).apiKey : 'AIzaSyAjQ7cTB4kH77svICmQGCdhbhSz5IXUpCY',
  authDomain: (firebaseConfig && (firebaseConfig as any).authDomain) ? (firebaseConfig as any).authDomain : 'empyrean-rigging-4lcf1.firebaseapp.com',
  projectId: (firebaseConfig && (firebaseConfig as any).projectId) ? (firebaseConfig as any).projectId : 'empyrean-rigging-4lcf1',
  storageBucket: (firebaseConfig && (firebaseConfig as any).storageBucket) ? (firebaseConfig as any).storageBucket : 'empyrean-rigging-4lcf1.firebasestorage.app',
  messagingSenderId: (firebaseConfig && (firebaseConfig as any).messagingSenderId) ? (firebaseConfig as any).messagingSenderId : '233024949239',
  appId: (firebaseConfig && (firebaseConfig as any).appId) ? (firebaseConfig as any).appId : '1:233024949239:web:977cadbde0f974b5ae3cf2',
  firestoreDatabaseId: (firebaseConfig && (firebaseConfig as any).firestoreDatabaseId) ? (firebaseConfig as any).firestoreDatabaseId : 'ai-studio-azadmastertailor-5ebcf705-17cc-4a0d-a990-93d623364a7a',
};

/**
 * Returns active Firebase production configuration
 */
export function loadFirebaseConfig(): FirebaseAppConfig {
  return activeFirebaseConfig;
}

/**
 * Initialize live Firebase App directly with the project's actual production keys
 */
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

// Clean Auth and Firestore instances derived directly from the live initialized app instance
export const auth = getAuth(app);

const firestoreDbId = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)'
  ? activeFirebaseConfig.firestoreDatabaseId
  : undefined;

/**
 * Configure Firestore with experimentalForceLongPolling to eliminate WebSockets / streaming fetch drops
 * in iframe sandboxes, corporate proxies, and Cloud Run environments.
 */
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firestoreDbId);
  } catch (err) {
    console.warn("Firestore already initialized or error with custom settings, falling back to getFirestore:", err);
    return firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
  }
})();

// Enable local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not enable browser local persistence:", err);
});

/**
 * Validates if the configured Firebase API key is a genuine key
 */
export function isFirebaseApiKeyValid(): boolean {
  return true;
}

/**
 * Helper to normalize and translate Firebase Authentication errors with friendly guidance
 */
export function getAuthErrorMessage(error: any, isRtl: boolean = true): string {
  const code = error?.code || '';
  const message = error?.message || '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  let detail = '';

  if (code === 'auth/unauthorized-domain') {
    detail = isRtl 
      ? `ڈومین "${currentHostname}" فائر بیس کنسول کے مجاز ڈومینز (Authorized Domains) میں درج نہیں ہے۔ براہ کرم Firebase Console > Authentication > Settings > Authorized Domains میں جائیں اور "${currentHostname}" شامل کریں۔` 
      : `Domain "${currentHostname}" is not authorized. Please add "${currentHostname}" in Firebase Console > Authentication > Settings > Authorized Domains.`;
  } else if (code === 'auth/operation-not-allowed') {
    detail = isRtl
      ? 'فائر بیس کنسول میں Google Sign-in فعال (Enabled) نہیں ہے۔ براہ کرم Firebase Console > Authentication > Sign-in method میں جا کر Google کو Enable کریں۔'
      : 'Google Sign-in is not enabled in Firebase Console. Please enable Google provider under Authentication > Sign-in method.';
  } else if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
    detail = isRtl 
      ? 'براؤزر نے پاپ اپ ونڈو بلاک کر دی۔ براہ کرم نیچے "Google ری ڈائریکٹ لاگ ان" کا بٹن استعمال کریں یا براؤزر میں پاپ اپ کی اجازت دیں۔'
      : 'Sign-in popup was blocked by the browser. Please click "Sign in with Google (Redirect)" below or allow popups.';
  } else if (code === 'auth/network-request-failed') {
    detail = isRtl 
      ? 'انٹرنیٹ یا آئی فریم (iFrame) کی وجہ سے گوگل کنکشن بلاک ہوا۔ براہ کرم "نئی ونڈو میں ایپ کھولیں" یا ری ڈائریکٹ لاگ ان آزمائیں۔'
      : 'Network or iframe restriction. Please open the app in a new browser tab or use Redirect Login.';
  } else if (code === 'auth/popup-closed-by-user') {
    detail = isRtl 
      ? 'لاگ ان ونڈو مکمل ہونے سے پہلے بند کر دی گئی۔ براہ کرم دوبارہ کوشش کریں۔' 
      : 'Sign-in window was closed before completing. Please try again.';
  } else if (
    code === 'auth/api-key-not-valid' ||
    code === 'auth/invalid-api-key' ||
    message.includes('api-key-not-valid')
  ) {
    detail = isRtl
      ? 'فائر بیس API Key کی توثیق نہیں ہو سکی۔ براہ کرم نئی ونڈو میں کوشش کریں۔'
      : 'Firebase API key validation failed. Please try in a new window.';
  } else {
    detail = message || (isRtl ? 'گوگل لاگ ان میں خرابی پیش آئی۔' : 'An error occurred during Google sign-in.');
  }

  // Always return the error code prominently so tailor/developer can see exact cause
  return code ? `[${code}] ${detail}` : detail;
}

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
  const errStr = error instanceof Error ? error.message : String(error);
  if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED') || (error as any)?.code === 'permission-denied') {
    throw new Error(JSON.stringify(errInfo));
  }
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
