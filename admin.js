// URSA IPA Admin — v8.0 Secure Google Auth + Firestore Write Lock
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let isAdmin = false;

// === Auth Elements ===
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailLabel = document.getElementById("admin-email");

// === Sign-In ===
loginBtn.onclick = async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    if (user.email !== "vibemusic1712@gmail.com") {
      alert("⛔ Доступ запрещён: не администратор!");
      await signOut(auth);
      return;
    }
    setAdmin(user);
  } catch (err) {
    alert("Ошибка входа: " + err.message);
  }
};

// === Sign-Out ===
logoutBtn.onclick = async () => {
  await signOut(auth);
  unsetAdmin();
};

// === Auth State Listener ===
onAuthStateChanged(auth, (user) => {
  if (user && user.email === "vibemusic1712@gmail.com") {
    setAdmin(user);
  } else {
    unsetAdmin();
  }
});

function setAdmin(user) {
  isAdmin = true;
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  emailLabel.style.display = "inline-block";
  emailLabel.textContent = `✅ ${user.email}`;
  document.querySelector(".brand span").textContent = "URSA IPA Admin (Secure)";
  loadData();
}

function unsetAdmin() {
  isAdmin = false;
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  emailLabel.style.display = "none";
  document.querySelector(".brand span").textContent = "URSA IPA Admin";
  cards.innerHTML = "<p style='color:#888;text-align:center;margin-top:40px;'>🔒 Войдите для доступа к данным</p>";
}

// === Safe Write Wrapper ===
async function safeWrite(action) {
  if (!isAdmin) {
    alert("⛔ Нет прав. Войдите через Google.");
    return;
  }
  await action();
}

// === Твой старый функционал ===
const cards = document.getElementById("cards");
const modal = document.getElementById("modal");
const form = document.getElementById("ipa-form");
const modalTitle = document.getElementById("modal-title");
const searchBox = document.getElementById("search");
const userTable = document.getElementById("user-list");

async function loadData(query = "") {
  cards.innerHTML = "<p style='color:#888'>Загрузка...</p>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  let apps = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
  const q = query.toLowerCase();
  if (q) apps = apps.filter(app => (app["NAME"] || "").toLowerCase().includes(q));
  apps.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  render(apps);
}

function render(apps) {
  cards.innerHTML = "";
  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    const vipMark = app.vipOnly ? "⭐" : "";
    card.innerHTML = `
      <div class="app-info">
        <img src="${app.iconUrl || ""}" class="app-icon">
        <div>
          <div class="app-title">${vipMark} ${app["NAME"]}</div>
          <div class="app-meta">${app["Bundle ID"]}</div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn small ${app.vipOnly ? "red" : "blue"}"
          onclick="safeWrite(()=>toggleVIP('${app.__docId}',${app.vipOnly}))">
          ${app.vipOnly ? "⭐ VIP" : "☆ FREE"}
        </button>
        <button class="btn small blue" onclick="safeWrite(()=>editItem('${app.__docId}'))">✏️</button>
        <button class="btn small red" onclick="safeWrite(()=>deleteItem('${app.__docId}'))">🗑</button>
      </div>`;
    cards.appendChild(card);
  });
}

window.toggleVIP = async (id, cur) => {
  await updateDoc(doc(db, "ursa_ipas", id), { vipOnly: !cur, updatedAt: new Date().toISOString() });
  loadData();
};
window.deleteItem = async (id) => {
  if (confirm("Удалить?")) await deleteDoc(doc(db, "ursa_ipas", id));
  loadData();
};
window.editItem = async (id) => {
  console.log("Редактирование:", id);
};

searchBox.addEventListener("input", () => loadData(searchBox.value));
