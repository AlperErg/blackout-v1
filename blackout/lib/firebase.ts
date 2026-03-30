import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCG2Mj82OUP-yDH-Q39NT0ieViCE02z15I",
  authDomain: "cage-b1cfe.firebaseapp.com",
  projectId: "cage-b1cfe",
  storageBucket: "cage-b1cfe.firebasestorage.app",
  messagingSenderId: "811917408901",
  appId: "1:811917408901:web:0463aa565bc87521ad07ec",
  measurementId: "G-6BD23X7MFW",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app!);
