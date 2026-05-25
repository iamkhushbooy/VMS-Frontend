// utils/date.ts

export const getIndianDateTime = () => {
  const now = new Date()

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  return formatter.format(now).replace(" ", "T")
}