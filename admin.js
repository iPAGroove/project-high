import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(async function () {
  const cards = document.getElementById("cards");
  const modal = document.getElementById("modal");
  const form = document.getElementById("ipa-form");
  const modalTitle = document.getElementById("modal-title");

  const colRef = collection(window.db, "ipas");
  let data = [];
  let editId = null;

  async function loadData() {
    const snap = await getDocs(colRef);
    data = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
    render();
  }

  function render() {
    cards.innerHTML = "";
    data.forEach(app => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <div class="app-info">
          <div class="app-title">${app.NAME}</div>
          <div class="app-meta">ID: ${app.ID}</div>
          <div class="app-meta">Bundle: ${app["Bundle ID"]}</div>
          <div class="app-meta">Версия: ${app.Version} · iOS ≥ ${app["minimal iOS"]}</div>
          <div class="app-meta">Размер: ${app.sizeBytes}</div>
        </div>
        <div class="app-actions">
          <button class="btn small blue" onclick="editItem('${app._id}')">✏️ Ред.</button>
          <button class="btn small red" onclick="deleteItem('${app._id}')">🗑 Удалить</button>
        </div>
      `;
      cards.appendChild(card);
    });
  }

  function openModal(title, values = {}) {
    modalTitle.textContent = title;
    form.reset();
    editId = values._id ?? null;
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

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const ipa = {
      ID: values.id,
      NAME: values.name,
      "Bundle ID": values.bundleId,
      Version: values.version,
      "minimal iOS": values.minIOS,
      sizeBytes: Number(values.sizeBytes || 0),
      iconUrl: values.iconUrl,
      DownloadUrl: values.mirrorUrl,
      features: values.features || ""
    };

    if (editId) {
      await updateDoc(doc(window.db, "ipas", editId), ipa);
    } else {
      await addDoc(colRef, ipa);
    }
    closeModal();
    loadData();
  });

  document.getElementById("add-btn").addEventListener("click", () => {
    openModal("Добавить IPA");
  });

  window.deleteItem = async (id) => {
    if (confirm("Удалить запись?")) {
      await deleteDoc(doc(window.db, "ipas", id));
      loadData();
    }
  };

  window.editItem = (id) => {
    const app = data.find(x => x._id === id);
    openModal("Редактировать IPA", app);
  };

  loadData();
})();
