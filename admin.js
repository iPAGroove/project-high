import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

const cards = document.getElementById("cards");
const modal = document.getElementById("modal");
const form = document.getElementById("ipa-form");
const modalTitle = document.getElementById("modal-title");
let editDocId = null;

// === Нормализация старых данных ===
function normalize(doc) {
  return {
    __docId: doc.__docId,
    id: doc.id || doc.ID,
    name: doc.name || doc.NAME,
    bundleId: doc.bundleId || doc["Bundle ID"],
    version: doc.version || doc.Version,
    minIOS: doc.minIOS || doc["minimal iOS"],
    sizeBytes: doc.sizeBytes || 0,
    iconUrl: doc.iconUrl,
    downloadUrl: doc.downloadUrl || doc.DownloadUrl,
    features: doc.features || ""
  };
}

// === Загрузка данных ===
async function loadData() {
  cards.innerHTML = "<p style='color:#888'>Загрузка...</p>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const apps = snap.docs.map(d => normalize({ __docId: d.id, ...d.data() }));
  render(apps);
}

// === Рендер карточек ===
function render(apps) {
  cards.innerHTML = "";
  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <div class="app-info">
        <div class="app-title">${app.name || "Без названия"}</div>
        <div class="app-meta">ID: ${app.id || "-"}</div>
        <div class="app-meta">Bundle: ${app.bundleId || "-"}</div>
        <div class="app-meta">Версия: ${app.version || "-"} · iOS ≥ ${app.minIOS || "-"}</div>
        <div class="app-meta">Размер: ${app.sizeBytes || 0}</div>
      </div>
      <div class="app-actions">
        <button class="btn small blue" onclick="editItem('${app.__docId}')">✏️ Ред.</button>
        <button class="btn small red" onclick="deleteItem('${app.__docId}')">🗑 Удалить</button>
      </div>
    `;
    cards.appendChild(card);
  });
}

// === Модалка ===
function openModal(title, values = {}) {
  modalTitle.textContent = title;
  form.reset();
  editDocId = values.__docId || null;
  Object.keys(values).forEach(k => {
    if (form[k]) form[k].value = values[k];
  });
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

modal.addEventListener("click", e => {
  if (e.target.hasAttribute("data-close") || e.target === modal) closeModal();
});

// === Добавление / обновление ===
form.addEventListener("submit", async e => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(form));

  const ipa = {
    id: values.id,
    name: values.name,
    bundleId: values.bundleId,
    version: values.version,
    minIOS: values.minIOS,
    sizeBytes: Number(values.sizeBytes || 0),
    iconUrl: values.iconUrl,
    downloadUrl: values.downloadUrl,
    features: values.features || ""
  };

  if (editDocId) {
    await updateDoc(doc(db, "ursa_ipas", editDocId), ipa);
  } else {
    await addDoc(collection(db, "ursa_ipas"), ipa);
  }
  closeModal();
  loadData();
});

// === Удаление ===
window.deleteItem = async id => {
  if (confirm("Удалить запись?")) {
    await deleteDoc(doc(db, "ursa_ipas", id));
    loadData();
  }
};

// === Редактирование ===
window.editItem = async id => {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const app = snap.docs.find(d => d.id === id);
  if (app) openModal("Редактировать IPA", normalize({ __docId: app.id, ...app.data() }));
};

// === Кнопки ===
document.getElementById("add-btn").addEventListener("click", () => {
  openModal("Добавить IPA");
});

// === Загрузка при старте ===
loadData();
