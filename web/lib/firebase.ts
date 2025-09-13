import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCtgr5jKrpNLr9MhmGUCibnpI0ZgyOgKOk",
  authDomain: "neurolancer-9aee7.firebaseapp.com",
  projectId: "neurolancer-9aee7",
  storageBucket: "neurolancer-9aee7.firebasestorage.app",
  messagingSenderId: "731943476565",
  appId: "1:731943476565:web:9ced77cf6a5a061a8de3dc",
  measurementId: "G-XGY4NVVSDH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for better redirect handling
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics (only on client side)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };

// Google Sign In with popup and redirect fallback
export const signInWithGoogle = async () => {
  try {
    console.log('Attempting popup sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Popup sign-in successful:', result);
    return result;
  } catch (error: any) {
    console.log('Popup failed:', error.code, error.message);
    
    // Check if popup was blocked or closed
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request') {
      console.log('Popup blocked/closed, using redirect...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Redirect doesn't return immediately
      } catch (redirectError) {
        console.error('Redirect also failed:', redirectError);
        throw redirectError;
      }
    } else {
      // For other errors, throw immediately
      throw error;
    }
  }
};

// Get redirect result
export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    throw error;
  }
};

// Sign Out
export const firebaseSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};