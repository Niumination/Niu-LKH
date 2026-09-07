/**
 * Date helpers that are timezone-aware for Asia/Jakarta local users.
 * `toISOString()` returns UTC and often shifts the day for UTC+7 users,
 * so we build YYYY-MM-DD from local time instead.
 */

/** @param {Date} [input] */
export function toLocalISODate(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** @param {Date} [input] */
export function todayLocalISO(input = new Date()) {
  return toLocalISODate(input)
}

/** @param {string} iso */
export function toLocalDate(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

/** @param {string} iso */
export function getLocalWeekStart(iso) {
  const d = toLocalDate(iso)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return toLocalISODate(d)
}
