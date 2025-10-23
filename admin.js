// URSA IPA Admin — v8.1 Secure Google Auth + Full UI + Firestore Write Lock
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

// === Elements ===
const cards = document.getElementById("cards");
const modal = document.getElementById("modal");
const form = document.getElementById("ipa-form");
const modalTitle = document.getElementById("modal-title");
const searchBox = document.getElementById("search");
const userTable = document.getElementById("user-list");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailLabel = document.getElementById("admin-email");

let editDocId = null;

// === AUTH ===
const ADMIN_EMAILS = ["vibemusic1712@gmail.com", "kotvlad400@gmail.com", "pampered2817@mail.ru"];

loginBtn.onclick = async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    if (!ADMIN_EMAILS.includes(user.email)) {
      alert("⛔ Доступ запрещён: не администратор!");
      await signOut(auth);
      return;
    }
    setAdmin(user);
  } catch (err) {
    alert("Ошибка входа: " + err.message);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
  unsetAdmin();
};

onAuthStateChanged(auth, (user) => {
  if (user && ADMIN_EMAILS.includes(user.email)) setAdmin(user);
  else unsetAdmin();
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

// === Tabs ===
const ipaTab = document.getElementById("tab-ipas");
const userTab = document.getElementById("tab-users");
const ipaSection = document.getElementById("ipa-section");
const userSection = document.getElementById("users-section");

ipaTab.onclick = () => {
  ipaTab.classList.add("active");
  userTab.classList.remove("active");
  ipaSection.style.display = "block";
  userSection.style.display = "none";
};

userTab.onclick = () => {
  userTab.classList.add("active");
  ipaTab.classList.remove("active");
  ipaSection.style.display = "none";
  userSection.style.display = "block";
  if (isAdmin) loadUsers();
};

// ========== IPA MANAGEMENT ==========
function formatSize(bytes) {
  if (!bytes) return "-";
  return `${Math.round(bytes / 1000000)} MB`;
}

async function loadData(query = "") {
  if (!isAdmin) return;
  cards.innerHTML = "<p style='color:#888'>Загрузка...</p>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  let apps = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
  const q = query.toLowerCase();
  if (q)
    apps = apps.filter(app =>
      (app["NAME"] || "").toLowerCase().includes(q) ||
      (app["Bundle ID"] || "").toLowerCase().includes(q) ||
      (app["tags"] || []).join(",").toLowerCase().includes(q)
    );
  apps.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  render(apps);
}

function render(apps) {
  cards.innerHTML = "";
  if (!apps.length) {
    cards.innerHTML = "<p style='color:#888'>Нет приложений</p>";
    return;
  }
  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    const vipMark = app.vipOnly ? "⭐" : "";
    card.innerHTML = `
      <div class="app-info">
        <img src="${app.iconUrl || ""}" class="app-icon">
        <div>
          <div class="app-title">${vipMark} ${app["NAME"] || "Без названия"}</div>
          <div class="app-meta">${app["Bundle ID"] || "-"}</div>
          <div class="app-meta">v${app["Version"] || "-"} · iOS ≥ ${app["minimal iOS"] || "-"}</div>
          <div class="app-meta">Размер: ${formatSize(app["sizeBytes"])}</div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn small ${app.vipOnly ? "red" : "blue"}"
          onclick="safeWrite(()=>toggleVIP('${app.__docId}',${app.vipOnly}))">
          ${app.vipOnly ? "⭐ VIP" : "☆ FREE"}
        </button>
        <button class="btn small blue"
          onclick="safeWrite(()=>editItem('${app.__docId}'))">✏️</button>
        <button class="btn small red"
          onclick="safeWrite(()=>deleteItem('${app.__docId}'))">🗑</button>
      </div>`;
    cards.appendChild(card);
  });
}

// === Modal Logic ===
const iconInput = document.getElementById("iconUrl");
const iconPreview = document.getElementById("icon-preview");

iconInput.addEventListener("input", () => {
  iconPreview.src = iconInput.value;
  iconPreview.style.display = iconInput.value ? "block" : "none";
});

document.querySelectorAll(".tag-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    form.tag.value = btn.dataset.tag;
  });
});

function openModal(title, values = {}) {
  modalTitle.textContent = title;
  form.reset();
  editDocId = values.__docId || null;
  form.name.value = values["NAME"] || "";
  form.bundleId.value = values["Bundle ID"] || "";
  form.version.value = values["Version"] || "";
  form.minIOS.value = values["minimal iOS"] || "";
  form.sizeBytes.value = values["sizeBytes"] ? Math.round(values["sizeBytes"] / 1000000) : "";
  form.iconUrl.value = values.iconUrl || "";
  form.downloadUrl.value = values.DownloadUrl || "";
  form.features_ru.value = values.features_ru || "";
  form.features_en.value = values.features_en || "";

  document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
  if (Array.isArray(values.tags)) {
    const tag = values.tags[0];
    const btn = document.querySelector(`.tag-btn[data-tag="${tag}"]`);
    if (btn) btn.classList.add("active");
    form.tag.value = tag;
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

modal.addEventListener("click", e => {
  if (e.target.hasAttribute("data-close") || e.target === modal) closeModal();
});

// === CRUD ===
document.getElementById("add-btn").addEventListener("click", () => {
  if (!isAdmin) return alert("⛔ Нет прав. Войдите через Google.");
  openModal("Добавить IPA");
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return;
  const values = Object.fromEntries(new FormData(form));
  const ipa = {
    ID: values.bundleId && values.version ? `${values.bundleId}_${values.version}` : values.bundleId,
    NAME: values.name,
    "Bundle ID": values.bundleId,
    Version: values.version,
    "minimal iOS": values.minIOS,
    sizeBytes: Number(values.sizeBytes || 0) * 1000000,
    iconUrl: values.iconUrl,
    DownloadUrl: values.downloadUrl,
    description_ru: "Функции мода",
    description_en: "Hack Features",
    features_ru: values.features_ru || "",
    features_en: values.features_en || "",
    tags: values.tag ? [values.tag] : [],
    vipOnly: values.vipOnly === "true" || false,
    updatedAt: new Date().toISOString(),
  };
  if (!editDocId) ipa.createdAt = new Date().toISOString();
  if (editDocId) await updateDoc(doc(db, "ursa_ipas", editDocId), ipa);
  else await addDoc(collection(db, "ursa_ipas"), ipa);
  closeModal();
  loadData();
});

window.deleteItem = async (id) => {
  if (confirm("Удалить запись?")) {
    await deleteDoc(doc(db, "ursa_ipas", id));
    loadData();
  }
};

window.toggleVIP = async (id, cur) => {
  await updateDoc(doc(db, "ursa_ipas", id), { vipOnly: !cur, updatedAt: new Date().toISOString() });
  loadData();
};

window.editItem = async (id) => {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const app = snap.docs.find(d => d.id === id);
  if (app) openModal("Редактировать IPA", { __docId: app.id, ...app.data() });
};

// === USERS MANAGEMENT ===
async function loadUsers(query = "") {
  userTable.innerHTML = "<tr><td colspan='5' style='color:#888'>Загрузка...</td></tr>";
  const snap = await getDocs(collection(db, "ursa_users"));
  let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (query) {
    const q = query.toLowerCase();
    users = users.filter(u =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  }
  users.sort((a, b) => (a.status === "vip" ? -1 : 1));
  renderUsers(users);
}

function renderUsers(users) {
  userTable.innerHTML = "";
  if (!users.length) {
    userTable.innerHTML = "<tr><td colspan='5' style='color:#888'>Нет пользователей</td></tr>";
    return;
  }
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email || "—"}</td>
      <td>${u.name || "—"}</td>
      <td class="muted">${u.uid || u.id}</td>
      <td><span class="badge ${u.status === "vip" ? "vip" : "free"}">${u.status || "free"}</span></td>
      <td><button class="btn small" onclick="editUser('${u.id}', '${u.email}', '${u.name}', '${u.status || "free"}')">✏️</button></td>
    `;
    userTable.appendChild(tr);
  });
}

window.editUser = (id, email, name, status) => {
  if (!isAdmin) return alert("⛔ Нет прав. Войдите через Google.");
  const m = document.getElementById("user-modal");
  document.getElementById("edit-user-email").textContent = email;
  document.getElementById("edit-user-name").textContent = name;
  document.getElementById("edit-user-status").value = status || "free";
  m.dataset.id = id;
  m.classList.add("open");
  document.body.style.overflow = "hidden";
};

document.getElementById("save-user-status").onclick = async () => {
  if (!isAdmin) return alert("⛔ Нет прав. Войдите через Google.");
  const m = document.getElementById("user-modal");
  const id = m.dataset.id;
  const newStatus = document.getElementById("edit-user-status").value;
  await updateDoc(doc(db, "ursa_users", id), { status: newStatus });
  m.classList.remove("open");
  document.body.style.overflow = "";
  loadUsers();
};

document.getElementById("user-modal").addEventListener("click", e => {
  if (e.target.hasAttribute("data-close") || e.target === e.currentTarget) {
    e.currentTarget.classList.remove("open");
    document.body.style.overflow = "";
  }
});

// === Search ===
searchBox.addEventListener("input", () => loadData(searchBox.value));
document.getElementById("user-search").addEventListener("input", e => loadUsers(e.target.value));
// === EXPORT TO WINDOW ===
window.safeWrite = safeWrite;
window.toggleVIP = toggleVIP;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.editUser = editUser;
