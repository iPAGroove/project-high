// v7 — фильтр Игры/Приложения, RU/EN, help, PNG-иконки в одном конфиге
(function () {
  // ====== ПОДСТАВЬ СВОИ ССЫЛКИ НА PNG ======
  const ICONS = {
    games: "https://YOUR.CDN/nav-games.png",        // ← замени
    apps:  "https://YOUR.CDN/nav-apps.png",         // ← замени
    help:  "https://YOUR.CDN/nav-help.png",         // ← замени
    lang: {
      ru: "https://YOUR.CDN/nav-lang-ru.png",       // ← замени (RU)
      en: "https://YOUR.CDN/nav-lang-en.png"        // ← замени (EN)
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
    if (l) l.src = (ICONS.lang?.[lang] || ICONS.lang?.ru || "");
  }

  // ====== i18n ======
  const I18N = {
    ru: {
      search_ph: "Поиск по названию, bundleId, тегам…",
      nav_games: "Игры",
      nav_apps: "Приложения",
      help_title: "Помощь",
      help_p1: "Это каталог IPA. Нажимай на карточку — внутри описание и кнопка загрузки.",
      help_p2: "Чтобы добавить приложение, отредактируй data/ipas.json и сделай commit.",
      help_p3: "Фильтр «Игры» показывает записи с тегом games, «Приложения» — всё остальное.",
      download: "Загрузить IPA"
    },
    en: {
      search_ph: "Search by name, bundleId, tags…",
      nav_games: "Games",
      nav_apps: "Apps",
      help_title: "Help",
      help_p1: "Tap a card to see details and the download button.",
      help_p2: "To add an app, edit data/ipas.json and commit.",
      help_p3: "“Games” shows items with the games tag; “Apps” shows the rest.",
      download: "Download IPA"
    }
  };

  let lang = (localStorage.getItem("ursa_lang") || (navigator.language||"ru").slice(0,2)).toLowerCase();
  if (!I18N[lang]) lang = "ru";
  window.__t = (k)=> (I18N[lang] && I18N[lang][k]) || k;

  const state = { all: [], q: "", tab: "games" };

  function setTexts() {
    const $ = (sel)=>document.querySelectorAll(sel);
    const s = document.getElementById("search");
    if (s) s.placeholder = __t("search_ph");
    $("[data-i18n]").forEach(el=>{ el.textContent = __t(el.getAttribute("data-i18n")); });
    const lc = document.getElementById("lang-code");
    if (lc) lc.textContent = lang.toUpperCase();
  }

  function emptyState(text) {
    const root = document.getElementById("catalog");
    root.innerHTML = `<div style="opacity:.7;text-align:center;padding:40px 16px;">${text||"Пока нет приложений"}</div>`;
  }

  function isGame(app){
    return (app.tags||[]).map(t=>String(t).toLowerCase()).includes("games");
  }

  function apply(){
    const q = state.q.trim().toLowerCase();
    const list = state.all.filter(app=>{
      const byTab = state.tab === "games" ? isGame(app) : !isGame(app);
      if (!byTab) return false;
      if (!q) return true;
      return (
        (app.name||"").toLowerCase().includes(q) ||
        (app.bundleId||"").toLowerCase().includes(q) ||
        (app.tags||[]).some(t=>(t||"").toLowerCase().includes(q))
      );
    });
    if (!list.length) emptyState(lang==="ru" ? "Ничего не найдено" : "Nothing found");
    else window.renderCatalog(list);
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    // иконки + текст
    setIcons(lang);
    setTexts();

    // загрузка данных (data/ipas.json -> fallback ipas.json)
    try { state.all = await fetchJson("data/ipas.json"); }
    catch { try { state.all = await fetchJson("ipas.json"); } catch { emptyState("Не удалось загрузить каталог"); return; } }

    apply();

    // поиск
    document.getElementById("search").addEventListener("input",(e)=>{ state.q = e.target.value; apply(); });

    // таббар (games/apps)
    const bar = document.getElementById("tabbar");
    bar.addEventListener("click",(e)=>{
      const pill = e.target.closest(".nav-btn[data-tab]");
      if (pill){
        state.tab = pill.dataset.tab; // games | apps
        bar.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
        pill.classList.add("active");
        apply();
        return;
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
  });
})();
