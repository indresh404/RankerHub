import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required config values
const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

const hasRequiredConfig = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));

if (!hasRequiredConfig) {
  console.warn("Firebase is not configured. Auth, database, analytics, and storage services are disabled for this environment.");
}

// Initialize Firebase
const app = hasRequiredConfig ? initializeApp(firebaseConfig) : null;

const shouldUseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || "localhost";
const authEmulatorPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 9099);
const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "localhost";
const firestoreEmulatorPort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080);

// Initialize Firebase services
export const auth = app ? getAuth(app) : null;
export const githubProvider = new GithubAuthProvider();

// Configure GitHub Provider with additional scopes if needed
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');
// Uncomment these if you need more GitHub access
// githubProvider.addScope('repo');
// githubProvider.addScope('read:org');

// Set custom parameters for GitHub provider
githubProvider.setCustomParameters({
  // Force GitHub to always show the account selection screen
  // 'prompt': 'select_account',
  // 'allow_signup': 'true'
});

export const db = app ? getFirestore(app) : null;

if (shouldUseEmulators && auth && db) {
  connectAuthEmulator(auth, `http://${authEmulatorHost}:${authEmulatorPort}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
}

// Initialize analytics only in the browser, and don't let analytics
// availability crash auth or the rest of Firebase setup.
let analyticsInstance = null;

if (app && typeof window !== "undefined") {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization skipped:", error);
  }
}

export const analytics = analyticsInstance;

// Initialize storage (useful for profile pictures, etc.)
export const storage = app ? getStorage(app) : null;

// Helper function to sign in with GitHub
export const signInWithGitHub = async (requestRepoScope = false) => {
  if (!auth) {
    throw new Error("Firebase is not configured. Add the required VITE_FIREBASE_* values before signing in.");
  }

  try {
    const dynamicProvider = new GithubAuthProvider();
    dynamicProvider.addScope('read:user');
    dynamicProvider.addScope('user:email');
    
    if (requestRepoScope) {
      dynamicProvider.addScope('repo');
    }

    const result = await signInWithPopup(auth, dynamicProvider);
    const user = result.user;
    
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    // SECURITY NOTE: Never include access tokens in userData or Firestore
    // Tokens are sensitive credentials that should only exist in memory
    // and only be used in secure, server-side operations
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      // githubAccessToken NOT included - never store tokens in Firestore
    };

    return { user, accessToken, userData, result }; 
  } catch (error) {
    console.error("GitHub sign-in error:", error);
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address.', { cause: error });
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing.', { cause: error });
    }
    throw error;
  }
};

// Helper function to sign out
export const signOutUser = async () => {
  if (!auth) {
    return true;
  }

  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Helper function to get current user's token
export const getCurrentUserToken = async () => {
  if (!auth) {
    return null;
  }

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error("Error getting user token:", error);
      return null;
    }
  }
  return null;
};

// Helper function to refresh user token
export const refreshUserToken = async () => {
  if (!auth) {
    return null;
  }

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(true); // Force refresh
      return token;
    } catch (error) {
      console.error("Error refreshing user token:", error);
      return null;
    }
  }
  return null;
};

// Export initialized app as default
export default app;
