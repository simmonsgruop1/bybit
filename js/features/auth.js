import { $, toast } from "../lib/dom.js";
import { api, setToken, getToken } from "../lib/api.js";
import { saveUser } from "../lib/storage.js";

export function initRegisterPage() {
  const form = $("#form-register");
  if (!form) return;

  if (getToken()) {
    // уже залогинен → отправим в кабинет (или куда нужно)
    location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;

    const pwd = f.password.value;
    const pwd2 = f.passwordConfirm?.value || "";
    if (pwd !== pwd2) {
      const pc = $("#passwordConfirm");
      pc?.classList.add("ring-2", "ring-red-500/60");
      pc?.setAttribute("aria-invalid", "true");
      pc?.focus();
      toast("Пароли не совпадают");
      return;
    } else {
      const pc = $("#passwordConfirm");
      pc?.classList.remove("ring-2", "ring-red-500/60");
      pc?.removeAttribute("aria-invalid");
    }

    // собрать payload (телефон уже +E.164 после правки в phone.js)
    const payload = {
      firstName: f.firstName.value.trim(),
      lastName: f.lastName.value.trim(),
      phone: (f.phoneE164?.value || "").trim(), // +E.164 из скрытого input
      email: f.email.value.trim().toLowerCase(),
      password: pwd,
      caseNumber: f.caseNumber.value.trim(),
      bybitUid: (f.bybitUid?.value || "").trim(),
    };

    // --- pending helpers (локальная версия из админки) ---
    let pendingCount = 0;
    function setPending(on, text = "Отправляем письмо…") {
      const overlay = document.getElementById("pending-overlay");
      const label = document.getElementById("pending-text");
      if (!overlay || !label) return;

      if (on) {
        pendingCount++;
        label.textContent = text;
        overlay.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        // дизейблим все интерактивы формы, чтобы не кликали повторно
        Array.from(f.elements).forEach((el) => (el.disabled = true));
      } else {
        pendingCount = Math.max(0, pendingCount - 1);
        if (pendingCount === 0) {
          overlay.classList.add("hidden");
          document.body.classList.remove("overflow-hidden");
          Array.from(f.elements).forEach((el) => (el.disabled = false));
        }
      }
    }

    function startSmartPending(
      text = "Регистрация…",
      thresholdMs = 250,
      minVisibleMs = 400
    ) {
      let showTimer = null;
      let shown = false;
      let showStarted = 0;

      showTimer = setTimeout(() => {
        shown = true;
        showStarted = performance.now();
        setPending(true, text);
      }, thresholdMs);

      return function stop() {
        clearTimeout(showTimer);
        if (!shown) return;
        const elapsed = performance.now() - showStarted;
        const wait = Math.max(0, minVisibleMs - elapsed);
        setTimeout(() => setPending(false), wait);
      };
    }
    // --- /pending helpers ---

    const submitBtn = f.querySelector('button[type="submit"]');
    submitBtn?.setAttribute("data-prev-text", submitBtn.textContent || "");
    submitBtn && (submitBtn.textContent = "Регистрируем…");

    const stopPending = startSmartPending("Регистрация…", 250, 400);

    try {
      if (window.USE_API) {
        await api.register(payload); // {"ok":true}
        localStorage.setItem("fc_last_email", payload.email);
        toast("Регистрация успешна");
        location.href = "login.html";
        return;
      }
      location.href = "login.html";
    } catch (err) {
      toast(err.message || "Ошибка регистрации");
    } finally {
      stopPending();
      if (submitBtn) {
        const prev =
          submitBtn.getAttribute("data-prev-text") || "Зарегистрироваться";
        submitBtn.textContent = prev;
        submitBtn.removeAttribute("data-prev-text");
      }
    }
  });
}

export function initLoginPage() {
  const form = $("#form-login");
  if (!form) return;

  const lastEmail = localStorage.getItem("fc_last_email") || "";
  const loginEmail = $("#login-email");
  if (loginEmail) loginEmail.value = lastEmail;

  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.togglePassword);
      if (target)
        target.type = target.type === "password" ? "text" : "password";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (loginEmail?.value || "").trim().toLowerCase();
    const pwd = $("#login-password")?.value || "";

    try {
      if (window.USE_API) {
        const { token, user } = await api.login(email, pwd);
        setToken(token);
        saveUser(user); // текущий пользователь для UI
        localStorage.setItem("fc_last_email", user.email);
        const go =
          user?.role === "admin"
            ? "admin.html"
            : user?.active
            ? "dashboard.html"
            : "waiting.html";

        location.href = go;
        return;
      }
    } catch (err) {
      toast(err.message || "Неверная почта или пароль");
    }
  });
}
