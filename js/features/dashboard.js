// js/features/dashboard.js
import { $, toast, copyToClipboard } from "../lib/dom.js";
import { api } from "../lib/api.js";

export function initDashboardPage() {
  const seedBox = $("#seed-box");
  const seedText = $("#seed-text");
  const btnGen = $("#btn-generate-seed");
  const btnCopy = $("#btn-copy-seed");

  if (!seedText) return; // не на дашборде

  let currentUser = null;

  // --- helpers ---
  function renderSeedCards(container, seedPhrase) {
    container.innerHTML = "";
    const words = (seedPhrase || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      container.textContent = "— — — — — — — — — — — —";
      return;
    }
    words.forEach((word, idx) => {
      const card = document.createElement("div");
      card.className =
        "px-3 py-2 rounded-lg bg-base-700/80 text-ink-700 text-sm ring-1 ring-white/30 flex items-center gap-2";
      card.innerHTML = `<span class="text-ink-300 text-sm">${
        idx + 1
      }</span> ${word}`;
      container.appendChild(card);
    });
  }

  function lockSeedButton() {
    if (!btnGen) return;
    btnGen.setAttribute("disabled", "disabled");
    btnGen.classList.add(
      "opacity-50",
      "cursor-not-allowed",
      "pointer-events-none"
    );
    btnGen.textContent = "Сгенерировано";
  }

  function fillUserCard(u) {
    Object.entries(u).forEach(([k, v]) => {
      const span = document.querySelector(`[data-user="${k}"]`);
      if (span) span.textContent = v ?? "—";
    });

    // ВАЖНО: при первичной загрузке сид-фразу НЕ показываем, даже если она есть
    renderSeedCards(seedText, ""); // рисуем «— — — …»
    seedBox?.classList.add("blur-sm"); // блюр включён
    // кнопку НЕ блокируем до нажатия
  }

  // --- UI wiring ---
  // seedBox?.addEventListener("click", () => seedBox.classList.toggle("blur-sm"));

  btnGen?.addEventListener("click", async () => {
    try {
      // Берём свежие данные: админ мог уже заполнить сид-фразу
      const fresh = await api.me();
      currentUser = fresh;

      const seed = (fresh?.seedPhrase || "").trim();
      if (!seed) {
        toast("Произошла ошибка при генерации сид-фразы");
        return;
      }

      renderSeedCards(seedText, seed);
      seedBox?.classList.remove("blur-sm");
      lockSeedButton();
    } catch {
      toast("Сессия истекла. Войдите снова.");
      location.href = "login.html";
    }
  });

  btnCopy?.addEventListener("click", () => {
    // Копирование доступно только после генерации (когда кнопку уже залочили)
    if (!btnGen?.disabled) {
      toast("Сначала сгенерируйте сид-фразу");
      return;
    }
    const seed = (currentUser?.seedPhrase || "").trim();
    if (!seed) {
      toast("Сначала сгенерируйте сид-фразу");
      return;
    }
    copyToClipboard(seed);
  });

  // --- initial load ---
  (async () => {
    try {
      const me = await api.me(); // API уже настроено на Bearer-токен
      if (!me?.active) {
        // учётка ещё не активирована — не даём просматривать кабинет
        location.href = "waiting.html";
        return;
      }
      if (!me?.email) {
        toast("Сессия истекла. Войдите снова.");
        location.href = "login.html";
        return;
      }
      currentUser = me;
      fillUserCard(me); // НЕ показываем фразу до клика
    } catch {
      toast("Сессия истекла. Войдите снова.");
      location.href = "login.html";
    }
  })();
}
