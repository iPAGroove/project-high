// URSA Auth — v8.4 (Silent Restore + Clean UX + Safe Popup)
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

console.log("🔥 URSA Auth v8.4 initialized (Silent Restore + Clean UX)");

// === Local i18n ===
const AUTH_I18N = {
  ru: {
    step1_popup: "🔐 Проверка входа через Google...",
    step2_ok: "✅ Успешный вход! Обновляем профиль...",
    popup_fallback: "↪️ Откроется Safari для безопасного входа.",
    redirect_ok: "✅ Redirect вход успешен",
    logout_ok: "🚪 Вышли из аккаунта",
    sync_err_user: "⚠️ Не удалось загрузить профиль",
    sync_err_signer: "⚠️ Не удалось загрузить сертификат",
    no_google: "❌ Ошибка запуска Google-входа",
  },
  en: {
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
      uid: u.uid,
      email: u.email || "",
      name: u.displayName || "",
      photo: u.photoURL || "",
      status: "free",
      language: lang,
      created_at: now,
      last_active_at: now,
    });
  } else {
    await setDoc(ref, { last_active_at: now, language: lang }, { merge: true });
  }

  setLocal("ursa_uid", u.uid);
  setLocal("ursa_email", u.email || "");
  setLocal("ursa_photo", u.photoURL || "");
  setLocal("ursa_name", u.displayName || "");
  setLocal("ursa_status", snap.exists() ? snap.data().status : "free");

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
  } catch (e) {
    console.warn(t("sync_err_signer"), e);
  }

  if (typeof window.openSettings === "function") window.openSettings();
}

// === Silent Safari Token Restore ===
const params = new URLSearchParams(window.location.search);
if (params.has("token")) {
  const token = params.get("token");
  console.log("🪪 Token received from Safari redirect");

  // Если токен похож на ID-токен Firebase — просто чистим URL
  if (token.split(".").length === 3) {
    console.log("✅ Firebase ID token detected — skipping restore");
    window.history.replaceState({}, document.title, "/");
    if (typeof window.openSettings === "function") window.openSettings();
  } else {
    // Пробуем выполнить вход, но без UI ошибок
    signInWithCustomToken(auth, token)
      .then(async () => {
        console.log("✅ Custom token sign-in successful");
        const u = await waitForAuth(); await syncUser(u);
      })
      .catch(() => {
        console.log("⚠️ Invalid token, skipping restore");
      })
      .finally(() => {
        window.history.replaceState({}, document.title, "/");
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
    } catch (e) {
      console.warn(t("sync_err_user"), e);
    }
  } else {
    clearLocalAll();
    console.log("👋 Signed out");
  }

  if (document.getElementById("settings-modal")?.classList.contains("open")) {
    if (typeof window.openSettings === "function") window.openSettings();
  }
});
