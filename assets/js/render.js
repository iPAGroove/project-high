(function () {
  function prettyBytes(num){
    if(!num) return "0 B";
    const u=["B","KB","MB","GB","TB"];
    const e=Math.min(Math.floor(Math.log(num)/Math.log(1024)),u.length-1);
    return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
  }

  // ===== КАТАЛОГ: карточка без кнопок, по тапу — модалка
  window.renderCatalog = function(apps){
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
        <div class="tags">${(app.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>
      `;
      const open = ()=>openModal(app);
      el.addEventListener("click", open);
      el.addEventListener("keypress",(e)=>{ if(e.key==="Enter") open(); });
      root.appendChild(el);
    });
  };

  // ===== МОДАЛКА
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

    document.getElementById("app-tags").innerHTML =
      (app.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("");

    // Hack Features — чистым списком
    const feats = Array.isArray(app.features) ? app.features
      : (app.description ? app.description.split(/\r?\n/).map(s=>s.replace(/^[\s•\-–—]+/,"").trim()).filter(Boolean) : []);
    document.getElementById("app-desc").innerHTML = feats.length
      ? `<div class="meta" style="margin-bottom:6px">Hack Features</div>
         <ul class="bullets">${feats.map(f=>`<li>${escapeHTML(f)}`).join("")}</ul>`
      : "";

    // 1 кнопка загрузки
    const dl = document.getElementById("dl-buttons");
    dl.innerHTML = "";
    const url = app?.mirrors?.[0]?.url;
    if (url){
      const a = document.createElement("a");
      a.className = "btn";
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Загрузить IPA";
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
