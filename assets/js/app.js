// assets/js/app.js
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
function setIcons(lang){
  const g = document.getElementById("navGamesIcon");
  const a = document.getElementById("navAppsIcon");
  const h = document.getElementById("navHelpIcon");
  const l = document.getElementById("navLangIcon");
  if (g) g.src = ICONS.games;
  if (a) a.src = ICONS.apps;
  if (h) h.src = ICONS.help;
  if (l) l.src = ICONS.lang?.[lang] || ICONS.lang.ru;
}

// ===== i18n =====
const I18N = {
  ru: {
    search_ph: "Поиск по названию, bundleId, тегам…",
    nav_games: "Игры",
    nav_apps: "Приложения",
    help_title: "Помощь",
    help_p1: "Это каталог IPA. Нажимай на карточку — внутри описание и кнопка загрузки.",
    help_p2: "Чтобы добавить приложение, используй админ-панель.",
    help_p3: "Фильтр «Игры» показывает записи с тегом games, «Приложения» — всё остальное.",
    download: "Загрузить IPA"
  },
  en: {
    search_ph: "Search by name, bundleId, tags…",
    nav_games: "Games",
    nav_apps: "Apps",
    help_title: "Help",
    help_p1: "Tap a card to see details and the download button.",
    help_p2: "To add an app, use the admin panel.",
    help_p3: "“Games” shows items with the games tag; “Apps” shows the rest.",
    download: "Download IPA"
  }
};

let lang = (localStorage.getItem("ursa_lang") || (navigator.language||"ru").slice(0,2)).toLowerCase();
if (!I18N[lang]) lang = "ru";
window.__t = (k)=> (I18N[lang] && I18N[lang][k]) || k;

// ===== HELPERS =====
function setTexts() {
  const s = document.getElementById("search");
  if (s) s.placeholder = __t("search_ph");
  const lc = document.getElementById("lang-code");
  if (lc) lc.textContent = lang.toUpperCase();
}
function emptyState(text) {
  const root = document.getElementById("catalog");
  root.innerHTML = `<div style="opacity:.7;text-align:center;padding:40px 16px;">${text||"Пока нет приложений"}</div>`;
}
function prettyBytes(num) {
  if (!num || isNaN(num)) return "";
  const u = ["B","KB","MB","GB"];
  const e = Math.min(Math.floor(Math.log(num)/Math.log(1024)), u.length-1);
  return `${(num/Math.pow(1024,e)).toFixed(e?1:0)} ${u[e]}`;
}
function normalize(doc) {
  return {
    id: doc.ID || doc.id || "",
    name: doc.NAME || doc.name || "",
    bundleId: doc["Bundle ID"] || doc.bundleId || "",
    version: doc.Version || doc.version || "",
    minIOS: doc["minimal iOS"] || doc.minIOS || "",
    sizeBytes: Number(doc.sizeBytes || 0),
    iconUrl: doc.iconUrl || "",
    downloadUrl: doc.DownloadUrl || doc.downloadUrl || "",
    features: doc.features || "",
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? String(doc.tags).split(",").map(s=>s.trim()) : [])
  };
}
function isGame(app){
  return (app.tags||[]).map(t=>String(t).toLowerCase()).includes("games");
}

// ===== MAIN =====
document.addEventListener("DOMContentLoaded", async ()=>{
  setIcons(lang);
  setTexts();

  const snap = await getDocs(collection(db, "ursa_ipas"));
  const all = snap.docs.map(d => normalize(d.data()));

  const state = { all, q:"", tab:"games" };

  function apply(){
    const q = state.q.trim().toLowerCase();
    const list = state.all.filter(app=>{
      const byTab = state.tab==="games" ? isGame(app) : !isGame(app);
      if (!byTab) return false;
      if (!q) return true;
      return (
        (app.name||"").toLowerCase().includes(q) ||
        (app.bundleId||"").toLowerCase().includes(q) ||
        (app.features||"").toLowerCase().includes(q) ||
        (app.tags||[]).some(t=>(t||"").toLowerCase().includes(q))
      );
    });
    if (!list.length) emptyState(lang==="ru" ? "Ничего не найдено" : "Nothing found");
    else window.renderCatalog(list);
  }

  // поиск
  document.getElementById("search").addEventListener("input",(e)=>{ state.q = e.target.value; apply(); });

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
    setTexts();
    setIcons(lang);
    apply();
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

  apply(); // первый рендер
});
