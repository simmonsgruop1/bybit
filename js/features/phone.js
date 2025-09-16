import { toast } from "../lib/dom.js";

export function initTelInputSmart() {
  const tel = document.querySelector('input[name="phone"]');
  if (!tel || !window.intlTelInput) return;

  let err = document.getElementById("phone-error");
  if (!err) {
    err = document.createElement("div");
    err.id = "phone-error";
    err.className = "mt-2 text-sm text-red-400";
    tel.insertAdjacentElement("afterend", err);
  }

  const ERROR_MAP = {
    0: "",
    1: "Неверный код страны.",
    2: "Слишком короткий номер.",
    3: "Слишком длинный номер.",
    4: "Возможен только как локальный номер.",
    5: "Неверный номер.",
  };

  const iti = window.intlTelInput(tel, {
    initialCountry: "auto",
    separateDialCode: true,
    nationalMode: true,
    placeholderNumberType: "MOBILE",
    utilsScript: "js/utils.js",
    geoIpLookup: (cb) => {
      fetch("https://ipapi.co/json")
        .then((r) => r.json())
        .then((d) => cb(((d && d.country_code) || "US").toLowerCase()))
        .catch(() => cb("us"));
    },
  });

  iti.promise.then(() => {
    const showValidity = () => {
      let msg = "";
      const raw = tel.value.trim();
      if (raw.includes("+")) tel.value = raw.replace(/\+/g, "");
      if (raw) {
        if (!iti.isValidNumber()) {
          const code = iti.getValidationError();
          msg =
            code === 1
              ? "Неверный номер."
              : ERROR_MAP[code] || "Проверьте номер телефона.";
          tel.classList.add("ring-2", "ring-red-500/60");
          tel.setAttribute("aria-invalid", "true");
        } else {
          tel.classList.remove("ring-2", "ring-red-500/60");
          tel.removeAttribute("aria-invalid");
        }
      } else {
        tel.classList.remove("ring-2", "ring-red-500/60");
        tel.removeAttribute("aria-invalid");
      }
      err.textContent = msg;
    };

    tel.addEventListener("blur", showValidity);
    tel.addEventListener("input", showValidity);
    tel.addEventListener("countrychange", showValidity);
    showValidity();

    const form = document.getElementById("form-register");
    if (form) {
      form.addEventListener(
        "submit",
        (e) => {
          if (!iti.isValidNumber()) {
            e.preventDefault();
            showValidity();
            toast("Проверьте номер телефона");
            return;
          }
          // ⚠️ Не трогаем видимый инпут телефона.
          // Создаём/обновляем скрытый input с полным номером в E.164:
          let ph = document.getElementById("phone-e164");
          if (!ph) {
            ph = document.createElement("input");
            ph.type = "hidden";
            ph.name = "phoneE164";
            ph.id = "phone-e164";
            form.appendChild(ph);
          }
          ph.value = iti.getNumber(); // +E.164
          const iso2 = iti.getSelectedCountryData().iso2.toUpperCase();
          let cc = document.getElementById("country-iso2");
          if (!cc) {
            cc = document.createElement("input");
            cc.type = "hidden";
            cc.name = "countryIso2";
            cc.id = "country-iso2";
            form.appendChild(cc);
          }
          cc.value = iso2;
        },
        true
      );
    }
  });
}
