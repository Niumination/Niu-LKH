import { syncAllToSupabase } from './supabaseService'
import { parseSeedEntry } from '../lib/validation'

const ENTRIES_KEY = 'niu_lkh_entries'
const SEED_FLAG_KEY = 'niu_lkh_seeded_v2'

const BASE = import.meta.env.BASE_URL || '/'

function getRawEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function seedFromJSON() {
  try {
    const resp = await fetch(`${BASE}data/lkh-entries.json`)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    if (!data.entries || !Array.isArray(data.entries)) throw new Error('Invalid data format')

    const existing = getRawEntries()
    const existingDates = new Set(existing.map((e) => e.tanggal))
    const added = []

    data.entries.forEach((entry) => {
      if (existingDates.has(entry.tanggal)) return
      const parsed = parseSeedEntry(entry)
      if (parsed) {
        existing.push(parsed)
        added.push(parsed)
      }
    })

    localStorage.setItem(ENTRIES_KEY, JSON.stringify(existing))
    localStorage.setItem(
      SEED_FLAG_KEY,
      JSON.stringify({ seededAt: new Date().toISOString(), total: data.entries.length, added: added.length, profile: data.profile }),
    )

    return { total: data.entries.length, added: added.length, profile: data.profile }
  } catch (err) {
    console.error('[Seed] Failed:', err)
    return { total: 0, added: 0, error: err.message }
  }
}

export function isSeeded() {
  try {
    const raw = localStorage.getItem(SEED_FLAG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getSeedMeta() {
  return isSeeded()
}

export function clearSeed() {
  localStorage.removeItem(SEED_FLAG_KEY)
  localStorage.removeItem(ENTRIES_KEY)
}

export function getMonthlyProgress(entries) {
  const months = {}
  entries.forEach((e) => {
    const m = e.tanggal.slice(0, 7)
    if (!months[m]) months[m] = { total: 0, holidays: 0, workdays: 0, locations: new Set() }
    months[m].total++
    const isHoliday = e.uraianKegiatan?.toLowerCase().includes('libur') || e.uraianKegiatan?.toLowerCase().includes('cuti')
    if (isHoliday) months[m].holidays++
    else months[m].workdays++
    months[m].locations.add(e.tempat)
  })

  return Object.entries(months)
    .sort()
    .map(([month, data]) => ({
      month,
      total: data.total,
      holidays: data.holidays,
      workdays: data.workdays,
      locations: data.locations.size,
      completion: Math.round((data.workdays / data.total) * 100),
    }))
}

export async function seedToSupabase() {
  try {
    const entries = getRawEntries()
    if (entries.length === 0) return { synced: 0 }
    return await syncAllToSupabase(entries)
  } catch (err) {
    console.warn('[Seed] Supabase sync skipped:', err.message)
    return { synced: 0, error: err.message }
  }
}
