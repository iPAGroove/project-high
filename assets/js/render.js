(function () {
  function prettyBytes(num){
    if(!num) return "0 B";
    const u=["B","KB","MB","GB","TB"]; const e=Math.min(Math.floor(Math.log(num)/Math.log(1024)),u.length-1);
    return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
  }
  function deeplinks(url){
    const enc = encodeURIComponent(url);
    return [
      { label:"Scarlet", url:`scarlet://install?url=${enc}` },
      { label:"GBox",    url:`gbox://install?url=${enc}` },
      { label:"eSign",   url:`esign://install?url=${enc}` }
    ];
  }

  // ==== КАТАЛОГ (карточки без кнопки) ====
  window.renderCatalog = function(apps){
    const root=document.getElementById("catalog"); root.innerHTML="";
    apps.forEach(app=>{
      const el=document.createElement("article");
      el.className="card"; el.setAttribute("role","listitem"); el.tabIndex=0;
      el.innerHTML=`
        <div class="row">
          <img class="icon" src="${app.iconUrl}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <div>
            <h3>${app.name}</h3>
            <div class="meta">${app.bundleId}</div>
            <div class="meta">v${app.version}${app.minIOS?` · iOS ≥ ${app.minIOS}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}</div>
          </div>
        </div>
        <div class="tags">${(app.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>
      `;
      el.addEventListener("click",()=>openModal(app));
      el.addEventListener("keypress",(e)=>{ if(e.key==="Enter") openModal(app); });
      root.appendChild(el);
    });
  };

  // ==== МОДАЛКА ====
  const modal = document.getElementById("modal");
  const $ = (id)=>document.getElementById(id);

  function fillIf(el, html){ el.innerHTML = html || ""; el.style.display = html ? "" : "none"; }

  function openModal(app){
    // header
    $("app-icon").src = app.iconUrl;
    $("app-title").textContent = app.name;
    $("app-bundle").textContent = app.bundleId || "";
    $("app-info").textContent = `v${app.version}${app.minIOS?` · iOS ≥ ${app.minIOS}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}`;

    // tags
    $("app-tags").innerHTML = (app.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("");

    // description
    fillIf($("app-desc"), app.description ? `<div class="meta" style="margin-bottom:6px">Описание</div><p>${escapeHTML(app.description)}</p>` : "");

    // changelog
    fillIf($("app-changelog"),
      (app.changelog && app.changelog.length)
        ? `<div class="meta" style="margin-bottom:6px">Что нового</div><ul>${app.changelog.map(c=>`<li>${escapeHTML(c)}</li>`).join("")}</ul>`
        : ""
    );

    // screenshots
    const sc = $("app-screens");
    sc.innerHTML = "";
    (app.screenshots||[]).forEach(src=>{
      const img = new Image();
      img.src = src; img.loading="lazy"; img.referrerPolicy="no-referrer";
      sc.appendChild(img);
    });
    sc.style.display = (app.screenshots && app.screenshots.length) ? "" : "none";

    // buttons
    const dl = $("dl-buttons"); dl.innerHTML="";
    if (app.mirrors && app.mirrors.length){
      const primary = app.mirrors[0];
      dl.innerHTML += `<a class="btn" href="${primary.url}" target="_blank" rel="noopener">Скачать Direct</a>`;
      deeplinks(primary.url).forEach(d=>{
        dl.innerHTML += `<a class="btn secondary" href="${d.url}">${d.label}</a>`;
      });
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

  function escapeHTML(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
})();
