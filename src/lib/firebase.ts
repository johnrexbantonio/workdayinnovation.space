import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBejfIxMKn2SeI6X5nYhwj6q6GG5fRihSM",
  authDomain: "training-manager-2a136.firebaseapp.com",
  projectId: "training-manager-2a136",
  storageBucket: "training-manager-2a136.firebasestorage.app",
  messagingSenderId: "1053283231725",
  appId: "1:1053283231725:web:71273d1dcc23037e52a9e4"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
