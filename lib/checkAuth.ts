import { config } from "./config";
export async function checkAuth() {
  const res = await fetch(`${config.frappeBaseUrl}/api/method/frappe.auth.get_logged_user`, {
    credentials: "include",
    cache: "no-store"
  });

  console.log(res);

  if (!res.ok) return null;

  const data = await res.json();
  console.log('hello1', data);

  return data.message;
}