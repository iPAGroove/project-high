// URSA IPA — Firestore + i18n + темы
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

// ===== ICONS =====
const ICONS = {
  games: "https://store10.gofile.io/download/direct/3335936d-a58c-48bd-8686-21988ca6a23d/IMG_9617.png",
  apps:  "https://store5.gofile.io/download/direct/5a4f1b52-2705-4fc5-8bf4-6ed9b70ffdf8/IMG_9616.png",
  help:  "https://store5.gofile.io/download/direct/685a39aa-260d-4b30-a1a6-5e22f74f4983/IMG_9615.png",
  lang: {
    ru: "https://store5.gofile.io/download/direct/4dba02e0-4e51-4eb4-b99b-139946f857cb/IMG_9613.png",
    en: "https://store5.gofile.io/download/direct/4dba02e0-4e51-4eb4-b99b-139946f857cb/IMG_9613.png"
  }
};

// ===== i18n =====
const I18N = {
  ru: {
    search_ph: "Поиск по названию, bundleId, тегам…",
    nav_games: "Игры",
    nav_apps: "Приложения",
    help_title: "Помощь",
    help_p1: "Это каталог IPA. Нажимай на карточку — внутри описание и кнопка загрузки.",
    help_p2: "Все данные берутся из Firestore (коллекция ursa_ipas).",
    help_p3: "Для добавления/редактирования используй админ-панель.",
    download: "Загрузить IPA",
    hack_features: "Функции хака",
    not_found: "Ничего не найдено",
    empty: "Пока нет приложений"
  },
  en: {
    search_ph: "Search by name, bundleId, tags…",
    nav_games: "Games",
    nav_apps: "Apps",
    help_title: "Help",
    help_p1: "This is an IPA catalog. Tap a card to see description and download button.",
    help_p2: "All data comes directly from Firestore (collection ursa_ipas).",
    help_p3: "To add/edit apps, use the admin panel.",
    download: "Download IPA",
    hack_features: "Hack Features",
    not_found: "Nothing found",
    empty: "No apps yet"
  }
};

let lang = (localStorage.getItem("ursa_lang") || (navigator.language||"ru").slice(0,2)).toLowerCase();
if (!I18N[lang]) lang = "ru";
window.__t = (k)=> (I18N[lang] && I18N[lang][k]) || k;

// ===== HELPERS =====
function prettyBytes(num) {
  if (!num) return "";
  const u = ["B","KB","MB","GB"];
  const e = Math.min(Math.floor(Math.log(num)/Math.log(1024)), u.length-1);
  const val = num / Math.pow(1024, e);
  const fixed = (val >= 10) ? val.toFixed(0) : val.toFixed(1); // до 10 — с десятыми, больше 10 — целое
  return `${fixed} ${u[e]}`;
}
function escapeHTML(s){
  return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

// === НОРМАЛИЗАЦИЯ Firestore-документа ===
function normalize(doc) {
  return {
    id: doc.ID || doc.id || "",
    name: doc.NAME || doc.name || "",
    bundleId: doc["Bundle ID"] || doc.bundleId || "",
    version: doc.Version || doc.version || "",
    minIOS: doc["minimal iOS"] || doc.minIOS || "",
    sizeBytes: doc.sizeBytes || 0,
    iconUrl: doc.iconUrl || "",
    downloadUrl: doc.DownloadUrl || doc.downloadUrl || "",
    features: doc.features || "",
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? String(doc.tags).split(",").map(s=>s.trim()) : [])
  };
}

// ===== RENDER =====
function renderCatalog(apps) {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";
  if (!apps.length) {
    catalog.innerHTML = `<div style="opacity:.7;text-align:center;padding:40px 16px;">${__t("empty")}</div>`;
    return;
  }

  apps.forEach(app => {
    const el = document.createElement("article");
    el.className = "card";
    el.setAttribute("role","listitem");
    el.tabIndex = 0;

    el.innerHTML = `
      <div class="row">
        <img class="icon" src="${app.iconUrl}" alt="">
        <div>
          <h3>${app.name}</h3>
          <div class="meta">${app.bundleId || ""}</div>
          <div class="meta">
            v${app.version}
            ${app.minIOS ? ` · iOS ≥ ${app.minIOS}` : ""}
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

// ===== MODAL =====
const modal = document.getElementById("modal");
function openModal(app){
  document.getElementById("app-icon").src = app.iconUrl;
  document.getElementById("app-title").textContent = app.name || "";
  document.getElementById("app-bundle").textContent = app.bundleId || "";
  document.getElementById("app-info").textContent =
    `v${app.version || ""}`
    + (app.minIOS ? ` · iOS ≥ ${app.minIOS}` : "")
    + (app.sizeBytes ? ` · ${prettyBytes(app.sizeBytes)}` : "");

  const feats = app.features ? app.features.split(",").map(f=>f.trim()) : [];
  document.getElementById("app-desc").innerHTML = feats.length
    ? `<div class="meta" style="margin-bottom:6px">${__t("hack_features")}</div>
       <ul class="bullets">${feats.map(f=>`<li>${escapeHTML(f)}`).join("")}</ul>`
    : "";

  const dl = document.getElementById("dl-buttons");
  dl.innerHTML = "";
  if (app.downloadUrl){
    const a = document.createElement("a");
    a.className = "btn";
    a.href = app.downloadUrl;
    a.target = "_blank"; 
    a.rel = "noopener";
    a.textContent = __t("download");
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

// ===== MAIN =====
document.addEventListener("DOMContentLoaded", async ()=>{
  // иконки
  document.getElementById("navGamesIcon").src = ICONS.games;
  document.getElementById("navAppsIcon").src = ICONS.apps;
  document.getElementById("navHelpIcon").src = ICONS.help;
  document.getElementById("navLangIcon").src = ICONS.lang?.[lang] || ICONS.lang.ru;

  // плейсхолдер поиска
  const search = document.getElementById("search");
  search.placeholder = __t("search_ph");
  document.getElementById("lang-code").textContent = lang.toUpperCase();

  // загрузка данных из Firestore
  let state = { all:[], q:"", tab:"games" };
  try {
    const snap = await getDocs(collection(db, "ursa_ipas"));
    state.all = snap.docs.map(d => normalize(d.data()));
  } catch(err){
    console.error("Ошибка загрузки Firestore:", err);
  }

  function apply(){
    const q = state.q.trim().toLowerCase();
    const list = state.all.filter(app=>{
      const byTab = state.tab==="games" ? app.tags.includes("games") : !app.tags.includes("games");
      if (!byTab) return false;
      if (!q) return true;
      return (
        (app.name||"").toLowerCase().includes(q) ||
        (app.bundleId||"").toLowerCase().includes(q) ||
        (app.features||"").toLowerCase().includes(q) ||
        app.tags.some(t=>(t||"").toLowerCase().includes(q))
      );
    });
    if (!list.length) {
      document.getElementById("catalog").innerHTML = `<div style="opacity:.7;text-align:center;padding:40px 16px;">${__t("not_found")}</div>`;
    } else renderCatalog(list);
  }

  // поиск
  search.addEventListener("input", ()=>{ state.q = search.value; apply(); });

  // таббар
  const bar = document.getElementById("tabbar");
  bar.addEventListener("click",(e)=>{
    const pill = e.target.closest(".nav-btn[data-tab]");
    if (pill){
      state.tab = pill.dataset.tab;
      bar.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
      pill.classList.add("active");
      apply();
    }
  });

  // язык
  document.getElementById("lang-btn").addEventListener("click", ()=>{
    lang = (lang === "ru") ? "en" : "ru";
    localStorage.setItem("ursa_lang", lang);
    location.reload();
  });

  // help
  const help = document.getElementById("help-modal");
  document.getElementById("help-btn").addEventListener("click", ()=>{
    help.classList.add("open"); help.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  });
  help.addEventListener("click",(e)=>{
    if (e.target.hasAttribute("data-close") || e.target === help) {
      help.classList.remove("open"); help.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
    }
  });

  // кнопка темы
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // первый рендер
  apply();
});
