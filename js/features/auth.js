import { $, toast } from "../lib/dom.js";
import { api, setToken, getToken } from "../lib/api.js";
import { saveUser } from "../lib/storage.js";

export function initRegisterPage() {
  const form = $("#form-register");
  if (!form) return;

  if (getToken()) {
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

    // телефон: возьмём E.164 из data-атрибута, который выставит phone.js
    const phone = f.phone?.dataset?.e164 || f.phone.value.trim();

    // --- pending helpers (как было)
    let pendingCount = 0;
    function setPending(on, text = "Отправляем письмо…") {
      /* без изменений */
    }
    function startSmartPending(
      text = "Регистрация…",
      thresholdMs = 250,
      minVisibleMs = 400
    ) {
      /* без изменений */
    }

    const submitBtn = f.querySelector('button[type="submit"]');
    submitBtn?.setAttribute("data-prev-text", submitBtn.textContent || "");
    if (submitBtn) submitBtn.textContent = "Регистрируем…";
    const stopPending = startSmartPending("Регистрация…", 250, 400);

    const payload = {
      firstName: f.firstName.value.trim(),
      lastName: f.lastName.value.trim(),
      phone, // ← берём нормализованный номер
      email: f.email.value.trim().toLowerCase(),
      password: pwd,
      caseNumber: f.caseNumber.value.trim(),
    };

    try {
      if (window.USE_API) {
        await api.register(payload);
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
