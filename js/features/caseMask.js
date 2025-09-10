import { toast } from "../lib/dom.js";

export function initCaseNumberMask() {
  const input = document.getElementById("caseNumber");
  if (!input) return;

  const err = document.getElementById("case-error");
  const PATTERN = /^#\d{3}-\d{4}$/;
  const digitsOnly = (s) => (s || "").replace(/\D/g, "").slice(0, 7);
  const render = (d) =>
    !d ? "" : "#" + d.slice(0, 3) + (d.length > 3 ? "-" + d.slice(3, 7) : "");

  const showValidity = () => {
    const v = input.value;
    if (!v) {
      input.classList.remove("ring-2", "ring-red-500/60");
      input.removeAttribute("aria-invalid");
      err && (err.textContent = "");
      return;
    }
    const ok = PATTERN.test(v);
    if (!ok) {
      input.classList.add("ring-2", "ring-red-500/60");
      input.setAttribute("aria-invalid", "true");
      err && (err.textContent = "Формат: #123-4567 (7 цифр)");
    } else {
      input.classList.remove("ring-2", "ring-red-500/60");
      input.removeAttribute("aria-invalid");
      err && (err.textContent = "");
    }
  };

  input.addEventListener("keydown", (e) => {
    const isControl = e.key.length > 1 || e.ctrlKey || e.metaKey || e.altKey;
    if (!isControl && !/^\d$/.test(e.key)) e.preventDefault();
  });

  const formatOnInput = () => {
    const digits = digitsOnly(input.value);
    if (!digits.length) {
      input.value = "";
      showValidity();
      return;
    }
    input.value = render(digits);
    requestAnimationFrame(() => {
      const pos = input.value.length;
      input.setSelectionRange(pos, pos);
    });
    showValidity();
  };

  input.addEventListener("input", formatOnInput);
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const text =
      (e.clipboardData || window.clipboardData).getData("text") || "";
    input.value = render(digitsOnly(text));
    showValidity();
  });
  input.addEventListener("blur", showValidity);
  showValidity();

  const form = document.getElementById("form-register");
  if (form) {
    form.addEventListener("submit", (e) => {
      if (!PATTERN.test(input.value)) {
        e.preventDefault();
        showValidity();
        toast("Проверьте номер дела: формат #123-4567");
      }
    });
  }
}
