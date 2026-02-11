
export const config = {
  // ERPNext/Frappe API Base URL
  frappeBaseUrl:
    process.env.NEXT_PUBLIC_FRAPPE_BASE_URL ||
    process.env.FRAPPE_BASE_URL ||
    "https://prayog.vaaman.in",
  // API endpoints
  api: {
    login: "/api/method/login",
    logout: "/api/method/logout",
    getLoggedUser: "/api/method/frappe.auth.get_logged_user",
    getCsrfToken: "/api/method/vms.api.get_csrf_token",
    resource: (doctype: string) => `/api/resource/${doctype}`,
    method: (method: string) => `/api/method/${method}`,
  },
} as const

// Validation
if (!config.frappeBaseUrl) {
  throw new Error("FRAPPE_BASE_URL or NEXT_PUBLIC_FRAPPE_BASE_URL must be set")
}

// Helper function to get full URL
export function getApiUrl(path: string): string {
  return `${config.frappeBaseUrl}${path}`
}

