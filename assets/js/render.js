import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(function () {
  function prettyBytes(num){
    if(!num) return "0 B";
    const u=["B","KB","MB","GB","TB"];
    const e=Math.min(Math.floor(Math.log(num)/Math.log(1024)),u.length-1);
    return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
  }

  // карточки
  window.renderCatalog = function(apps){
    const root = document.getElementById("catalog");
    root.innerHTML = "";
    apps.forEach(app=>{
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML = `
        <div class="row">
          <img class="icon" src="${app.iconUrl}" alt="" loading="lazy">
          <div>
            <h3>${app.NAME}</h3>
            <div class="meta">${app["Bundle ID"]||""}</div>
            <div class="meta">v${app.Version||""}${app["minimal iOS"]?` · iOS ≥ ${app["minimal iOS"]}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}</div>
          </div>
        </div>
      `;
      const open = ()=>openModal(app);
      el.addEventListener("click", open);
      root.appendChild(el);
    });
  };

  // модалка
  const modal = document.getElementById("modal");

  function openModal(app){
    document.getElementById("app-icon").src = app.iconUrl;
    document.getElementById("app-title").textContent = app.NAME || "";
    document.getElementById("app-bundle").textContent = app["Bundle ID"] || "";
    document.getElementById("app-info").textContent =
      `v${app.Version||""}${app["minimal iOS"]?` · iOS ≥ ${app["minimal iOS"]}`:""}${app.sizeBytes?` · ${prettyBytes(app.sizeBytes)}`:""}`;

    document.getElementById("app-desc").innerHTML = app.features
      ? `<div class="meta" style="margin-bottom:6px">Hack Features</div>
         <ul class="bullets">${app.features.split(",").map(f=>`<li>${f.trim()}</li>`).join("")}</ul>`
      : "";

    const dl = document.getElementById("dl-buttons");
    dl.innerHTML = "";
    if (app.DownloadUrl){
      const a = document.createElement("a");
      a.className = "btn";
      a.href = app.DownloadUrl; a.target = "_blank"; a.rel = "noopener";
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

  // Загружаем данные из Firestore
  document.addEventListener("DOMContentLoaded", async ()=>{
    const snap = await getDocs(collection(window.db, "ipas"));
    const list = snap.docs.map(d => d.data());
    window.renderCatalog(list);
  });
})();
