// ═══════════════════════════════════════════════════════
//  DB Studios — auth.js
//  Firebase v9 Modular SDK · Phone OTP Login (Invisible reCAPTCHA)
// ═══════════════════════════════════════════════════════

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, RecaptchaVerifier,
         signInWithPhoneNumber, onAuthStateChanged,
         signOut }                                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── 1. FIREBASE CONFIG ───────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyD2xYhPTzARvIucZW4_yfe31_26j2rkb7A",
  authDomain:        "db-studios-aa47c.firebaseapp.com",
  projectId:         "db-studios-aa47c",
  storageBucket:     "db-studios-aa47c.firebasestorage.app",
  messagingSenderId: "798366203596",
  appId:             "1:798366203596:web:bbb631370a19337eaecc69",
  measurementId:     "G-KTMEW111YV"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

// ─── 2. STATE ─────────────────────────────────────────
let confirmationResult = null;
let recaptchaVerifier  = null;

// ─── 3. RECAPTCHA SETUP (Invisible) ──────────────────
function setupRecaptcha() {
  // Destroy existing verifier if any (prevents duplicate widget errors)
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — OTP will be sent automatically
    },
    "expired-callback": () => {
      showAuthError("reCAPTCHA expired. Please try again.");
      resetOTPStep();
    }
  });
}

// ─── 4. SEND OTP ──────────────────────────────────────
export async function sendOTP() {
  const raw   = document.getElementById("auth-phone").value.trim();
  const phone = raw.startsWith("+") ? raw : "+91" + raw; // default India +91

  if (!/^\+\d{10,15}$/.test(phone)) {
    showAuthError("Enter a valid phone number (e.g. 9876543210)");
    return;
  }

  clearAuthError();
  setAuthLoading(true, "send");

  try {
    setupRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    showOTPStep();
  } catch (err) {
    console.error("sendOTP error:", err);
    showAuthError(friendlyError(err));
    // Reset reCAPTCHA so user can retry
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  } finally {
    setAuthLoading(false, "send");
  }
}

// ─── 5. VERIFY OTP ────────────────────────────────────
export async function verifyOTP() {
  const code = document.getElementById("auth-otp").value.trim();

  if (!/^\d{6}$/.test(code)) {
    showAuthError("Enter the 6-digit OTP sent to your phone.");
    return;
  }

  if (!confirmationResult) {
    showAuthError("Session expired. Please request a new OTP.");
    resetOTPStep();
    return;
  }

  clearAuthError();
  setAuthLoading(true, "verify");

  try {
    const result = await confirmationResult.confirm(code);
    const user   = result.user;
    // ── Success ──
    sessionStorage.setItem("dbstudios_user", JSON.stringify({
      uid:   user.uid,
      phone: user.phoneNumber,
      token: user.accessToken
    }));
    onLoginSuccess(user);
  } catch (err) {
    console.error("verifyOTP error:", err);
    showAuthError(friendlyError(err));
  } finally {
    setAuthLoading(false, "verify");
  }
}

// ─── 6. SIGN OUT ──────────────────────────────────────
export async function logOut() {
  await signOut(auth);
  sessionStorage.removeItem("dbstudios_user");
  updateNavForGuest();
}

// ─── 7. AUTH STATE OBSERVER ──────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    sessionStorage.setItem("dbstudios_user", JSON.stringify({
      uid:   user.uid,
      phone: user.phoneNumber
    }));
    updateNavForUser(user);
  } else {
    sessionStorage.removeItem("dbstudios_user");
    updateNavForGuest();
  }
});

// ─── 8. UI HELPERS ───────────────────────────────────

function onLoginSuccess(user) {
  closeAuthModal();
  updateNavForUser(user);
  // Optional: show a welcome toast using the site's existing showToast if available
  if (typeof window.showToast === "function") {
    window.showToast(`Welcome! Logged in as ${user.phoneNumber}`);
  }
}

function showOTPStep() {
  document.getElementById("auth-step-phone").style.display = "none";
  document.getElementById("auth-step-otp").style.display   = "block";
  document.getElementById("auth-otp").focus();
}

function resetOTPStep() {
  document.getElementById("auth-step-phone").style.display = "block";
  document.getElementById("auth-step-otp").style.display   = "none";
  confirmationResult = null;
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

function clearAuthError() {
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

function setAuthLoading(on, btn) {
  const id  = btn === "send" ? "auth-send-btn" : "auth-verify-btn";
  const el  = document.getElementById(id);
  if (!el) return;
  el.disabled    = on;
  el.textContent = on ? (btn === "send" ? "Sending…" : "Verifying…")
                      : (btn === "send" ? "Send OTP"  : "Verify & Login");
}

function updateNavForUser(user) {
  const loginBtn  = document.getElementById("nav-login-btn");
  const logoutBtn = document.getElementById("nav-logout-btn");
  const phoneEl   = document.getElementById("nav-user-phone");
  if (loginBtn)  loginBtn.style.display  = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-flex";
  if (phoneEl)   phoneEl.textContent     = user.phoneNumber || "User";
}

function updateNavForGuest() {
  const loginBtn  = document.getElementById("nav-login-btn");
  const logoutBtn = document.getElementById("nav-logout-btn");
  const phoneEl   = document.getElementById("nav-user-phone");
  if (loginBtn)  loginBtn.style.display  = "inline-flex";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (phoneEl)   phoneEl.textContent     = "";
}

// ─── 9. MODAL OPEN / CLOSE ───────────────────────────
export function openAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.add("auth-modal-open");
    resetOTPStep();
    clearAuthError();
    document.getElementById("auth-phone").value = "";
    document.getElementById("auth-otp").value   = "";
  }
}

export function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.remove("auth-modal-open");
}

// ─── 10. FRIENDLY ERROR MESSAGES ─────────────────────
function friendlyError(err) {
  const code = err?.code || "";
  const map  = {
    "auth/invalid-phone-number":       "Invalid phone number. Include country code (e.g. +91).",
    "auth/too-many-requests":          "Too many attempts. Please wait a few minutes.",
    "auth/invalid-verification-code":  "Wrong OTP. Please check and try again.",
    "auth/code-expired":               "OTP expired. Please request a new one.",
    "auth/session-expired":            "Session expired. Please request a new OTP.",
    "auth/quota-exceeded":             "SMS quota exceeded. Try again later.",
    "auth/captcha-check-failed":       "reCAPTCHA check failed. Refresh and try again.",
    "auth/network-request-failed":     "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ─── 11. EXPOSE GLOBALS for inline onclick handlers ──
window.dbAuth = {
  sendOTP,
  verifyOTP,
  logOut,
  openAuthModal,
  closeAuthModal
};
