import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJifTQkBt887kS0EcJJFNpumU8XJbhl5A",
  authDomain: "blessed-equb.firebaseapp.com",
  projectId: "blessed-equb",
  storageBucket: "blessed-equb.firebasestorage.app",
  messagingSenderId: "742317611488",
  appId: "1:742317611488:web:625b1d80103a42315c7385",
  measurementId: "G-EZ4XRJSRDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, db, analytics };