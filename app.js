async function loadCatalog() {
  const res = await fetch("ipas.json");
  const data = await res.json();

  const catalog = document.getElementById("catalog");
  const search = document.getElementById("search");

  function render(list) {
    catalog.innerHTML = "";
    list.forEach(app => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:center;">
          <img src="${app.iconUrl}" alt="">
          <div>
            <h3>${app.name}</h3>
            <small>${app.bundleId}</small>
            <p>v${app.version} · iOS ≥ ${app.minIOS}</p>
          </div>
        </div>
        <div class="tags">${app.tags.map(t=>`<span>#${t}</span>`).join(" ")}</div>
        <div style="margin-top:1rem;">
          ${app.mirrors.map(m=>`<a href="${m.url}" target="_blank" style="display:inline-block;margin-right:6px;color:#0af;">Скачать ${m.label}</a>`).join("")}
        </div>
      `;
      catalog.appendChild(card);
    });
  }

  render(data);

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    render(data.filter(app =>
      app.name.toLowerCase().includes(q) ||
      app.bundleId.toLowerCase().includes(q) ||
      app.tags.some(t => t.toLowerCase().includes(q))
    ));
  });
}

loadCatalog();
