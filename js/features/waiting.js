import { api } from "../lib/api.js";

const svgHourglass = () => `
  <svg viewBox="0 0 24 24" class="h-12 w-12" fill="currentColor" aria-hidden="true">
    <path d="M6 2a1 1 0 0 0 0 2h.5a5.5 5.5 0 0 0 3.02 4.91l.48.27-.48.27A5.5 5.5 0 0 0 6.5 14H6a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2h-.5a5.5 5.5 0 0 0-3.02-4.91l-.48-.27.48-.27A5.5 5.5 0 0 0 17.5 4H18a1 1 0 1 0 0-2H6zM8 4h8a3.5 3.5 0 0 1-1.94 3.13l-2.06 1.17-2.06-1.17A3.5 3.5 0 0 1 8 4zm0 10a3.5 3.5 0 0 1 1.94-3.13l2.06-1.17 2.06 1.17A3.5 3.5 0 0 1 16 14H8z"/>
  </svg>
`;

const svgCheck = () => `
  <svg viewBox="0 0 24 24" class="h-12 w-12" fill="currentColor" aria-hidden="true">
    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
  </svg>
`;

export function initWaitingPage() {
  const root = document.getElementById("waiting-root");
  if (!root) return;

  const icon = document.getElementById("waiting-icon");
  const text = document.getElementById("waiting-text");
  const action = document.getElementById("waiting-action");

  // дефолт: часики
  icon.innerHTML = svgHourglass();

  // тянем /me
  api
    .me()
    .then((resp) => {
      const u = resp?.user || resp; // на всякий случай
      const active =
        u?.active === true ||
        u?.active === 1 ||
        u?.active === "1" ||
        String(u?.active ?? "").toLowerCase() === "true";

      if (active) {
        icon.classList.remove("text-accent-500");
        icon.classList.add("text-green-500");
        icon.innerHTML = svgCheck();

        text.textContent =
          "Ваша учетная запись успешно активирована. Вы можете войти в личный кабинет и продолжить работу.";

        action.innerHTML = `
          <a href="dashboard.html"
             class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-accent-500/90 hover:bg-accent-500 text-base-900 font-medium transition">
            Личный кабинет
          </a>`;
      } else {
        // active=0 — оставляем дефолтный текст и иконку (часики)
        icon.classList.remove("text-green-500");
        icon.classList.add("text-accent-500");
        action.innerHTML = "";
      }
    })
    .catch(() => {
      // при ошибке /me — ничего не ломаем, оставляем дефолтное состояние
      action.innerHTML = "";
    });
}
