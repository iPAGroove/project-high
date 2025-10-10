(async function () {
  const cards = document.getElementById("cards");
  const modal = document.getElementById("modal");
  const form = document.getElementById("ipa-form");
  const modalTitle = document.getElementById("modal-title");
  let data = [];
  let editIndex = null;

  async function loadData() {
    try {
      const res = await fetch("data/ipas.json?ts=" + Date.now());
      data = await res.json();
      render();
    } catch {
      cards.innerHTML = `<div class="empty">Не удалось загрузить ipas.json</div>`;
    }
  }

  function render() {
    cards.innerHTML = "";
    data.forEach((app, idx) => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <div class="app-info">
          <div class="app-title">${app.name}</div>
          <div class="app-meta">ID: ${app.id}</div>
          <div class="app-meta">Bundle: ${app.bundleId}</div>
          <div class="app-meta">Версия: ${app.version} · iOS ≥ ${app.minIOS}</div>
          <div class="app-meta">Размер: ${app.sizeBytes}</div>
        </div>
        <div class="app-actions">
          <button class="btn small blue" onclick="editItem(${idx})">✏️ Ред.</button>
          <button class="btn small red" onclick="deleteItem(${idx})">🗑 Удалить</button>
        </div>
      `;
      cards.appendChild(card);
    });
  }

  function openModal(title, values = {}) {
    modalTitle.textContent = title;
    form.reset();
    editIndex = values._idx ?? null;
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

  form.addEventListener("submit", e => {
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
      mirrors: values.mirrorUrl ? [{ label: "Direct", url: values.mirrorUrl }] : []
    };
    if (editIndex !== null) {
      data[editIndex] = ipa;
    } else {
      data.push(ipa);
    }
    closeModal();
    render();
  });

  document.getElementById("add-btn").addEventListener("click", () => {
    openModal("Добавить IPA");
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipas.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  window.deleteItem = idx => {
    if (confirm("Удалить запись?")) {
      data.splice(idx, 1);
      render();
    }
  };

  window.editItem = idx => {
    openModal("Редактировать IPA", { ...data[idx], _idx: idx });
  };

  loadData();
})();
