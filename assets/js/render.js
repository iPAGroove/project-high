(function () {
  function prettyBytes(num) {
    if (!num) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB"];
    const e = Math.min(Math.floor(Math.log(num) / Math.log(1024)), u.length - 1);
    return `${(num / Math.pow(1024, e)).toFixed(e ? 1 : 0)} ${u[e]}`;
  }

  window.renderCatalog = function (apps) {
    const root = document.getElementById("catalog");
    root.innerHTML = "";

    apps.forEach(app => {
      const el = document.createElement("article");
      el.className = "card";
      el.setAttribute("role", "listitem");
      el.innerHTML = `
        <div class="row">
          <img class="icon" src="${app.iconUrl}" alt="">
          <div>
            <h3>${app.name}</h3>
            <div class="meta">${app.bundleId}</div>
            <div class="meta">v${app.version}${app.minIOS ? ` · iOS ≥ ${app.minIOS}` : ""}${app.sizeBytes ? ` · ${prettyBytes(app.sizeBytes)}` : ""}</div>
          </div>
        </div>
        <div class="tags">${(app.tags || []).map(t => `<span class="tag">#${t}</span>`).join("")}</div>
        <div class="btns">
          ${(app.mirrors || []).map(m => `<a class="btn" href="${m.url}" target="_blank" rel="noopener">Скачать ${m.label}</a>`).join("")}
          ${app.homepage ? `<a class="btn secondary" href="${app.homepage}" target="_blank" rel="noopener">Страница</a>` : ""}
        </div>
      `;
      root.appendChild(el);
    });
  };
})();
