import { config } from "./config";
export async function getFrappeCSRF() {
    // 1. Fetch the root URL (or /app) to get the HTML
    const res = await fetch(`${config.frappeBaseUrl}/api/method/vms.api.get_csrf_token`, {
        method: "GET",
        credentials: "include", // Essential: sends the 'sid' cookie
    });
    const csrf = await res.json();
    console.log("csrf",csrf);
    
    if (!res.ok) {
        throw new Error("Failed to fetch Frappe application page");
    }

    return csrf.message;
}