(async function () {
  const tableBody = document.querySelector("#admin-table tbody");
  let data = [];

  // Загружаем JSON
  async function loadData() {
    try {
      const res = await fetch("data/ipas.json?ts=" + Date.now());
      data = await res.json();
      render();
    } catch (e) {
      console.error("Ошибка загрузки JSON", e);
      tableBody.innerHTML = `<tr><td colspan="7">Не удалось загрузить ipas.json</td></tr>`;
    }
  }

  // Рендер таблицы
  function render() {
    tableBody.innerHTML = "";
    data.forEach((app, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="ID">${app.id}</td>
        <td data-label="Name">${app.name}</td>
        <td data-label="BundleId">${app.bundleId}</td>
        <td data-label="Version">${app.version}</td>
        <td data-label="minIOS">${app.minIOS}</td>
        <td data-label="Size">${app.sizeBytes}</td>
        <td data-label="Actions">
          <button class="btn small blue" onclick="editItem(${idx})">✏️</button>
          <button class="btn small red" onclick="deleteItem(${idx})">🗑</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Скачать JSON
  document.getElementById("download-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipas.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Добавить новый IPA
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

  // Глобальные функции для кнопок
  window.deleteItem = function (idx) {
    if (confirm("Удалить эту запись?")) {
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
