const ENTRIES_KEY = 'niu_lkh_entries'
const SEED_FLAG_KEY = 'niu_lkh_seeded_v2'

/**
 * Fetch and load LKH seed data from public/data/lkh-entries.json
 * into localStorage, merging with existing entries.
 */
export async function seedFromJSON() {
  try {
    const resp = await fetch('/data/lkh-entries.json')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    if (!data.entries || !Array.isArray(data.entries)) throw new Error('Invalid data format')

    // Check what's already in localStorage
    const existing = getRawEntries()
    const existingDates = new Set(existing.map(e => e.tanggal))

    // Only add entries for dates not already in localStorage
    let added = 0
    data.entries.forEach(entry => {
      if (!existingDates.has(entry.tanggal)) {
        existing.push(entry)
        added++
      }
    })

    localStorage.setItem(ENTRIES_KEY, JSON.stringify(existing))
    localStorage.setItem(SEED_FLAG_KEY, JSON.stringify({
      seededAt: new Date().toISOString(),
      total: data.entries.length,
      added,
      profile: data.profile
    }))

    return { total: data.entries.length, added, profile: data.profile }
  } catch (err) {
    console.error('[Seed] Failed:', err)
    return { total: 0, added: 0, error: err.message }
  }
}

/**
 * Check if seed data has been loaded
 */
export function isSeeded() {
  try {
    const raw = localStorage.getItem(SEED_FLAG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/**
 * Get seed metadata
 */
export function getSeedMeta() {
  return isSeeded()
}

/**
 * Clear seed data and flag
 */
export function clearSeed() {
  localStorage.removeItem(SEED_FLAG_KEY)
  localStorage.removeItem(ENTRIES_KEY)
}

/**
 * Get monthly progress from seeded data
 */
export function getMonthlyProgress(entries) {
  const months = {}
  entries.forEach(e => {
    const m = e.tanggal.slice(0, 7) // YYYY-MM
    if (!months[m]) months[m] = { total: 0, holidays: 0, workdays: 0, locations: new Set() }
    months[m].total++
    const isHoliday = e.uraianKegiatan?.toLowerCase().includes('libur') ||
      e.uraianKegiatan?.toLowerCase().includes('cuti')
    if (isHoliday) months[m].holidays++
    else months[m].workdays++
    months[m].locations.add(e.tempat)
  })

  return Object.entries(months).sort().map(([month, data]) => ({
    month,
    total: data.total,
    holidays: data.holidays,
    workdays: data.workdays,
    locations: data.locations.size,
    completion: Math.round((data.workdays / data.total) * 100)
  }))
}

function getRawEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
