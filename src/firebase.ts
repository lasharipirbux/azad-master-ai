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

function isValidApiKey(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    trimmed.includes('Placeholder') ||
    trimmed.includes('YOUR_') ||
    trimmed.includes('UNCONFIGURED') ||
    trimmed === 'AIzaSyAzadMasterPlaceholderKey'
  ) {
    return false;
  }
  return trimmed.startsWith('AIzaSy') && trimmed.length > 20;
}

/**
 * Securely loads Firebase configuration from firebase-applet-config.json and process.env / window.env
 * with clean fallback to provisioned credentials.
 */
export function loadFirebaseConfig(): FirebaseAppConfig {
  const rawConfig = (firebaseConfig as Record<string, any>) || {};

  const rawApiKey = rawConfig.apiKey;
  const envApiKey = getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_API_KEY',
    'VITE_FIREBASE_API_KEY',
    'FIREBASE_API_KEY',
    'API_KEY'
  ]);

  const apiKey = (isValidApiKey(rawApiKey) ? rawApiKey : (isValidApiKey(envApiKey) ? envApiKey : (rawApiKey || envApiKey || ''))).trim();

  const authDomain = (rawConfig.authDomain || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'FIREBASE_AUTH_DOMAIN'
  ]) || 'empyrean-rigging-4lcf1.firebaseapp.com').trim();

  const projectId = (rawConfig.projectId || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID'
  ]) || 'empyrean-rigging-4lcf1').trim();

  const storageBucket = (rawConfig.storageBucket || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'FIREBASE_STORAGE_BUCKET'
  ]) || 'empyrean-rigging-4lcf1.firebasestorage.app').trim();

  const messagingSenderId = (rawConfig.messagingSenderId || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_MESSAGING_SENDER_ID'
  ]) || '233024949239').trim();

  const appId = (rawConfig.appId || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'REACT_APP_FIREBASE_APP_ID',
    'VITE_FIREBASE_APP_ID',
    'FIREBASE_APP_ID'
  ]) || '').trim();

  const firestoreDatabaseId = rawConfig.firestoreDatabaseId || getRuntimeEnv([
    'NEXT_PUBLIC_FIREBASE_DATABASE_ID',
    'REACT_APP_FIREBASE_DATABASE_ID',
    'VITE_FIREBASE_DATABASE_ID',
    'FIREBASE_DATABASE_ID'
  ]) || '(default)';

  // Validate critical keys and emit clear fallback warnings instead of hard-crashing
  const missingKeys: string[] = [];
  if (!isValidApiKey(apiKey)) {
    missingKeys.push('API Key (Valid Web App API Key in firebase-applet-config.json)');
  }
  if (!projectId || projectId.includes('YOUR_')) {
    missingKeys.push('Project ID (Valid Project ID in firebase-applet-config.json)');
  }

  if (missingKeys.length > 0) {
    console.warn(
      `[Firebase Security & Config Notice]\n` +
      `Firebase configuration is missing valid credentials or using placeholders:\n` +
      missingKeys.map(k => `  • ${k}`).join('\n') + `\n` +
      `To connect to your cloud database and enable Google Sign-In, please ensure firebase-applet-config.json contains valid credentials.\n` +
      `The app is running safely in offline mode with fallback configurations.`
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId
  };
}

// Securely load active Firebase configuration using utility function
export const activeFirebaseConfig: FirebaseAppConfig = loadFirebaseConfig();

/**
 * Initializes Firebase App using loadFirebaseConfig with error recovery
 */
function initializeFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  try {
    return initializeApp(activeFirebaseConfig);
  } catch (initErr) {
    console.warn("[Firebase] Initialized with fallback parameters due to initialization error:", initErr);
    return initializeApp({
      apiKey: activeFirebaseConfig.apiKey || "AIzaSy_UNCONFIGURED_KEY_SAFE_FALLBACK",
      projectId: activeFirebaseConfig.projectId || "empyrean-rigging-4lcf1",
      authDomain: activeFirebaseConfig.authDomain || "empyrean-rigging-4lcf1.firebaseapp.com"
    });
  }
}

// Clean Auth and Firestore instances derived directly from the initialized app instance
export const app: FirebaseApp = initializeFirebaseApp();
export const auth = getAuth(app);
export const db: Firestore = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, activeFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Enable local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not enable browser local persistence:", err);
});

/**
 * Validates if the configured Firebase API key is a genuine key rather than an unconfigured placeholder
 */
export function isFirebaseApiKeyValid(): boolean {
  const key = activeFirebaseConfig?.apiKey;
  if (!key || typeof key !== 'string') return false;
  if (
    key.includes('Placeholder') || 
    key.includes('YOUR_') || 
    key.includes('UNCONFIGURED') ||
    key === 'AIzaSyAzadMasterPlaceholderKey'
  ) {
    return false;
  }
  return key.startsWith('AIzaSy') && key.length > 20;
}

/**
 * Helper to normalize and translate Firebase Authentication errors with friendly guidance
 */
export function getAuthErrorMessage(error: any, isRtl: boolean = true): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (
    code === 'auth/api-key-not-valid' ||
    code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
    code === 'auth/invalid-api-key' ||
    message.includes('api-key-not-valid') ||
    !isFirebaseApiKeyValid()
  ) {
    return isRtl
      ? 'فائر بیس API کی درست نہیں ہے۔ براہ کرم Firebase Console سے اصل API Key حاصل کر کے firebase-applet-config.json میں یا Environment Variable (NEXT_PUBLIC_FIREBASE_API_KEY / REACT_APP_FIREBASE_API_KEY / window.env) میں سیٹ کریں۔'
      : 'Firebase API key is invalid or placeholder. Please provide a valid Web App API Key via environment variables (process.env / window.env) or in firebase-applet-config.json.';
  }

  if (code === 'auth/unauthorized-domain') {
    return isRtl 
      ? 'یہ ڈومین Firebase Console میں مجاز نہیں ہے۔ براہ کرم Authentication > Settings > Authorized Domains میں شامل کریں۔' 
      : 'This domain is not authorized in Firebase Console. Please add it in Authentication > Settings > Authorized Domains.';
  }

  if (code === 'auth/network-request-failed') {
    return isRtl 
      ? 'نیٹ ورک یا آئی فریم رکاوٹ (auth/network-request-failed)۔ براہ کرم نیچے "نئی ٹیب میں کھولیں" بٹن پر کلک کریں یا ری ڈائریکٹ لاگ ان کریں۔'
      : 'Network / iframe restriction (auth/network-request-failed). Please click "Open in New Tab" below or use Redirect Sign-in.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return isRtl ? 'لاگ ان پاپ اپ بند کر دیا گیا۔ دوبارہ کوشش کریں۔' : 'Sign-in popup was closed. Please try again.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return isRtl ? 'لاگ ان درخواست منسوخ ہو گئی۔' : 'Sign-in request was cancelled.';
  }

  return message || (isRtl ? 'گوگل لاگ ان میں خرابی آئی۔ براہ کرم دوبارہ کوشش کریں۔' : 'Google sign-in failed. Please try again.');
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
  if (!isFirebaseApiKeyValid()) {
    const err: any = new Error("Firebase API key is not valid. Please pass a valid API key in firebase-applet-config.json.");
    err.code = 'auth/api-key-not-valid';
    throw err;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (error?.code?.includes('api-key-not-valid') || error?.message?.includes('api-key-not-valid')) {
      error.code = 'auth/api-key-not-valid';
    }
    throw error;
  }
}

/**
 * Signs in user with Google Redirect (useful if popups/cookies are blocked in iframe)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  if (!isFirebaseApiKeyValid()) {
    const err: any = new Error("Firebase API key is not valid. Please pass a valid API key in firebase-applet-config.json.");
    err.code = 'auth/api-key-not-valid';
    throw err;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    if (error?.code?.includes('api-key-not-valid') || error?.message?.includes('api-key-not-valid')) {
      error.code = 'auth/api-key-not-valid';
    }
    throw error;
  }
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
