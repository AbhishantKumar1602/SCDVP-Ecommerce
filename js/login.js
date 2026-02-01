const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("errorBox");
const errorMsg = document.getElementById("errorMsg");
const btnLogin = document.getElementById("btnLogin");
const togglePw = document.getElementById("togglePw");

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggle();
  initInputCleanup();
  initSocialLogins();

  // If already logged in, redirect
  const user = sessionStorage.getItem("currentUser");
  if (user) {
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get("redirect") || "index.html";
  }
});

/* ===================== PASSWORD TOGGLE ===================== */

function initPasswordToggle() {
  togglePw.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";

    passwordInput.type = isVisible ? "password" : "text";

    togglePw.querySelector(".eye-open").style.display = isVisible ? "block" : "none";
    togglePw.querySelector(".eye-closed").style.display = isVisible ? "none" : "block";

    // Keep focus
    passwordInput.focus();
  });
}

/* ===================== INPUT CLEANUP ===================== */

function initInputCleanup() {
  // Clear error styling when user starts typing again
  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      hideError();
    });
  });
}

/* ===================== FORM SUBMIT ===================== */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // --- Client-side validation ---
  if (!email && !password) {
    showError("Please enter your email and password.");
    markInputError(emailInput);
    markInputError(passwordInput);
    emailInput.focus();
    return;
  }
  if (!email) {
    showError("Please enter your email address.");
    markInputError(emailInput);
    emailInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    markInputError(emailInput);
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("Please enter your password.");
    markInputError(passwordInput);
    passwordInput.focus();
    return;
  }

  // --- Start loading ---
  setLoading(true);

  try {
    const res = await fetch(
      `${SHEETDB_BASE}/search?sheet=users&email=${encodeURIComponent(email)}`
    );
    const users = await res.json();

    // User not found
    if (!users || users.length === 0) {
      setLoading(false);
      showError("No account found with this email.");
      markInputError(emailInput);
      emailInput.focus();
      return;
    }

    const user = users[0];

    // Wrong password
    if (user.password !== password) {
      setLoading(false);
      showError("Incorrect password. Please try again.");
      markInputError(passwordInput);
      passwordInput.focus();
      return;
    }

    // --- Success ---
    sessionStorage.setItem("currentUser", JSON.stringify(user));

    // Brief success state before redirect
    btnLogin.style.background = "var(--clr-green)";
    btnLogin.querySelector(".btn-text").innerText = "✓  Signing in…";

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    setTimeout(() => {
      window.location.href = redirect || "index.html";
    }, 600);
  } catch (err) {
    console.error(err);
    setLoading(false);
    showError("Something went wrong. Please try again.");
  }
});

/* ===================== HELPERS ===================== */

function showError(msg) {
  errorMsg.innerText = msg;
  errorBox.style.display = "flex";

  // Re-trigger shake animation
  errorBox.classList.remove("shake-reset");
  void errorBox.offsetWidth; // force reflow
  errorBox.style.animation = "none";
  void errorBox.offsetWidth;
  errorBox.style.animation = "shake 0.4s ease";
}

function hideError() {
  errorBox.style.display = "none";
  errorMsg.innerText = "";
}

function markInputError(input) {
  input.classList.add("input-error");
}

function setLoading(isLoading) {
  btnLogin.classList.toggle("loading", isLoading);
  btnLogin.disabled = isLoading;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ===================== SOCIAL LOGINS ===================== */

function initSocialLogins() {
  // Helper to find buttons by text content if ID/class is unknown
  const findBtnByText = (text) => {
    const buttons = Array.from(document.querySelectorAll("button, a, .btn"));
    return buttons.find(b => b.innerText && b.innerText.toLowerCase().includes(text));
  };

  // 1. Remove Apple Login
  const appleBtn = document.getElementById("appleLogin") || document.querySelector(".apple-btn") || findBtnByText("apple");
  if (appleBtn) {
    appleBtn.style.display = "none";
  }

  // 2. Remove Google Login
  const googleBtn = document.getElementById("googleLogin") || document.querySelector(".google-btn") || findBtnByText("google");
  if (googleBtn) {
    googleBtn.style.display = "none";
  }

  // 3. Remove separator text (e.g. "or continue with email")
  const elements = Array.from(document.querySelectorAll("p, div, span"));
  elements.forEach(el => {
    const text = el.innerText ? el.innerText.toLowerCase().trim() : "";
    if (text === "or continue with email" || text === "or") {
      el.style.display = "none";
    }
  });
}