// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore,writeBatch } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

// Optionally remove this if you're not using Analytics
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz1uws2sbOaYdrRYM_-Pl1pbIzyctSGLA",
  authDomain: "erp-website-7729f.firebaseapp.com",
  projectId: "erp-website-7729f",
  storageBucket: "erp-website-7729f.appspot.com",
  messagingSenderId: "1061152587923",
  appId: "1:1061152587923:web:8ee0bc2747776f50a9cd66",

};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const batch = writeBatch(db);

export default app;

