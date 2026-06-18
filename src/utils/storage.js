const STORAGE_KEY = 'niu_lkh_entries'
const DRAFT_KEY = 'niu_lkh_draft'
const PROFILE_KEY = 'niu_lkh_profile'

export function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveEntry(entry) {
  const entries = getEntries()
  entries.unshift({
    ...entry,
    id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString()
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function getDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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
    return raw ? JSON.parse(raw) : { nama: '', nip: '', gol: '', jabatan: '', unitKerja: '', periodeMulai: '', periodeSelesai: '' }
  } catch {
    return { nama: '', nip: '', gol: '', jabatan: '', unitKerja: '', periodeMulai: '', periodeSelesai: '' }
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(DRAFT_KEY)
}

export function getStats() {
  const entries = getEntries()
  const total = entries.length

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter(e => e.tanggal === today)

  const thisWeek = getWeekRange()
  const weekEntries = entries.filter(e => e.tanggal >= thisWeek.start && e.tanggal <= thisWeek.end)

  const tempat = {}
  entries.forEach(e => { tempat[e.tempat] = (tempat[e.tempat] || 0) + 1 })

  return { total, todayEntries: todayEntries.length, weekEntries: weekEntries.length, tempat }
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  }
}

export function getEntriesByDate(date) {
  return getEntries().filter(e => e.tanggal === date)
}

export function getCalendarData(year, month) {
  const entries = getEntries()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const days = {}
  entries.filter(e => e.tanggal.startsWith(monthStr)).forEach(e => {
    days[e.tanggal] = (days[e.tanggal] || 0) + 1
  })
  return days
}
