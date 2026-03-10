import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBJtqjSSVxak1c9v3F4crFX3JFXVkN4H7g",
  authDomain: "embed-5180a.firebaseapp.com",
  projectId: "embed-5180a",
  storageBucket: "embed-5180a.firebasestorage.app",
  messagingSenderId: "527713171237",
  appId: "1:527713171237:web:9cbc0a3da28cdf845f8ccc"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)
