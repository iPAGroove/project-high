// URSA Auth — v8.2 (Neon Restore UI + Token Type Check + Safe Popup)
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  getRedirectResult,
  signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

console.log("🔥 URSA Auth v8.2 initialized (Neon Restore + Type Check + Popup Fallback)");

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
    sync_err_user: "⚠️ Не удалось загрузить профиль из Firestore",
    sync_err_signer: "⚠️ Не удалось загрузить сертификат",
    no_google: "❌ Ошибка запуска Google-входа",
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
    sync_err_user: "⚠️ Failed to load user profile",
    sync_err_signer: "⚠️ Failed to load signer",
    no_google: "❌ Could not start Google sign-in",
  }
};
const langCode = () => {
  const l = (localStorage.getItem("ursa_lang") || navigator.language || "ru").slice(0, 2).toLowerCase();
  return AUTH_I18N[l] ? l : "ru";
};
const t = (k) => AUTH_I18N[langCode()]?.[k] || AUTH_I18N.ru[k];

// === Helpers ===
const setLocal = (k, v) => { try { localStorage.setItem(k, v ?? ""); } catch {} };
const removeLocal = (k) => { try { localStorage.removeItem(k); } catch {} };
const clearLocalAll = () => { try { localStorage.clear(); } catch {} };

// === Wait for user ===
const waitForAuth = () =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u); } });
    setTimeout(() => resolve(auth.currentUser), 3000);
  });

// === Firestore user sync ===
async function syncUser(u) {
  if (!u) u = await waitForAuth();
  if (!u) return console.error("❌ Auth not ready");

  const ref = doc(db, "ursa_users", u.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const lang = langCode();

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid, email: u.email || "", name: u.displayName || "",
      photo: u.photoURL || "", status: "free", language: lang,
      created_at: now, last_active_at: now,
    });
  } else {
    await setDoc(ref, { last_active_at: now, language: lang }, { merge: true });
  }

  setLocal("ursa_uid", u.uid);
  setLocal("ursa_email", u.email || "");
  setLocal("ursa_photo", u.photoURL || "");
  setLocal("ursa_name", u.displayName || "");
  setLocal("ursa_status", snap.exists() ? snap.data().status : "free");

  // signer
  try {
    const sref = doc(db, "ursa_signers", u.uid);
    const ssnap = await getDoc(sref);
    if (ssnap.exists()) {
      const s = ssnap.data();
      setLocal("ursa_cert_account", s.account || "");
      setLocal("ursa_cert_exp", s.expires || "");
    } else {
      removeLocal("ursa_cert_account"); removeLocal("ursa_cert_exp");
    }
  } catch (e) { console.warn("Signer sync:", e); }

  if (typeof window.openSettings === "function") window.openSettings();
}

// === Safari token restore (UI + type check) ===
const params = new URLSearchParams(window.location.search);
if (params.has("token")) {
  const token = params.get("token");
  console.log("🪪 Received token from Safari redirect");

  // Neon overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;inset:0;background:#000;color:#00eaff;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text";
    font-size:17px;text-align:center;z-index:9999;
    text-shadow:0 0 14px #00eaff,0 0 32px #00eaff;
    transition:opacity 0.4s;
  `;
  overlay.innerHTML = `<div style="font-size:26px;font-weight:700;margin-bottom:12px;">URSA iPA</div><div>${t("token_restore")}</div>`;
  document.body.appendChild(overlay);

  // ID token check
  if (token.split(".").length === 3) {
    console.log("✅ Firebase ID token detected");
    overlay.innerHTML = `<div style="font-size:26px;font-weight:700;margin-bottom:12px;">URSA iPA</div><div>${t("token_ok")}</div>`;
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
      window.history.replaceState({}, document.title, "/");
      if (typeof window.openSettings === "function") window.openSettings();
    }, 1300);
  } else {
    // Real custom token
    signInWithCustomToken(auth, token)
      .then(async () => {
        console.log("✅ Custom token login complete");
        overlay.innerHTML = `<div style="font-size:26px;font-weight:700;margin-bottom:12px;">URSA iPA</div><div>${t("token_ok")}</div>`;
        const u = await waitForAuth(); await syncUser(u);
        setTimeout(() => overlay.remove(), 1200);
      })
      .catch((e) => {
        console.error("❌ Token auth failed:", e);
        overlay.innerHTML = `<div style="font-size:26px;font-weight:700;margin-bottom:12px;">URSA iPA</div><div>${t("token_invalid")}<br><small>${e.message}</small></div>`;
        setTimeout(() => overlay.remove(), 4000);
      });
  }
}

// === Login / Logout ===
window.ursaAuthAction = async () => {
  const u = auth.currentUser;
  if (u) {
    await signOut(auth);
    console.log(t("logout_ok"));
    clearLocalAll();
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
    console.warn("Popup failed → redirect", e);
    alert(t("popup_fallback"));
    await signInWithRedirect(auth, provider);
  }
};

// === Redirect handler ===
getRedirectResult(auth)
  .then(async (res) => {
    if (res?.user) {
      console.log(t("redirect_ok"));
      await syncUser(res.user);
      if (window.location.hostname.includes("firebaseapp.com"))
        window.location.href = "https://ursaipa.live";
    }
  })
  .catch((e) => console.error("Redirect error:", e));

// === Live watcher ===
onAuthStateChanged(auth, async (u) => {
  if (u) {
    try {
      const ref = doc(db, "ursa_users", u.uid);
      const snap = await getDoc(ref);
      setLocal("ursa_status", snap.exists() ? (snap.data().status || "free") : "free");
      await setDoc(ref, { last_active_at: new Date().toISOString() }, { merge: true });
      console.log(`👤 Active: ${u.email}`);
    } catch (e) { console.warn("Sync user error:", e); }
  } else {
    clearLocalAll();
    console.log("👋 Signed out");
  }
});
