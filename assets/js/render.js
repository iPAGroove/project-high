import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

function prettyBytes(num) {
  if (!num) return "0 B";
  const u = ["B","KB","MB","GB","TB"];
  const e = Math.min(Math.floor(Math.log(num)/Math.log(1024)), u.length-1);
  return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
}

// === РЕНДЕРИНГ КАРТОЧЕК ===
window.renderCatalog = function(apps) {
  const root = document.getElementById("catalog");
  root.innerHTML = "";
  apps.forEach(app => {
    const el = document.createElement("article");
    el.className = "card"; 
    el.setAttribute("role","listitem"); 
    el.tabIndex = 0;

    el.innerHTML = `
      <div class="row">
        <img class="icon" src="${app["iconUrl"]}" alt="" loading="lazy" referrerpolicy="no-referrer">
        <div>
          <h3>${app["NAME"]}</h3>
          <div class="meta">${app["Bundle ID"]||""}</div>
          <div class="meta">
            v${app["Version"]||""}
            ${app["minimal iOS"] ? ` · iOS ≥ ${app["minimal iOS"]}` : ""}
            ${app["sizeBytes"] ? ` · ${prettyBytes(app["sizeBytes"])}` : ""}
          </div>
        </div>
      </div>
    `;

    const open = ()=>openModal(app);
    el.addEventListener("click", open);
    el.addEventListener("keypress",(e)=>{ if(e.key==="Enter") open(); });
    root.appendChild(el);
  });
};

// === МОДАЛКА ===
const modal = document.getElementById("modal");

function escapeHTML(s){
  return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

function openModal(app){
  document.getElementById("app-icon").src = app["iconUrl"];
  document.getElementById("app-title").textContent = app["NAME"] || "";
  document.getElementById("app-bundle").textContent = app["Bundle ID"] || "";
  document.getElementById("app-info").textContent =
    `v${app["Version"]||""}${app["minimal iOS"]?` · iOS ≥ ${app["minimal iOS"]}`:""}${app["sizeBytes"]?` · ${prettyBytes(app["sizeBytes"])}`:""}`;

  const feats = app["features"] ? app["features"].split(",").map(f=>f.trim()) : [];
  document.getElementById("app-desc").innerHTML = feats.length
    ? `<div class="meta" style="margin-bottom:6px">Hack Features</div>
       <ul class="bullets">${feats.map(f=>`<li>${escapeHTML(f)}`).join("")}</ul>`
    : "";

  const dl = document.getElementById("dl-buttons");
  dl.innerHTML = "";
  if (app["DownloadUrl"]){
    const a = document.createElement("a");
    a.className = "btn";
    a.href = app["DownloadUrl"]; 
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

// === ЗАГРУЗКА С Firestore ===
async function loadCatalog(){
  const snap = await getDocs(collection(db, "ursa_ipas"));
  const apps = [];
  snap.forEach((docSnap)=> apps.push(docSnap.data())); // без нормализации
  window.renderCatalog(apps);
}

document.addEventListener("DOMContentLoaded", loadCatalog);
