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
const iconInput = document.getElementById("iconUrl");
const iconPreview = document.getElementById("icon-preview");
const searchBox = document.getElementById("search");
let editDocId = null;

// ===== HELPERS =====
function formatSize(bytes) {
  if (!bytes) return "-";
  return `${Math.round(bytes / 1000000)} MB`;
}

// === Загрузка ===
async function loadData(query = "") {
  cards.innerHTML = "<p style='color:#888'>Загрузка...</p>";
  const snap = await getDocs(collection(db, "ursa_ipas"));
  let apps = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));

  if (query) {
    const q = query.toLowerCase();
    apps = apps.filter(app =>
      (app["NAME"] || "").toLowerCase().includes(q) ||
      (app["Bundle ID"] || "").toLowerCase().includes(q) ||
      (app["tags"] || []).join(",").toLowerCase().includes(q)
    );
  }

  render(apps);
}

// === Рендер карточек ===
function render(apps) {
  cards.innerHTML = "";
  if (!apps.length) {
    cards.innerHTML = "<p style='color:#888'>Нет приложений</p>";
    return;
  }
  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <div class="app-info">
        <img src="${app.iconUrl || ""}" alt="" class="app-icon">
        <div>
          <div class="app-title">${app["NAME"] || "Без названия"}</div>
          <div class="app-meta">Bundle: ${app["Bundle ID"] || "-"}</div>
          <div class="app-meta">Версия: ${app["Version"] || "-"} · iOS ≥ ${app["minimal iOS"] || "-"}</div>
          <div class="app-meta">Размер: ${formatSize(app["sizeBytes"])}</div>
          <div class="app-meta">Теги: ${(app["tags"] || []).join(", ")}</div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn small blue" onclick="editItem('${app.__docId}')">✏️</button>
        <button class="btn small red" onclick="deleteItem('${app.__docId}')">🗑</button>
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

  const map = {
    "NAME": "name",
    "Bundle ID": "bundleId",
    "Version": "version",
    "minimal iOS": "minIOS",
    "sizeBytes": "sizeBytes",
    "iconUrl": "iconUrl",
    "DownloadUrl": "downloadUrl",
    "features": "features",
    "tags": "tags",
    "ID": "id"
  };

  Object.entries(map).forEach(([fKey, formKey]) => {
    if (form[formKey]) {
      if (fKey === "sizeBytes") {
        form[formKey].value = values[fKey] ? Math.round(values[fKey] / 1000000) : "";
      } else if (fKey === "tags" && Array.isArray(values[fKey])) {
        form[formKey].value = values[fKey].join(", ");
      } else {
        form[formKey].value = values[fKey] || "";
      }
    }
  });

  if (values.iconUrl) {
    iconPreview.src = values.iconUrl;
    iconPreview.style.display = "block";
  } else {
    iconPreview.style.display = "none";
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

// === Превью иконки ===
iconInput.addEventListener("input", () => {
  if (iconInput.value) {
    iconPreview.src = iconInput.value;
    iconPreview.style.display = "block";
  } else {
    iconPreview.style.display = "none";
  }
});

// === Автогенерация ID ===
form.bundleId.addEventListener("input", () => {
  if (form.version.value) form.id.value = `${form.bundleId.value}_${form.version.value}`;
});
form.version.addEventListener("input", () => {
  if (form.bundleId.value) form.id.value = `${form.bundleId.value}_${form.version.value}`;
});

// === Добавление / обновление ===
form.addEventListener("submit", async e => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(form));

  const ipa = {
    "ID": values.bundleId && values.version ? `${values.bundleId}_${values.version}` : values.id,
    "NAME": values.name,
    "Bundle ID": values.bundleId,
    "Version": values.version,
    "minimal iOS": values.minIOS,
    "sizeBytes": Number(values.sizeBytes || 0) * 1000000,
    "iconUrl": values.iconUrl,
    "DownloadUrl": values.downloadUrl,
    "features": values.features || "",
    "tags": values.tags ? values.tags.split(",").map(t => t.trim()) : [],
    "updatedAt": new Date().toISOString(),
  };

  if (!editDocId) ipa["createdAt"] = new Date().toISOString();

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
  if (app) openModal("Редактировать IPA", { __docId: app.id, ...app.data() });
};

// === Поиск ===
searchBox.addEventListener("input", () => loadData(searchBox.value));

// === Кнопки ===
document.getElementById("add-btn").addEventListener("click", () => openModal("Добавить IPA"));

// === Загрузка при старте ===
loadData();
