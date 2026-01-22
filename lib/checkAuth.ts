import { config } from "./config";
export async function checkAuth() {
  const res = await fetch(`${config.frappeBaseUrl}/api/method/frappe.auth.get_logged_user`, {
    credentials: "include",
    cache: "no-store"
  });


  if (!res.ok) return null;

  const data = await res.json();


  return data.message;
}