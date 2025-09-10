// простые утилиты DOM/UI
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => root.querySelectorAll(s);

export function toast(msg) {
  const t = document.createElement("div");
  t.className =
    "fixed left-1/2 -translate-x-1/2 top-4 z-50 px-4 py-2 rounded-xl bg-base-700 text-ink-700 shadow-soft ring-1 ring-white/10";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

export function copyToClipboard(text) {
  if (!navigator.clipboard?.writeText) return;
  navigator.clipboard
    .writeText(text)
    .then(() => toast("Сид-фразы скопированы"));
}
