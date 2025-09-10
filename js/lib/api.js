const API_BASE = process.env.API_BASE;

export function setToken(t) {
  localStorage.setItem("fc_token", t);
}
export function getToken() {
  return localStorage.getItem("fc_token") || "";
}

export function clearToken() {
  try {
    localStorage.removeItem("fc_token");
  } catch {}
}

const pickPhone = (r = {}) => {
  const v =
    r.phone ??
    r.phone_full ??
    r.phoneE164 ??
    r.phone_e164 ??
    r.phone_number ??
    r.msisdn ??
    r.tel ??
    "";

  // аккуратно приводим к строке и обрезаем пробелы
  const s = (typeof v === "string" ? v : String(v || "")).trim();

  return s;
};

function toSnakeUserPayload(p = {}) {
  return {
    // идентификатор кладём под оба ключа
    id: p.id ?? null,
    uuid: p.uuid ?? p.id ?? null,

    // статус
    active: p.active ? 1 : 0,

    // поля в snake_case (как обычно делают в PHP)
    first_name: p.firstName ?? "",
    last_name: p.lastName ?? "",
    phone_e164: p.phone ?? "",
    email: (p.email ?? "").toLowerCase(),
    case_number: p.caseNumber ?? "",
    compensation_source: p.compensationSource ?? "",
    compensation_initiator: p.compensationInitiator ?? "",
    compensation_amount: p.compensationAmount ?? "",
    seed_phrase: p.seedPhrase ?? "",
  };
}

const toCamelUser = (r = {}) => ({
  id: r.id ?? null,
  uuid: r.uuid ?? r.id ?? null,
  active: Boolean(r.active ?? r.is_active ?? r.enabled),
  firstName: r.firstName ?? r.first_name ?? "",
  lastName: r.lastName ?? r.last_name ?? "",
  phone: r.phone_e164 ?? pickPhone(r),
  email: r.email ?? "",
  caseNumber: r.caseNumber ?? r.case_number ?? "",
  compensationSource: r.compensationSource ?? r.compensation_source ?? "",
  compensationInitiator:
    r.compensationInitiator ?? r.compensation_initiator ?? "",
  compensationAmount: r.compensationAmount ?? r.compensation_amount ?? "",
  seedPhrase: r.seedPhrase ?? r.seed_phrase ?? "",
  role: r.role ?? "",
  createdAt: r.createdAt ?? r.created_at ?? "",
  updatedAt: r.updatedAt ?? r.updated_at ?? "",
});

async function req(path, opts = {}) {
  const url = `${API_BASE}${path}`;

  // Собираем заголовки гарантированно
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && (opts.body || /\.php(\?|$)/.test(path))) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && token.trim().length > 0) {
    headers.set("Authorization", "Bearer " + token);
  } else {
    // для диагностики во время разработки:
    console.warn("[API] нет токена для", path);
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body || undefined,
    mode: "cors",
    credentials: "omit", // т.к. используем Bearer, куки не нужны
    cache: "no-store",
  });

  // Попробуем распарсить JSON при ошибке
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* пустой ответ */
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (payload) =>
    req("/register.php", { method: "POST", body: JSON.stringify(payload) }),
  login: (email, password) =>
    req("/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => req("/me.php", { method: "GET" }),

  // admin
  // Список
  users: (q = "") =>
    req(`/users_list.php${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
      method: "GET",
    }).then((resp) => {
      const arr = Array.isArray(resp)
        ? resp
        : resp?.data || resp?.users || resp?.items || resp?.rows || [];
      return arr.map(toCamelUser);
    }),

  // ОБНОВИТЬ (редактирование)
  userUpdate: (payload) =>
    req("/user_update.php", {
      method: "POST", // если перейдёшь на PATCH — скажу, что править в PHP
      body: JSON.stringify(toSnakeUserPayload(payload)),
    }),

  // УДАЛИТЬ
  userDelete: (id, uuid) =>
    req("/user_delete.php", {
      method: "POST",
      body: JSON.stringify({
        id: id ?? null,
        uuid: uuid ?? id ?? null,
      }),
    }),

  // ВКЛ/ВЫКЛ АКТИВНОСТЬ
  userSetActive: (id, uuid, active) =>
    req("/user_set_active.php", {
      method: "POST",
      body: JSON.stringify({
        id: id ?? null,
        uuid: uuid ?? id ?? null,
        active: active ? 1 : 0,
      }),
    }),
};
