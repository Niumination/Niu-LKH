import { validateLkh, validateProfile } from '../lib/validation'
import { toLocalISODate, todayLocalISO, toLocalDate, getLocalWeekStart } from '../lib/date'

const STORAGE_KEY = 'niu_lkh_entries'
const DRAFT_KEY = 'niu_lkh_draft'
const PROFILE_KEY = 'niu_lkh_profile'

export function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEntry(entry) {
  const parsed = validateLkh(entry)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Data LKH tidak valid')

  const entries = getEntries()
  entries.unshift({
    ...parsed.data,
    id: crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function deleteEntry(id) {
  const entries = getEntries().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function getDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDraft(formData) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fallthrough */
  }
  return { nama: '', nip: '', gol: '', jabatan: '', unitKerja: '', periodeMulai: '', periodeSelesai: '' }
}

export function saveProfile(profile) {
  const parsed = validateProfile(profile)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Profil tidak valid')
  localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed.data))
  return parsed.data
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem('niu_lkh_seeded_v2')
  localStorage.removeItem('niu_lkh_stats_range_set')
}

export function getStats() {
  const entries = getEntries()
  const total = entries.length

  const today = todayLocalISO()
  const todayEntries = entries.filter((e) => e.tanggal === today)

  const thisWeek = getWeekRange()
  const weekEntries = entries.filter((e) => e.tanggal >= thisWeek.start && e.tanggal <= thisWeek.end)

  const tempat = {}
  entries.forEach((e) => {
    tempat[e.tempat] = (tempat[e.tempat] || 0) + 1
  })

  return { total, todayEntries: todayEntries.length, weekEntries: weekEntries.length, tempat }
}

function getWeekRange() {
  const start = getLocalWeekStart(todayLocalISO())
  const startDate = toLocalDate(start)
  const end = new Date(startDate)
  end.setDate(startDate.getDate() + 6)
  return { start, end: toLocalISODate(end) }
}

export function getEntriesByDate(date) {
  return getEntries().filter((e) => e.tanggal === date)
}

export function getCalendarData(year, month) {
  const entries = getEntries()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const days = {}
  entries.filter((e) => e.tanggal.startsWith(monthStr)).forEach((e) => {
    days[e.tanggal] = (days[e.tanggal] || 0) + 1
  })
  return days
}
