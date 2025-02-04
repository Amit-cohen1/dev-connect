// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_R3RQtR-w1iTHh5lK8GJzMRYD7V_DHNg",
  authDomain: "devtogether-89820.firebaseapp.com",
  projectId: "devtogether-89820",
  storageBucket: "devtogether-89820.firebasestorage.app",
  messagingSenderId: "71620411759",
  appId: "1:71620411759:web:10c0ef9babb91b0ac3289a",
  measurementId: "G-C5ZW6G2VW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);