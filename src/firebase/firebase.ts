import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAs9Ol9gHfqcl9CJsG-uxyDuInN5CPui6Q",
  authDomain: "ekanwe-96b6c.firebaseapp.com",
  projectId: "ekanwe-96b6c",
  storageBucket: "ekanwe-96b6c.firebasestorage.app",
  messagingSenderId: "862152717069",
  appId: "1:862152717069:web:efb3d771aa9c5ebfa2f644"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app);
export const db = getFirestore(app);
export const storage = getStorage(app);