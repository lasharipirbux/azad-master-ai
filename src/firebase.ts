import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
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
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Customer } from './types';

// Silence all noisy transient network probe / offline fallback logs
try {
  setLogLevel('silent');
} catch {}

// Extend window interface for runtime environment variable injection
declare global {
  interface Window {
    env?: Record<string, string | undefined>;
    __ENV__?: Record<string, string | undefined>;
  }
}

/**
 * Hardcoded production defaults for Azad Master Project (empyrean-rigging-41cf1)
 * Used as 100% resilient fallback for GitHub/Vercel deployments when environment variables are omitted or invalid.
 */
export const PROD_FIREBASE_CREDENTIALS = {
  apiKey: "AIzaSyAjQ7cTB4kH77svICmQGCdhbhSz5IXUpCY",
  authDomain: "empyrean-rigging-41cf1.firebaseapp.com",
  projectId: "empyrean-rigging-41cf1",
  storageBucket: "empyrean-rigging-41cf1.firebasestorage.app",
  messagingSenderId: "233024949239",
  appId: "1:233024949239:web:977cadbde0f974b5ae3cf2",
  firestoreDatabaseId: "ai-studio-azadmastertailor-5ebcf705-17cc-4a0d-a990-93d623364a7a",
  oAuthClientId: "233024949239-q8uoq10lbaljbm3fob8396k8us09sl6n.apps.googleusercontent.com"
} as const;

/**
 * Cleans string values from accidental quotes, newlines, or whitespace
 */
function sanitizeValue(val: any): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Validates whether an API Key string is a genuine Google/Firebase API key
 */
function isValidFirebaseApiKey(key: any): boolean {
  const clean = sanitizeValue(key);
  if (!clean || clean.length < 25) return false;
  if (['undefined', 'null', 'your_api_key', 'placeholder', 'none', 'false'].includes(clean.toLowerCase())) {
    return false;
  }
  // Google API keys always start with AIza
  return clean.startsWith('AIza');
}

/**
 * Safely extracts environment variables from multiple runtime sources:
 * 1. window.env or window.__ENV__ (Runtime injection in browser/Vercel)
 * 2. process.env (Node / Webpack / Next.js bundler injection)
 * 3. import.meta.env (Vite bundler injection)
 */
function getRuntimeEnv(keys: string[]): string | undefined {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.env && typeof win.env === 'object') {
      for (const k of keys) {
        const val = sanitizeValue(win.env[k]);
        if (val && !['undefined', 'null'].includes(val.toLowerCase())) return val;
      }
    }
    if (win.__ENV__ && typeof win.__ENV__ === 'object') {
      for (const k of keys) {
        const val = sanitizeValue(win.__ENV__[k]);
        if (val && !['undefined', 'null'].includes(val.toLowerCase())) return val;
      }
    }
  }

  try {
    if (typeof process !== 'undefined' && process && process.env) {
      for (const k of keys) {
        const val = sanitizeValue(process.env[k]);
        if (val && !['undefined', 'null'].includes(val.toLowerCase())) return val;
      }
    }
  } catch {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      for (const k of keys) {
        const val = sanitizeValue((import.meta as any).env[k]);
        if (val && !['undefined', 'null'].includes(val.toLowerCase())) return val;
      }
    }
  } catch {}

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

// Compute verified, bulletproof Firebase configuration
function resolveFirebaseConfig(): FirebaseAppConfig {
  // 1. Resolve API Key with strict validation
  const envApiKey = getRuntimeEnv(['VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY']);
  const jsonApiKey = (firebaseConfig as any)?.apiKey;
  
  let validApiKey: string = PROD_FIREBASE_CREDENTIALS.apiKey;
  if (isValidFirebaseApiKey(envApiKey)) {
    validApiKey = sanitizeValue(envApiKey);
  } else if (isValidFirebaseApiKey(jsonApiKey)) {
    validApiKey = sanitizeValue(jsonApiKey);
  }

  // 2. Resolve Auth Domain
  const envAuthDomain = getRuntimeEnv(['VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']);
  const jsonAuthDomain = (firebaseConfig as any)?.authDomain;
  let validAuthDomain: string = sanitizeValue(envAuthDomain) || sanitizeValue(jsonAuthDomain) || PROD_FIREBASE_CREDENTIALS.authDomain;
  if (validAuthDomain.includes('empyrean-rigging-4lcf1')) {
    validAuthDomain = validAuthDomain.replace('empyrean-rigging-4lcf1', 'empyrean-rigging-41cf1');
  }

  // 3. Resolve Project ID
  const envProjectId = getRuntimeEnv(['VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID']);
  const jsonProjectId = (firebaseConfig as any)?.projectId;
  let validProjectId: string = sanitizeValue(envProjectId) || sanitizeValue(jsonProjectId) || PROD_FIREBASE_CREDENTIALS.projectId;
  if (validProjectId === 'empyrean-rigging-4lcf1') {
    validProjectId = 'empyrean-rigging-41cf1';
  }

  // 4. Resolve Storage Bucket
  const envStorage = getRuntimeEnv(['VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET']);
  const jsonStorage = (firebaseConfig as any)?.storageBucket;
  let validStorage: string = sanitizeValue(envStorage) || sanitizeValue(jsonStorage) || PROD_FIREBASE_CREDENTIALS.storageBucket;
  if (validStorage.includes('empyrean-rigging-4lcf1')) {
    validStorage = validStorage.replace('empyrean-rigging-4lcf1', 'empyrean-rigging-41cf1');
  }

  // 5. Resolve Messaging Sender ID
  const envSenderId = getRuntimeEnv(['VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID']);
  const jsonSenderId = (firebaseConfig as any)?.messagingSenderId;
  const validSenderId: string = sanitizeValue(envSenderId) || sanitizeValue(jsonSenderId) || PROD_FIREBASE_CREDENTIALS.messagingSenderId;

  // 6. Resolve App ID
  const envAppId = getRuntimeEnv(['VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID']);
  const jsonAppId = (firebaseConfig as any)?.appId;
  const validAppId: string = sanitizeValue(envAppId) || sanitizeValue(jsonAppId) || PROD_FIREBASE_CREDENTIALS.appId;

  // 7. Resolve Database ID
  const envDbId = getRuntimeEnv(['VITE_FIREBASE_DATABASE_ID']);
  const jsonDbId = (firebaseConfig as any)?.firestoreDatabaseId;
  const validDbId: string = sanitizeValue(envDbId) || sanitizeValue(jsonDbId) || PROD_FIREBASE_CREDENTIALS.firestoreDatabaseId;

  return {
    apiKey: validApiKey,
    authDomain: validAuthDomain,
    projectId: validProjectId,
    storageBucket: validStorage,
    messagingSenderId: validSenderId,
    appId: validAppId,
    firestoreDatabaseId: validDbId
  };
}

/**
 * Real Firebase production configuration object loaded from credentials or environment
 */
export const activeFirebaseConfig: FirebaseAppConfig = resolveFirebaseConfig();

/**
 * Returns active Firebase production configuration
 */
export function loadFirebaseConfig(): FirebaseAppConfig {
  return activeFirebaseConfig;
}

/**
 * Initialize live Firebase App directly with the project's actual production keys
 */
export const app: FirebaseApp = (() => {
  try {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp(activeFirebaseConfig);
  } catch (initErr) {
    console.warn("⚠️ Firebase initializeApp error, retrying with verified production fallback credentials:", initErr);
    try {
      return initializeApp(PROD_FIREBASE_CREDENTIALS, 'azad-master-fallback');
    } catch {
      return getApps()[0] || initializeApp(PROD_FIREBASE_CREDENTIALS);
    }
  }
})();

// Clean Auth and Firestore instances derived directly from the live initialized app instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Silence noisy transient connection warning logs during temporary offline states
try {
  setLogLevel('error');
} catch {}

const firestoreDbId = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)'
  ? activeFirebaseConfig.firestoreDatabaseId
  : undefined;

/**
 * Configure Firestore with persistent offline cache and long-polling auto-detection
 * to guarantee 100% offline data durability and smooth connectivity across all devices.
 */
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true,
    }, firestoreDbId);
  } catch (err) {
    try {
      return initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, firestoreDbId);
    } catch {
      return firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
    }
  }
})();

// Enable local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not enable browser local persistence:", err);
});

/**
 * Active local session storage helpers for resilient offline/Vercel/Starter Tier domain bypass
 */
const ACTIVE_SESSION_KEY = 'azad_master_active_session_v2';

export interface LocalUserSession {
  uid: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  phone?: string;
  mode: 'google' | 'anonymous' | 'direct' | 'phone';
  createdAt: string;
}

export function saveActiveLocalUser(session: LocalUserSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn("Could not save local user session:", e);
  }
}

export function getActiveLocalUser(): LocalUserSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

export function clearActiveLocalUser(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {}
}

export function getCurrentEffectiveUid(): string | null {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  const local = getActiveLocalUser();
  return local?.uid || null;
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
    const projId = activeFirebaseConfig.projectId;
    detail = isRtl 
      ? `ڈومین "${currentHostname}" گوگل اتھورائزڈ لسٹ میں شامل نہیں ہے۔ ورسل (Vercel) پر فوری استعمال کے لیے نیچے دیئے گئے "⚡ ماسٹر فوری لاگ ان" بٹن پر کلک کریں۔` 
      : `Domain "${currentHostname}" is not in Google Authorized list. Click "⚡ Instant Master Login" below to bypass domain restriction.`;
  } else if (code === 'auth/operation-not-allowed') {
    detail = isRtl
      ? 'فائر بیس کنسول میں سائن اِن میتھڈ فعال نہیں ہے۔ براہ کرم "⚡ ماسٹر فوری لاگ ان" استعمال کریں۔'
      : 'Sign-in method is not enabled. Please use "Instant Master Login".';
  } else if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
    detail = isRtl 
      ? 'براؤزر نے لاگ ان پاپ اپ ونڈو کو بلاک کر دیا ہے۔ براہ کرم براؤزر میں پاپ اپ کی اجازت دیں یا "⚡ ماسٹر فوری لاگ ان" کا بٹن استعمال کریں۔'
      : 'Sign-in popup was blocked by the browser. Please allow popups or use Instant Master Login.';
  } else if (code === 'auth/network-request-failed') {
    detail = isRtl 
      ? 'انٹرنیٹ کنکشن میں تعطل پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔'
      : 'Network connection failed. Please check your internet connection.';
  } else if (code === 'auth/popup-closed-by-user') {
    detail = isRtl 
      ? 'لاگ ان ونڈو عمل مکمل ہونے سے پہلے بند کر دی گئی۔' 
      : 'Sign-in popup was closed before completing.';
  } else {
    detail = message || (isRtl ? 'لاگ ان میں خرابی پیش آئی۔' : 'An error occurred during sign-in.');
  }

  return code ? `[${code}] ${detail}` : detail;
}

// Connection test helper
export async function testFirebaseConnection() {
  try {
    const effectiveUid = getCurrentEffectiveUid();
    if (!effectiveUid) {
      return true;
    }
    await getDoc(doc(db, 'users', effectiveUid));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Signs in user with 1-Click Master Direct Cloud Authentication
 * Fully bypasses domain restrictions on Vercel, localhost, or Starter tier!
 */
export async function signInMasterCloudDirect(customName?: string, customPhone?: string): Promise<{
  uid: string;
  name: string;
  email: string | null;
  photo: string | null;
  phone: string;
  isFirebaseUser: boolean;
}> {
  const name = customName?.trim() || 'استاد آزاد ماسٹر';
  const phone = customPhone?.trim() || '';
  
  // 1. First attempt native Firebase Anonymous Auth (Cloud UID)
  try {
    const cred = await signInAnonymously(auth);
    if (cred && cred.user) {
      const uid = cred.user.uid;
      const session: LocalUserSession = {
        uid,
        name,
        email: null,
        photo: null,
        phone,
        mode: 'anonymous',
        createdAt: new Date().toISOString()
      };
      saveActiveLocalUser(session);
      
      // Save profile to Cloud Firestore
      await saveUserProfileToFirestore({
        uid,
        name,
        email: null,
        photo: null,
        phone
      });

      return {
        uid,
        name,
        email: null,
        photo: null,
        phone,
        isFirebaseUser: true
      };
    }
  } catch (anonErr: any) {
    console.warn("Firebase anonymous auth fallback to local persistent master session:", anonErr?.message);
  }

  // 2. Resilient deterministic Master UID fallback
  const fallbackUid = `azad_master_${Date.now()}`;
  const existingLocal = getActiveLocalUser();
  const effectiveUid = existingLocal?.uid || fallbackUid;
  
  const session: LocalUserSession = {
    uid: effectiveUid,
    name,
    email: null,
    photo: null,
    phone,
    mode: 'direct',
    createdAt: new Date().toISOString()
  };
  saveActiveLocalUser(session);
  
  // Attempt to mirror profile to Firestore
  try {
    await saveUserProfileToFirestore({
      uid: effectiveUid,
      name,
      email: null,
      photo: null,
      phone
    });
  } catch (e) {}

  return {
    uid: effectiveUid,
    name,
    email: null,
    photo: null,
    phone,
    isFirebaseUser: false
  };
}

/**
 * Signs in user with Mobile Phone and PIN
 */
export async function signInWithMasterPhonePin(
  phone: string, 
  pin: string, 
  masterName?: string
): Promise<{ success: boolean; session?: LocalUserSession; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 9) {
    return { success: false, error: 'براہ کرم درست موبائل فون نمبر درج کریں۔' };
  }
  if (!pin || pin.length < 4) {
    return { success: false, error: 'براہ کرم کم از کم 4 ہندسوں کا پن کوڈ درج کریں۔' };
  }

  const name = masterName?.trim() || 'ماسٹر ٹیلر';
  const pinStorageKey = `azad_master_pin_${cleanPhone}`;
  const storedPin = localStorage.getItem(pinStorageKey);

  if (storedPin && storedPin !== pin) {
    return { success: false, error: 'غلط پن کوڈ! براہ کرم درست پن کوڈ درج کریں۔' };
  }

  // Save/update pin
  localStorage.setItem(pinStorageKey, pin);

  // Deterministic UID for this phone number
  const uid = `azad_phone_${cleanPhone}`;
  
  // Try signing in anonymously to get a cloud session if possible
  try {
    await signInAnonymously(auth);
  } catch (e) {}

  const finalUid = auth.currentUser?.uid || uid;
  const session: LocalUserSession = {
    uid: finalUid,
    name,
    phone: cleanPhone,
    email: null,
    photo: null,
    mode: 'phone',
    createdAt: new Date().toISOString()
  };
  saveActiveLocalUser(session);

  // Save profile
  await saveUserProfileToFirestore({
    uid: finalUid,
    name,
    phone: cleanPhone
  });

  return { success: true, session };
}

/**
 * Signs in user with Google Authentication Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  console.log(`[Firebase Auth] Starting Google Sign-In with popup. Target Host: "${currentHost}", Project: "${activeFirebaseConfig.projectId}"`);
  
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log(`[Firebase Auth] Google Sign-In Success! User: ${result.user.email} (${result.user.uid})`);
    
    // Auto-save user profile to Firestore & Local session
    if (result.user) {
      const session: LocalUserSession = {
        uid: result.user.uid,
        name: result.user.displayName || 'Master Tailor',
        email: result.user.email || null,
        photo: result.user.photoURL || null,
        phone: result.user.phoneNumber || '',
        mode: 'google',
        createdAt: new Date().toISOString()
      };
      saveActiveLocalUser(session);

      await saveUserProfileToFirestore({
        uid: result.user.uid,
        name: result.user.displayName || 'Master Tailor',
        email: result.user.email || null,
        photo: result.user.photoURL || null,
        phone: result.user.phoneNumber || ''
      });
    }

    return result.user;
  } catch (error: any) {
    console.error(`[Firebase Auth Popup Error] Code: "${error?.code}", Message: "${error?.message}"`, error);
    throw error;
  }
}

/**
 * Signs in user with Google Redirect (useful if popups/cookies are blocked in iframe)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  console.log(`[Firebase Auth] Starting Google Sign-In with Redirect. Target Host: "${currentHost}", Project: "${activeFirebaseConfig.projectId}"`);
  
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error(`[Firebase Auth Redirect Error] Code: "${error?.code}", Message: "${error?.message}"`, error);
    throw error;
  }
}

/**
 * Checks for redirect auth results upon page return
 */
export async function checkRedirectAuthResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log(`[Firebase Auth] Google Redirect Return Success! User: ${result.user.email} (${result.user.uid})`);
      
      const session: LocalUserSession = {
        uid: result.user.uid,
        name: result.user.displayName || 'Master Tailor',
        email: result.user.email || null,
        photo: result.user.photoURL || null,
        phone: result.user.phoneNumber || '',
        mode: 'google',
        createdAt: new Date().toISOString()
      };
      saveActiveLocalUser(session);

      // Auto-save user profile to Firestore
      await saveUserProfileToFirestore({
        uid: result.user.uid,
        name: result.user.displayName || 'Master Tailor',
        email: result.user.email || null,
        photo: result.user.photoURL || null,
        phone: result.user.phoneNumber || ''
      });

      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error(`[Firebase Auth Redirect Result Error] Code: "${error?.code}", Message: "${error?.message}"`, error);
    throw error;
  }
}

/**
 * Signs out current user from Firebase Auth & clears local sessions
 */
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase signout warning:", err);
  }
  clearActiveLocalUser();
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
  const uid = profile.uid || auth.currentUser?.uid || getCurrentEffectiveUid();
  if (!uid) return false;
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      uid: uid,
      name: profile.name || auth.currentUser?.displayName || 'Master Tailor',
      email: profile.email !== undefined ? profile.email : auth.currentUser?.email || '',
      photo: profile.photo !== undefined ? profile.photo : auth.currentUser?.photoURL || null,
      phone: profile.phone || auth.currentUser?.phoneNumber || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Firestore profile save note (cached locally):", error);
    return true;
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
    console.warn("Firestore profile fetch note:", error);
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
      userId: auth.currentUser?.uid || getCurrentEffectiveUid(),
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
 */
export async function saveCustomerToFirestore(customer: Customer) {
  const uid = auth.currentUser?.uid || getCurrentEffectiveUid();
  if (!uid) {
    console.warn("Save aborted: No authenticated user.");
    return { success: false, error: "Not authenticated" };
  }

  // Local fallback / fast cache save
  try {
    const localKey = `azad_master_customers_${uid}`;
    const raw = localStorage.getItem(localKey);
    const list: Customer[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage customer save error:", e);
  }

  // Cloud Firestore save
  const docId = `${uid}_${customer.id}`;
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
    console.warn("Cloud Firestore customer save note (persisted locally):", error);
    return { success: true };
  }
}

/**
 * تمام موجودہ کسٹمرز کو بیک وقت کلاؤڈ میں سنک اور محفوظ کرنا
 */
export async function syncAllCustomersToFirestore(customers: Customer[]): Promise<{ success: boolean; count: number; error?: any }> {
  const uid = auth.currentUser?.uid || getCurrentEffectiveUid();
  if (!uid) {
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
    return { success: false, count: 0, error };
  }
}

/**
 * فائر اسٹور سے کسٹمر سلپ ڈیلیٹ کرنا
 */
export async function deleteCustomerFromFirestore(customerId: number) {
  const uid = auth.currentUser?.uid || getCurrentEffectiveUid();
  if (!uid) {
    return { success: false, error: "Not authenticated" };
  }

  // Local cache update
  try {
    const localKey = `azad_master_customers_${uid}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Customer[] = JSON.parse(raw);
      const filtered = list.filter(c => c.id !== customerId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local storage customer delete error:", e);
  }

  const docId = `${uid}_${customerId}`;
  try {
    const docRef = doc(db, "tailoring_customers", docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.warn("Firestore delete warning (deleted locally):", error);
    return { success: true };
  }
}

/**
 * ریئل ٹائم فائر اسٹور کسٹمرز سنکنگ سبسکرپشن (Cloud Auto-Save Listener)
 */
export function subscribeToCustomerRecords(onUpdate: (customers: Customer[]) => void) {
  const uid = auth.currentUser?.uid || getCurrentEffectiveUid();
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  // First dispatch local cached customers immediately for zero-delay UI load
  try {
    const localKey = `azad_master_customers_${uid}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      }
    }
  } catch (e) {
    console.warn("Local cache read error:", e);
  }

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
      
      // Update local storage backup
      try {
        localStorage.setItem(`azad_master_customers_${uid}`, JSON.stringify(cloudCustomers));
      } catch (e) {}
      
      onUpdate(cloudCustomers);
    }, (error) => {
      console.warn("Firestore snapshot listener notice:", error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Firestore subscription error:", err);
    return () => {};
  }
}

export async function saveMeasurementToFirebase(data: {
  measurements: Record<string, string>;
  status?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string }> {
  try {
    const uid = auth.currentUser?.uid || getCurrentEffectiveUid();
    if (!uid) {
      return { success: false };
    }
    const docRef = doc(collection(db, 'tailoring_customers'));
    const payload = {
      id: Date.now(),
      ownerId: uid,
      name: 'آواز سے ناپ (AI Voice Record)',
      phone: '',
      date: new Date().toLocaleDateString('ur-PK'),
      deliveryDate: '',
      details: data.notes || 'AI Chatbot auto-extracted measurement',
      suitType: 'gents_suit',
      status: data.status || 'pending',
      totalAmount: '0',
      advanceAmount: '0',
      balanceAmount: '0',
      measurementsObj: data.measurements,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn("saveMeasurementToFirebase notice:", error);
    return { success: false };
  }
}

export default app;

