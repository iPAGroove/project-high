// URSA Auth — v8.3 (PWA Token Fix + IndexedDB Persistence + Safe Sync)
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  getRedirectResult,
  signInWithCustomToken,
  setPersistence,
  indexedDBLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("🔥 URSA Auth v8.3 initialized (PWA Token Fix + IndexedDB Persistence)");

// === Apply PWA persistence ===
setPersistence(auth, indexedDBLocalPersistence).catch(() => {});

// === Local i18n ===
const AUTH_I18N = {
  ru: {
    token_restore: "🔄 Восстанавливаем вход...\nПроверяем сессию Firebase...",
    token_ok: "✅ Сессия успешно восстановлена!",
    token_invalid: "❌ Ошибка восстановления: недействительный токен.",
    step1_popup: "🔐 Проверка входа через Google...",
    step2_ok: "✅ Успешный вход! Обновляем профиль...",
    popup_fallback: "↪️ Откроется Safari для безопасного входа.",
    redirect_ok: "✅ Redirect вход успешен",
    logout_ok: "🚪 Вышли из аккаунта",
  },
  en: {
    token_restore: "🔄 Restoring sign-in...\nVerifying Firebase session...",
    token_ok: "✅ Session restored successfully!",
    token_invalid: "❌ Restore failed: invalid token.",
    step1_popup: "🔐 Checking Google sign-in...",
    step2_ok: "✅ Sign-in successful! Syncing profile...",
    popup_fallback: "↪️ Safari will open for secure login.",
    redirect_ok: "✅ Redirect sign-in succeeded",
    logout_ok: "🚪 Signed out",
  }
};
const langCode = () => (localStorage.getItem("ursa_lang") || "ru").slice(0, 2).toLowerCase();
const t = (k) => AUTH_I18N[langCode()]?.[k] || AUTH_I18N.ru[k];

// === Helpers ===
const setLocal = (k, v) => { try { localStorage.setItem(k, v ?? ""); } catch {} };
const clearLocalAll = () => { try { localStorage.clear(); } catch {} };

// === Wait for user ===
const waitForAuth = () =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u); } });
    setTimeout(() => resolve(auth.currentUser), 3000);
  });

// === Firestore sync ===
async function syncUser(u) {
  if (!u) u = await waitForAuth();
  if (!u) return;

  const ref = doc(db, "ursa_users", u.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid, email: u.email || "", name: u.displayName || "",
      photo: u.photoURL || "", status: "free", created_at: now, last_active_at: now
    });
  } else {
    await setDoc(ref, { last_active_at: now }, { merge: true });
  }

  setLocal("ursa_uid", u.uid);
  setLocal("ursa_email", u.email || "");
  setLocal("ursa_photo", u.photoURL || "");
  setLocal("ursa_name", u.displayName || "");
  setLocal("ursa_status", snap.exists() ? snap.data().status : "free");

  if (typeof window.openSettings === "function") window.openSettings();
}

// === Token restore (PWA-safe) ===
const params = new URLSearchParams(window.location.search);
if (params.has("token")) {
  const token = params.get("token");
  console.log("🪪 Token from Safari:", token);
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;inset:0;background:#000;color:#00eaff;
    display:flex;align-items:center;justify-content:center;flex-direction:column;
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text";
    font-size:17px;text-align:center;z-index:9999;text-shadow:0 0 14px #00eaff;
  `;
  overlay.innerHTML = `<div style="font-size:26px;margin-bottom:12px;">URSA iPA</div><div>${t("token_restore")}</div>`;
  document.body.appendChild(overlay);

  const isIdToken = token.split(".").length === 3;
  (async () => {
    try {
      if (!isIdToken) await signInWithCustomToken(auth, token);
      const u = await waitForAuth();
      await syncUser(u);
      overlay.innerHTML = `<div style="font-size:26px;margin-bottom:12px;">URSA iPA</div><div>${t("token_ok")}</div>`;
      setTimeout(() => overlay.remove(), 1000);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {
      overlay.innerHTML = `<div>${t("token_invalid")}<br>${e.message}</div>`;
      setTimeout(() => overlay.remove(), 4000);
    }
  })();
}

// === Login / Logout ===
window.ursaAuthAction = async () => {
  const u = auth.currentUser;
  if (u) {
    const keepLang = localStorage.getItem("ursa_lang");
    await signOut(auth);
    clearLocalAll();
    if (keepLang) localStorage.setItem("ursa_lang", keepLang);
    if (typeof window.openSettings === "function") window.openSettings();
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  try {
    if (isStandalone) {
      alert(t("popup_fallback"));
      window.location.href = "https://ursaipa.live/auth.html";
      return;
    }
    alert(t("step1_popup"));
    const res = await signInWithPopup(auth, provider);
    alert(t("step2_ok"));
    await syncUser(res.user);
  } catch (e) {
    alert(t("popup_fallback"));
    await signInWithRedirect(auth, provider);
  }
};

// === Redirect handler ===
getRedirectResult(auth).then(async (res) => {
  if (res?.user) await syncUser(res.user);
}).catch(console.error);

// === Live watcher ===
onAuthStateChanged(auth, async (u) => {
  if (u) await syncUser(u);
  else clearLocalAll();
});
