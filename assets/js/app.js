(function () {
  const state = { all: [], q: "", filter: "all" };

  function apply(){
    const q = state.q.trim().toLowerCase();
    const f = state.filter;
    const list = state.all.filter(app=>{
      const byTag = f==="all" ? true : (app.tags||[]).some(t=>t.toLowerCase()===f);
      if(!byTag) return false;
      if(!q) return true;
      return (
        (app.name||"").toLowerCase().includes(q) ||
        (app.bundleId||"").toLowerCase().includes(q) ||
        (app.tags||[]).some(t=>(t||"").toLowerCase().includes(q))
      );
    });
    window.renderCatalog(list);
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    const res = await fetch("data/ipas.json",{cache:"no-store"});
    state.all = await res.json();
    apply();

    // поиск
    const search = document.getElementById("search");
    search.addEventListener("input",(e)=>{ state.q = e.target.value; apply(); });

    // нижняя навигация
    const bar = document.getElementById("tabbar");
    bar.addEventListener("click",(e)=>{
      const btn = e.target.closest("button[data-filter]");
      if(!btn) return;
      for (const b of bar.querySelectorAll("button")) b.classList.remove("active");
      btn.classList.add("active");
      state.filter = btn.dataset.filter;
      apply();
    });

    // тема
    document.getElementById("theme-toggle").addEventListener("click",()=>window.toggleTheme());
  });
})();
