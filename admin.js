import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { 
  getFirestore, collection, getDocs, setDoc, updateDoc, deleteDoc, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ⚡️ Конфигурация Firebase
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

// Элементы
const cards = document.getElementById("cards");
const modal = document.getElementById("modal");
const form = document.getElementById("ipa-form");
const modalTitle = document.getElementById("modal-title");
let editId = null;

// === Загрузка данных ===
async function loadData() {
  cards.innerHTML = "<p style='color:#888'>Загрузка...</p>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
        <div class="app-title">${app.name}</div>
        <div class="app-meta">ID: ${app.id}</div>
        <div class="app-meta">Bundle: ${app.bundleId}</div>
        <div class="app-meta">Версия: ${app.version} · iOS ≥ ${app.minimalIOS}</div>
        <div class="app-meta">Размер: ${app.sizeBytes}</div>
      </div>
      <div class="app-actions">
        <button class="btn small blue" onclick="editItem('${app.id}')">✏️ Ред.</button>
        <button class="btn small red" onclick="deleteItem('${app.id}')">🗑 Удалить</button>
      </div>
    `;
    cards.appendChild(card);
  });
}

// === Модалка ===
function openModal(title, values = {}) {
  modalTitle.textContent = title;
  form.reset();
  editId = values.id || null;
  Object.keys(values).forEach(k => { if (form[k]) form[k].value = values[k]; });
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

  // 🔑 ID документа = bundleId_version
  const docId = values.bundleId + "_" + values.version;

  const ipa = {
    name: values.name,
    bundleId: values.bundleId,
    version: values.version,
    minimalIOS: values.minimalIOS,
    sizeBytes: Number(values.sizeBytes || 0),
    iconUrl: values.iconUrl,
    downloadUrl: values.downloadUrl,
    features: values.features || ""
  };

  if (editId) {
    await updateDoc(doc(db, "ursa_ipas", editId), ipa);
  } else {
    await setDoc(doc(db, "ursa_ipas", docId), ipa);
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
  const appSnap = await getDoc(doc(db, "ursa_ipas", id));
  if (appSnap.exists()) {
    openModal("Редактировать IPA", { id, ...appSnap.data() });
  }
};

// === Кнопки ===
document.getElementById("add-btn").addEventListener("click", () => {
  openModal("Добавить IPA");
});

document.getElementById("download-btn").addEventListener("click", async () => {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const blob = new Blob([JSON.stringify(apps, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ursa_ipas.json";
  a.click();
  URL.revokeObjectURL(url);
});

// === Старт ===
loadData();
