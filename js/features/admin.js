import { $, $$, toast } from "../lib/dom.js";
import { api, clearToken } from "../lib/api.js";

export function initAdminPage() {
  const root = document.getElementById("admin-root");
  const tbody = $("#admin-tbody");
  if (!tbody) return; // не на админке

  // ---- Гард по роли (жёсткий, без "мигания") ----
  (async () => {
    try {
      const resp = await api.me(); // может быть { user: {...} } ИЛИ просто {...}
      const me = resp?.user ?? resp; // <-- ВАЖНО
      const role = String(me?.role || "")
        .trim()
        .toLowerCase();

      if (role !== "admin") {
        location.href = "dashboard.html"; // обычного юзера уводим
        return;
      }

      document.getElementById("admin-root")?.classList.remove("hidden");
      startAdminUi(); // запускаем UI только админам
    } catch (e) {
      clearToken();
      location.href = "login.html";
    }
  })();

  // ---- ВЕСЬ оставшийся код (рендер, обработчики, reload и т.д.) переносим сюда ----
  function startAdminUi() {
    const tplRow = $("#tpl-admin-row");
    const tplEdit = $("#tpl-admin-row-edit");
    const countEl = $("#admin-count");

    let users = [];
    let filter = "";

    const CASE_RX = /^#\d{3}-\d{4}$/;

    function applyFilter() {
      const q = (filter || "").trim().toLowerCase();
      if (!q) return [...users];
      return users.filter(
        (u) =>
          (u.firstName || "").toLowerCase().includes(q) ||
          (u.lastName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q) ||
          (u.caseNumber || "").toLowerCase().includes(q)
      );
    }

    let pendingCount = 0;
    function setPending(on, text = "Выполняем запрос…") {
      const overlay = document.getElementById("pending-overlay");
      const label = document.getElementById("pending-text");
      if (!overlay || !label) return;

      if (on) {
        pendingCount++;
        label.textContent = text;
        overlay.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        // блокируем все чекбоксы статуса
        $$("#admin-tbody [data-action='toggle-active']").forEach(
          (el) => (el.disabled = true)
        );
      } else {
        pendingCount = Math.max(0, pendingCount - 1);
        if (pendingCount === 0) {
          overlay.classList.add("hidden");
          document.body.classList.remove("overflow-hidden");
          $$("#admin-tbody [data-action='toggle-active']").forEach(
            (el) => (el.disabled = false)
          );
        }
      }
    }

    function startSmartPending(
      text = "Выполняем запрос…",
      thresholdMs = 250,
      minVisibleMs = 400
    ) {
      let showTimer = null;
      let shown = false;
      let showStarted = 0;

      showTimer = setTimeout(() => {
        shown = true;
        showStarted = performance.now();
        setPending(true, text); // твой существующий оверлей
      }, thresholdMs);

      return function stop() {
        clearTimeout(showTimer);
        if (!shown) return; // не успели показать — просто выходим, ничего не скрываем
        const elapsed = performance.now() - showStarted;
        const wait = Math.max(0, minVisibleMs - elapsed);
        setTimeout(() => setPending(false), wait);
      };
    }

    function render(list) {
      tbody.innerHTML = "";
      (list || []).forEach((u) => {
        const tr = tplRow.content.firstElementChild.cloneNode(true);
        tr.dataset.id = u.id ?? "";
        tr.dataset.uuid = u.uuid ?? (typeof u.id === "string" ? u.id : "");

        const chk = tr.querySelector('[data-action="toggle-active"]');
        const badge = tr.querySelector('[data-cell="activeBadge"]');
        chk.checked = !!u.active;
        badge.textContent = u.active ? "Активен" : "Неактивен";
        badge.className = `text-xs rounded px-2 py-1 ring-1 ${
          u.active
            ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "ring-white/10 text-ink-300"
        }`;

        tr.querySelector('[data-cell="firstName"]').textContent =
          u.firstName || "—";
        tr.querySelector('[data-cell="lastName"]').textContent =
          u.lastName || "—";
        tr.querySelector('[data-cell="phone"]').textContent = u.phone || "—";
        tr.querySelector('[data-cell="email"]').textContent = u.email || "—";
        tr.querySelector('[data-cell="caseNumber"]').textContent =
          u.caseNumber || "—";
        tr.querySelector('[data-cell="bybitUid"]').textContent =
          u.bybitUid || "—";
        tr.querySelector('[data-cell="compensationSource"]').textContent =
          u.compensationSource || "—";
        tr.querySelector('[data-cell="compensationInitiator"]').textContent =
          u.compensationInitiator || "—";
        tr.querySelector('[data-cell="compensationAmount"]').textContent =
          u.compensationAmount || "—";
        const seedCell = tr.querySelector('[data-cell="seedPhrase"]');
        seedCell.textContent = u.seedPhrase || "—";
        seedCell.title = u.seedPhrase || "";

        tbody.appendChild(tr);
      });
      countEl.textContent = (list || []).length;
    }

    async function reload() {
      try {
        const q = (filter || "").trim();
        users = await api.users(q);
        render(applyFilter());
      } catch (e) {
        if ((e.message || "").toLowerCase().includes("unauthorized")) {
          clearToken();
          location.href = "login.html";
        } else {
          toast(e.message || "Ошибка загрузки списка");
        }
      }
    }

    function enterEditMode(id) {
      const u = users.find((x) => String(x.id ?? x.uuid) === String(id));
      if (!u) return;

      const row = tplEdit.content.firstElementChild.cloneNode(true);
      row.dataset.id = id;
      row.dataset.uuid = u.uuid ?? (typeof u.id === "string" ? u.id : "");

      const chk = row.querySelector('[data-action="toggle-active"]');
      const badge = row.querySelector('[data-cell="activeBadge"]');
      chk.checked = !!u.active;
      badge.textContent = u.active ? "Активен" : "Неактивен";
      badge.className = `text-xs rounded px-2 py-1 ring-1 ${
        u.active
          ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "ring-white/10 text-ink-300"
      }`;
      chk.addEventListener("change", () => {
        badge.textContent = chk.checked ? "Активен" : "Неактивен";
        badge.className = `text-xs rounded px-2 py-1 ring-1 ${
          chk.checked
            ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "ring-white/10 text-ink-300"
        }`;
      });

      const fill = (k, v) => {
        const el = row.querySelector(`[data-edit="${k}"]`);
        if (el) el.value = v || "";
      };
      [
        "firstName",
        "lastName",
        "phone",
        "email",
        "caseNumber",
        "bybitUid",
        "compensationSource",
        "compensationInitiator",
        "compensationAmount",
        "seedPhrase",
      ].forEach((k) => fill(k, u[k]));

      const prev = tbody.querySelector(`tr[data-id="${id}"]`);
      if (prev) prev.replaceWith(row);
    }

    // события
    tbody.addEventListener("click", async (e) => {
      const btn = e.target.closest('button,[data-action="toggle-active"]');
      if (!btn) return;
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      const id = tr.dataset.id || null;
      const uuid = tr.dataset.uuid || null;
      const action = btn.dataset.action;

      try {
        if (action === "toggle-active") {
          const isActivating = btn.checked === true;

          // блокируем текущий переключатель сразу
          btn.disabled = true;

          // для активации — «умный» оверлей, для деактивации — без него
          const stopPending = isActivating
            ? startSmartPending(
                "Активируем пользователя и отправляем письмо…",
                250,
                400
              )
            : () => {};

          try {
            const res = await api.userSetActive(id, uuid, btn.checked);

            if (isActivating) {
              if (res?.mailed) toast("Учетка активирована. Письмо отправлено.");
              else toast("Учетка активирована. Письмо не отправлено.");
            } else {
              toast("Учетная запись деактивирована");
            }

            await reload();
          } catch (err) {
            const msg = (err?.message || "Ошибка").toString();
            if (msg.toLowerCase().includes("unauthorized")) {
              clearToken();
              location.href = "login.html";
            } else {
              toast(msg);
            }
          } finally {
            stopPending(); // аккуратно спрячем оверлей, если он успел показаться
            btn.disabled = false;
          }
        }

        if (action === "delete") {
          if (!confirm("Удалить пользователя?")) return;
          await api.userDelete(id, uuid);
          toast("Пользователь удалён");
          await reload();
        }
        if (action === "edit") enterEditMode(id);

        if (action === "save") {
          const row = e.target.closest("tr[data-id]");
          const get = (k) =>
            (row.querySelector(`[data-edit="${k}"]`)?.value || "").trim();
          const payload = {
            id,
            uuid,
            active: row.querySelector('[data-action="toggle-active"]').checked,
            firstName: get("firstName"),
            lastName: get("lastName"),
            phone: get("phone"),
            email: get("email").toLowerCase(),
            caseNumber: get("caseNumber"),
            bybitUid: get("bybitUid"),
            compensationSource: get("compensationSource"),
            compensationInitiator: get("compensationInitiator"),
            compensationAmount: get("compensationAmount"),
            seedPhrase: get("seedPhrase"),
          };
          if (!CASE_RX.test(payload.caseNumber)) {
            toast("Номер дела должен быть в формате #123-4567");
            return;
          }
          await api.userUpdate(payload);
          toast("Изменения сохранены");
          await reload();
        }

        if (action === "cancel") await reload();
      } catch (err) {
        const msg = (err?.message || "Ошибка").toString();
        if (msg.toLowerCase().includes("unauthorized")) {
          clearToken();
          location.href = "login.html";
        } else {
          toast(msg);
        }
      }
    });

    $("#admin-search")?.addEventListener("input", () => {
      filter = $("#admin-search").value || "";
      render(applyFilter()); // локальная фильтрация
    });
    $("#admin-refresh")?.addEventListener("click", reload);

    // стартовая загрузка
    reload();
  }
}
