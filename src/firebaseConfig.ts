import { activeFirebaseConfig, PROD_FIREBASE_CREDENTIALS, app, auth, db } from './firebase';

export { activeFirebaseConfig, PROD_FIREBASE_CREDENTIALS, app, auth, db };
export const firebaseConfig = activeFirebaseConfig;
export default activeFirebaseConfig;
