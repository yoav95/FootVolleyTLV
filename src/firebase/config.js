import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDX3tmrEDCnDMxWIqXXtazrKOk6YgBm7I",
  authDomain: "footvolleytlv-9e5f6.firebaseapp.com",
  projectId: "footvolleytlv-9e5f6",
  storageBucket: "footvolleytlv-9e5f6.firebasestorage.app",
  messagingSenderId: "494046065426",
  appId: "1:494046065426:web:935fe40024a1f455cef9cb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
