import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCURRAbxMgW2ofeMAR0VXT4PJbTsaQIeCo",
  authDomain: "neurolancer-2135f.firebaseapp.com",
  projectId: "neurolancer-2135f",
  storageBucket: "neurolancer-2135f.firebasestorage.app",
  messagingSenderId: "156617154270",
  appId: "1:156617154270:web:5706961b914d4ce4856c4f",
  measurementId: "G-ERTQKCNGE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics (only on client side)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };

// Google Sign In with popup (more reliable)
export const signInWithGoogle = async () => {
  try {
    console.log('Attempting popup sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Popup sign-in successful:', result);
    return result;
  } catch (error: any) {
    console.log('Popup failed, trying redirect:', error);
    // Fallback to redirect if popup fails
    try {
      await signInWithRedirect(auth, googleProvider);
      return null; // Redirect doesn't return immediately
    } catch (redirectError) {
      throw redirectError;
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