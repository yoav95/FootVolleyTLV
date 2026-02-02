import { auth, db } from '../firebase/firebaseConfig';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // If user doesn't exist, create profile
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        level: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update user profile
export const updateUserProfile = async (uid, userData) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...userData,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Watch authentication state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
