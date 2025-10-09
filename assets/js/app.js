// v5 — фильтр Игры/Приложения, язык RU/EN, help-диалог
(function () {
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
      help_p3: "“Games” shows items with the games tag, “Apps” shows the rest.",
      download: "Download IPA"
    }
  };

  // язык из localStorage или по браузеру
  let lang = (localStorage.getItem("ursa_lang") || (navigator.language||"ru").slice(0,2)).toLowerCase();
  if (!I18N[lang]) lang = "ru";
  window.__t = (k)=> (I18N[lang] && I18N[lang][k]) || k;

  const state = { all: [], q: "", tab: "games" };

  function setTexts() {
    document.getElementById("search").placeholder = __t("search_ph");
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      el.textContent = __t(key);
    });
    const code = lang.toUpperCase();
    const lc = document.getElementById("lang-code"); if (lc) lc.textContent = code;
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
    setTexts();

    // загрузка данных (data/ipas.json -> fallback ipas.json)
    try { state.all = await fetchJson("data/ipas.json"); }
    catch { try { state.all = await fetchJson("ipas.json"); } catch { emptyState("Не удалось загрузить каталог"); return; } }

    apply();

    // поиск
    document.getElementById("search").addEventListener("input",(e)=>{ state.q = e.target.value; apply(); });

    // таббар
    const bar = document.getElementById("tabbar");
    bar.addEventListener("click",(e)=>{
      const pill = e.target.closest("[data-tab]");
      if (pill){
        state.tab = pill.dataset.tab; // games | apps
        bar.querySelectorAll(".pill").forEach(b=>b.classList.remove("active"));
        bar.querySelector(`[data-tab="${state.tab}"]`).classList.add("active");
        apply();
        return;
      }
    });

    // язык
    document.getElementById("lang-btn").addEventListener("click", ()=>{
      lang = (lang === "ru") ? "en" : "ru";
      localStorage.setItem("ursa_lang", lang);
      setTexts();
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
