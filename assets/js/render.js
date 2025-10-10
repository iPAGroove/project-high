// assets/js/render.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ⚡️ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== HELPERS ======
function prettyBytes(num) {
  if (!num) return "";
  const u = ["B","KB","MB","GB"];
  const e = Math.min(Math.floor(Math.log(num)/Math.log(1024)), u.length-1);
  return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
}
function escapeHTML(s){
  return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

// ====== РЕНДЕР КАРТОЧЕК ======
function renderCatalog(apps) {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";
  apps.forEach(app => {
    const el = document.createElement("article");
    el.className = "card";
    el.setAttribute("role","listitem");
    el.tabIndex = 0;

    el.innerHTML = `
      <div class="row">
        <img class="icon" src="${app.iconUrl}" alt="">
        <div>
          <h3>${app.NAME || app.name}</h3>
          <div class="meta">${app["Bundle ID"] || app.bundleId || ""}</div>
          <div class="meta">
            v${app.Version || app.version || ""}
            ${app["minimal iOS"] || app.minIOS ? ` · iOS ≥ ${app["minimal iOS"] || app.minIOS}` : ""}
            ${app.sizeBytes ? ` · ${prettyBytes(app.sizeBytes)}` : ""}
          </div>
        </div>
      </div>
    `;

    const open = ()=>openModal(app);
    el.addEventListener("click", open);
    el.addEventListener("keypress",(e)=>{ if(e.key==="Enter") open(); });
    catalog.appendChild(el);
  });
}

// ====== МОДАЛКА ======
const modal = document.getElementById("modal");

function openModal(app){
  document.getElementById("app-icon").src = app.iconUrl;
  document.getElementById("app-title").textContent = app.NAME || app.name || "";
  document.getElementById("app-bundle").textContent = app["Bundle ID"] || app.bundleId || "";
  document.getElementById("app-info").textContent =
    `v${app.Version || app.version || ""}`
    + (app["minimal iOS"] || app.minIOS ? ` · iOS ≥ ${app["minimal iOS"] || app.minIOS}` : "")
    + (app.sizeBytes ? ` · ${prettyBytes(app.sizeBytes)}` : "");

  const feats = app.features ? app.features.split(",").map(f=>f.trim()) : [];
  document.getElementById("app-desc").innerHTML = feats.length
    ? `<div class="meta" style="margin-bottom:6px">Hack Features</div>
       <ul class="bullets">${feats.map(f=>`<li>${escapeHTML(f)}`).join("")}</ul>`
    : "";

  const dl = document.getElementById("dl-buttons");
  dl.innerHTML = "";
  if (app.DownloadUrl || app.downloadUrl){
    const a = document.createElement("a");
    a.className = "btn";
    a.href = app.DownloadUrl || app.downloadUrl;
    a.target = "_blank"; 
    a.rel = "noopener";
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

// ====== ЗАГРУЗКА + ПОИСК ======
async function loadCatalog() {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const data = snap.docs.map(d => d.data());

  renderCatalog(data);

  const search = document.getElementById("search");
  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    const filtered = data.filter(app =>
      (app.NAME || app.name || "").toLowerCase().includes(q) ||
      (app["Bundle ID"] || app.bundleId || "").toLowerCase().includes(q) ||
      (app.features || "").toLowerCase().includes(q)
    );
    renderCatalog(filtered);
  });
}

document.addEventListener("DOMContentLoaded", loadCatalog);
