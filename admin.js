import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ТВОЯ конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cards = document.getElementById("cards");
const modal = document.getElementById("modal");
const form = document.getElementById("ipa-form");
const modalTitle = document.getElementById("modal-title");

let editDocId = null;

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
  cards.innerHTML = "<div class='loading'>Загрузка...</div>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  cards.innerHTML = "";
  snap.forEach((docSnap) => {
    const app = docSnap.data();
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <div class="app-info">
        <div class="app-title">${app.name}</div>
        <div class="app-meta">ID: ${app.id}</div>
        <div class="app-meta">Bundle: ${app.bundleId}</div>
        <div class="app-meta">Версия: ${app.version} · iOS ≥ ${app.minIOS || "-"}</div>
        <div class="app-meta">Размер: ${app.sizeBytes || 0}</div>
      </div>
      <div class="app-actions">
        <button class="btn small blue" onclick="editItem('${docSnap.id}')">✏️ Ред.</button>
        <button class="btn small red" onclick="deleteItem('${docSnap.id}')">🗑 Удалить</button>
      </div>
    `;
    cards.appendChild(card);
  });
}

// === СОХРАНЕНИЕ ===
form.addEventListener("submit", async (e) => {
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
    features: values.features
  };

  if (editDocId) {
    await updateDoc(doc(db, "ipas", editDocId), ipa);
  } else {
    await addDoc(collection(db, "ipas"), ipa);
  }

  closeModal();
  loadData();
});

// === УДАЛЕНИЕ ===
window.deleteItem = async (id) => {
  if (confirm("Удалить запись?")) {
    await deleteDoc(doc(db, "ipas", id));
    loadData();
  }
};

// === РЕДАКТИРОВАНИЕ ===
window.editItem = async (id) => {
  const snap = await getDocs(collection(db, "ipas"));
  snap.forEach((d) => {
    if (d.id === id) {
      const app = d.data();
      editDocId = id;
      openModal("Редактировать IPA", app);
    }
  });
};

// === МОДАЛКА ===
function openModal(title, values = {}) {
  modalTitle.textContent = title;
  form.reset();
  Object.keys(values).forEach((k) => {
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
  editDocId = null;
}

modal.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close") || e.target === modal) closeModal();
});

document.getElementById("add-btn").addEventListener("click", () => {
  openModal("Добавить IPA");
});

// === ЗАПУСК ===
loadData();
