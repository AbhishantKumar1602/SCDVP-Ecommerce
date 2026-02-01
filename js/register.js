const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

const form = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const errorBox = document.getElementById("errorBox");
const errorMsg = document.getElementById("errorMsg");
const successBox = document.getElementById("successBox");
const successMsg = document.getElementById("successMsg");
const btnRegister = document.getElementById("btnRegister");
const togglePw = document.getElementById("togglePw");
const termsCheck = document.getElementById("termsCheck");

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggle();
  initPasswordStrength();
  initConfirmMatch();
  initInputCleanup();

  // Redirect if already logged in
  const user = sessionStorage.getItem("currentUser");
  if (user) window.location.href = "index.html";
});

/* ===================== PASSWORD TOGGLE ===================== */

function initPasswordToggle() {
  togglePw.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePw.querySelector(".eye-open").style.display = isVisible ? "block" : "none";
    togglePw.querySelector(".eye-closed").style.display = isVisible ? "none" : "block";
    passwordInput.focus();
  });
}

/* ===================== PASSWORD STRENGTH ===================== */

function initPasswordStrength() {
  passwordInput.addEventListener("input", () => {
    const pw = passwordInput.value;
    evaluateStrength(pw);
    checkRules(pw);
    // Re-check confirm match if already typed
    if (confirmInput.value) checkConfirmMatch();
  });
}

function evaluateStrength(pw) {
  const segs = [
    document.getElementById("seg1"),
    document.getElementById("seg2"),
    document.getElementById("seg3"),
    document.getElementById("seg4"),
  ];
  const label = document.getElementById("strengthLabel");

  // Reset
  segs.forEach((s) => { s.className = "strength-seg"; });
  label.className = "strength-label";
  label.innerText = "—";

  if (!pw) return;

  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  // Map score → level (1–4)
  let level;
  if (score <= 1) level = 1;
  else if (score === 2) level = 2;
  else if (score === 3) level = 3;
  else level = 4;

  const levelMap = {
    1: { cls: "weak", text: "Weak" },
    2: { cls: "fair", text: "Fair" },
    3: { cls: "good", text: "Good" },
    4: { cls: "strong", text: "Strong" },
  };

  const { cls, text } = levelMap[level];

  for (let i = 0; i < level; i++) {
    segs[i].classList.add(cls);
  }
  label.classList.add(cls);
  label.innerText = text;
}

function checkRules(pw) {
  const rules = [
    { id: "ruleLen", test: pw.length >= 6 },
    { id: "ruleUpper", test: /[A-Z]/.test(pw) },
    { id: "ruleLower", test: /[a-z]/.test(pw) },
    { id: "ruleNum", test: /[0-9]/.test(pw) },
  ];

  rules.forEach(({ id, test }) => {
    document.getElementById(id).classList.toggle("met", test);
  });
}

/* ===================== CONFIRM PASSWORD MATCH ===================== */

function initConfirmMatch() {
  confirmInput.addEventListener("input", checkConfirmMatch);
}

function checkConfirmMatch() {
  const check = document.getElementById("confirmCheck");
  const match = confirmInput.value && confirmInput.value === passwordInput.value;

  check.style.display = match ? "flex" : "none";
  confirmInput.classList.toggle("input-ok", match);
  confirmInput.classList.toggle("input-error", confirmInput.value && !match);
}

/* ===================== INPUT CLEANUP ===================== */

function initInputCleanup() {
  [nameInput, emailInput, passwordInput, confirmInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      hideError();
    });
  });

  // Update step indicator based on which fields are filled
  [nameInput, emailInput].forEach((input) => {
    input.addEventListener("input", updateSteps);
  });
  passwordInput.addEventListener("input", updateSteps);
  confirmInput.addEventListener("input", updateSteps);
}

/* ===================== STEP PROGRESS ===================== */

function updateSteps() {
  const stepInfo = document.getElementById("stepInfo");
  const stepSecurity = document.getElementById("stepSecurity");
  const stepDone = document.getElementById("stepDone");
  const lines = document.querySelectorAll(".step-line");

  const hasInfo = nameInput.value.trim() && emailInput.value.trim();
  const hasSecurity = passwordInput.value && confirmInput.value;

  // Reset
  stepInfo.classList.remove("active", "completed");
  stepSecurity.classList.remove("active", "completed");
  stepDone.classList.remove("active", "completed");
  lines.forEach((l) => l.classList.remove("filled"));

  if (hasInfo && hasSecurity) {
    stepInfo.classList.add("completed");
    stepSecurity.classList.add("completed");
    stepDone.classList.add("active");
    lines[0].classList.add("filled");
    lines[1].classList.add("filled");
  } else if (hasInfo) {
    stepInfo.classList.add("completed");
    stepSecurity.classList.add("active");
    lines[0].classList.add("filled");
  } else {
    stepInfo.classList.add("active");
  }
}

/* ===================== FORM SUBMIT ===================== */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirm = confirmInput.value.trim();

  // --- Validations ---
  if (!name) {
    showError("Please enter your full name.");
    markError(nameInput);
    nameInput.focus();
    return;
  }
  if (!email) {
    showError("Please enter your email address.");
    markError(emailInput);
    emailInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    markError(emailInput);
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("Please create a password.");
    markError(passwordInput);
    passwordInput.focus();
    return;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    markError(passwordInput);
    passwordInput.focus();
    return;
  }
  if (!confirm) {
    showError("Please confirm your password.");
    markError(confirmInput);
    confirmInput.focus();
    return;
  }
  if (password !== confirm) {
    showError("Passwords do not match.");
    markError(confirmInput);
    confirmInput.focus();
    return;
  }
  if (!termsCheck.checked) {
    showError("Please accept the Terms of Service to continue.");
    return;
  }

  // --- Loading ---
  setLoading(true);

  try {
    // Check if email already exists
    const checkRes = await fetch(
      `${SHEETDB_BASE}/search?sheet=users&email=${encodeURIComponent(email)}`
    );
    const existingUsers = await checkRes.json();

    if (existingUsers.length > 0) {
      setLoading(false);
      showError("This email is already registered. Try signing in instead.");
      markError(emailInput);
      emailInput.focus();
      return;
    }

    // Create user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    const createRes = await fetch(`${SHEETDB_BASE}?sheet=users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!createRes.ok) throw new Error("Failed to register");

    // --- Success ---
    setLoading(false);
    hideError();

    // Mark all steps complete
    document.getElementById("stepInfo").classList.add("completed");
    document.getElementById("stepSecurity").classList.add("completed");
    document.getElementById("stepDone").classList.add("active", "completed");
    document.querySelectorAll(".step-line").forEach((l) => l.classList.add("filled"));

    // Show success
    successMsg.innerText = "Account created successfully! Redirecting to login…";
    successBox.style.display = "flex";

    // Green button
    btnRegister.style.background = "var(--clr-green)";
    btnRegister.querySelector(".btn-text").innerText = "✓  Account Created";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1800);
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
  // Re-trigger shake
  errorBox.style.animation = "none";
  void errorBox.offsetWidth;
  errorBox.style.animation = "shake 0.4s ease";
  // Hide success if showing
  successBox.style.display = "none";
}

function hideError() {
  errorBox.style.display = "none";
  errorMsg.innerText = "";
}

function markError(input) {
  input.classList.add("input-error");
}

function setLoading(isLoading) {
  btnRegister.classList.toggle("loading", isLoading);
  btnRegister.disabled = isLoading;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}