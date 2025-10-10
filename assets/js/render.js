(function () {
  function prettyBytes(num){
    if(!num) return "0 B";
    const u=["B","KB","MB","GB","TB"];
    const e=Math.min(Math.floor(Math.log(num)/Math.log(1024)),u.length-1);
    return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
  }

  // преобразуем Firestore-док в наш фронтовый формат
  function normalizeApp(doc){
    return {
      id: doc["ID"],
      name: doc["NAME"],
      bundleId: doc["Bundle ID"],
      version: doc["Version"],
      minIOS: doc["minimal iOS"],
      sizeBytes: doc["sizeBytes"]?.toString(),
      iconUrl: doc["iconUrl"],
      downloadUrl: doc["DownloadUrl"],
      features: doc["features"]
    };
  }

  // карточки
  window.renderCatalog = function(appsRaw){
    const apps = appsRaw.map(normalizeApp);
    const root = document.getElementById("catalog");
    root.innerHTML = "";
    apps.forEach(app=>{
      const el = document.createElement("article");
      el.className = "card"; el.setAttribute("role","listitem"); el.tabIndex = 0;
      el.innerHTML = `
        <div class="row">
          <img class="icon" src="${app.iconUrl}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <div>
            <h3>${app.name}</h3>
            <div class="meta">${app.bundleId||""}</div>
            <div class="meta">v${app.version||""}${app.minIOS?` · iOS ≥ ${app.minIOS}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}</div>
          </div>
        </div>
      `;
      const open = ()=>openModal(app);
      el.addEventListener("click", open);
      el.addEventListener("keypress",(e)=>{ if(e.key==="Enter") open(); });
      root.appendChild(el);
    });
  };

  // модалка
  const modal = document.getElementById("modal");

  function escapeHTML(s){
    return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  }

  function openModal(app){
    document.getElementById("app-icon").src = app.iconUrl;
    document.getElementById("app-title").textContent = app.name || "";
    document.getElementById("app-bundle").textContent = app.bundleId || "";
    document.getElementById("app-info").textContent =
      `v${app.version||""}${app.minIOS?` · iOS ≥ ${app.minIOS}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}`;

    // features (строка через запятую)
    const feats = (app.features||"").split(",").map(f=>f.trim()).filter(Boolean);
    document.getElementById("app-desc").innerHTML = feats.length
      ? `<div class="meta" style="margin-bottom:6px">Hack Features</div>
         <ul class="bullets">${feats.map(f=>`<li>${escapeHTML(f)}`).join("")}</ul>`
      : "";

    // кнопка загрузки
    const dl = document.getElementById("dl-buttons");
    dl.innerHTML = "";
    if (app.downloadUrl){
      const a = document.createElement("a");
      a.className = "btn";
      a.href = app.downloadUrl; a.target = "_blank"; a.rel = "noopener";
      a.textContent = (window.__t ? window.__t("download") : "Загрузить IPA");
      dl.appendChild(a);
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }

  function closeModal(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }

  modal.addEventListener("click",(e)=>{
    if (e.target.hasAttribute("data-close") || e.target === modal) closeModal();
  });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
})();
