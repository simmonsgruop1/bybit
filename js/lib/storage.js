export function saveUser(data) {
  localStorage.setItem("fc_user", JSON.stringify(data));
}
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("fc_user") || "{}");
  } catch {
    return {};
  }
}
