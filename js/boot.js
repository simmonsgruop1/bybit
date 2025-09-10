window.USE_API = true;

import { initDynamicNav } from "./features/nav.js";
import { initRegisterPage, initLoginPage } from "./features/auth.js";
import { initAdminPage } from "./features/admin.js";
import { initDashboardPage } from "./features/dashboard.js";

window.addEventListener("DOMContentLoaded", async () => {
  initDynamicNav();

  // Опциональные штуки подключаем безопасно
  try {
    (await import("./features/phone.js")).initTelInputSmart();
  } catch {}
  try {
    (await import("./features/caseMask.js")).initCaseNumberMask();
  } catch {}

  // Страницы
  initRegisterPage();
  initLoginPage();
  initDashboardPage();
  initAdminPage();
});
