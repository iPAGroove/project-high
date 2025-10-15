// URSA Firebase Core — v3.6 (PWA + Safari Safe)
import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};

// === Инициализация с безопасной персистентностью для PWA ===
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = getAuth(app);
} catch {
  auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
}

const db = getFirestore(app);

console.log("🔥 URSA Firebase Core initialized (Safari/PWA-safe, IndexedDB persistence)");

export { app, auth, db };
