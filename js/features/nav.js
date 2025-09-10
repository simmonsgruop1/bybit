// js/features/nav.js
import { getUser } from "../lib/storage.js";
import { $$, toast } from "../lib/dom.js";
import { clearToken } from "../lib/api.js";

export function initDynamicNav() {
  const user = getUser();
  const isLoggedIn = !!user?.email;
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const isAdmin = role === "admin";
  const isActive = !!user?.active;

  // --- "Войти/Выйти"
  $$("[data-nav-auth]").forEach((a) => {
    // снимаем старые обработчики (пересоздаём ноду)
    const clone = a.cloneNode(true);
    a.parentNode.replaceChild(clone, a);
  });

  $$("[data-nav-auth]").forEach((a) => {
    if (isLoggedIn) {
      a.textContent = "Выйти";
      a.href = "#logout";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        clearToken(); // очищаем fc_token
        localStorage.removeItem("fc_user");
        toast("Вы вышли из аккаунта");
        location.href = "login.html";
      });
    } else {
      a.textContent = "Войти";
      a.href = "login.html";
    }
  });

  // --- "Личный кабинет" / "Админка"
  // Кнопка кабинета / админки
  $$("[data-nav-cabinet]").forEach((btn) => {
    btn.classList.remove(
      "opacity-50",
      "pointer-events-none",
      "cursor-not-allowed"
    );
    btn.removeAttribute("title");

    if (!isLoggedIn) {
      btn.classList.add(
        "opacity-50",
        "pointer-events-none",
        "cursor-not-allowed"
      );
      btn.title = "Авторизуйтесь, чтобы войти";
      btn.textContent = "Личный кабинет";
      btn.setAttribute("href", "dashboard.html");
      return;
    }

    if (isAdmin) {
      btn.textContent = "Админка";
      btn.setAttribute("href", "admin.html");
      return;
    }

    // обычный пользователь
    if (!isActive) {
      btn.setAttribute("href", "waiting.html");
    } else {
      btn.textContent = "Личный кабинет";
      btn.setAttribute("href", "dashboard.html");
    }
  });
}
