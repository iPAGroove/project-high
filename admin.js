(async function () {
  const cards = document.getElementById("cards");
  let data = [];

  // загрузка JSON
  async function loadData() {
    try {
      const res = await fetch("data/ipas.json?ts=" + Date.now());
      data = await res.json();
      render();
    } catch (e) {
      console.error("Ошибка загрузки JSON", e);
      cards.innerHTML = `<div class="empty">Не удалось загрузить ipas.json</div>`;
    }
  }

  // отрисовка карточек
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

  // скачать JSON
  document.getElementById("download-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipas.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // добавить IPA
  document.getElementById("add-btn").addEventListener("click", () => {
    const id = prompt("ID:");
    const name = prompt("Name:");
    const bundleId = prompt("BundleId:");
    const version = prompt("Version:");
    const minIOS = prompt("minIOS:");
    const sizeBytes = prompt("Size (байты):");
    if (id && name) {
      data.push({ id, name, bundleId, version, minIOS, sizeBytes });
      render();
    }
  });

  // глобальные ф-и
  window.deleteItem = function (idx) {
    if (confirm("Удалить запись?")) {
      data.splice(idx, 1);
      render();
    }
  };

  window.editItem = function (idx) {
    const app = data[idx];
    app.name = prompt("Name:", app.name) || app.name;
    app.version = prompt("Version:", app.version) || app.version;
    render();
  };

  loadData();
})();
