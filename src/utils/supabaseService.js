import { supabase } from '../lib/supabase'

const TABLE = 'lkh_entries'

/**
 * Map frontend entry format → Supabase row
 */
function toSupabaseFormat(entry) {
  return {
    id: entry.id,                    // UUID string → TEXT PRIMARY KEY
    user_id: 'afrizal',
    tanggal: entry.tanggal,
    hari: entry.hari || '',
    jam: entry.jam || '',
    uraian_kegiatan: entry.uraianKegiatan,
    tempat: entry.tempat || '',
    penjab: entry.penjab || '',
    dasar_surat: entry.dasarSurat || '',
    output_hasil_kerja: entry.outputHasilKerja || '',
    bukti_dukung: entry.buktiDukung || '',
    nama: entry.nama || 'Afrizal Munthe, A.Md.Kom',
    nip: entry.nip || '199407272022031004',
    gol: entry.gol || 'PENATA MUDA, II/d',
    jabatan: entry.jabatan || 'PRANATA KOMPUTER - TERAMPIL',
    unit_kerja: entry.unitKerja || 'Dinas Komunikasi dan Informatika Kabupaten Aceh Tengah',
  }
}

/**
 * Map Supabase row → frontend entry format
 */
function fromSupabaseFormat(row) {
  return {
    id: row.id,
    nama: row.nama,
    nip: row.nip,
    gol: row.gol,
    jabatan: row.jabatan,
    unitKerja: row.unit_kerja,
    tanggal: row.tanggal,
    hari: row.hari,
    jam: row.jam,
    uraianKegiatan: row.uraian_kegiatan,
    tempat: row.tempat,
    penjab: row.penjab,
    dasarSurat: row.dasar_surat,
    outputHasilKerja: row.output_hasil_kerja,
    buktiDukung: row.bukti_dukung,
    createdAt: row.created_at,
  }
}

/**
 * Fetch all entries from Supabase
 */
export async function fetchEntries() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('tanggal', { ascending: false })

  if (error) {
    console.error('[Supabase] fetch error:', error)
    return []
  }
  return (data || []).map(fromSupabaseFormat)
}

/**
 * Save a single entry to Supabase (upsert by id)
 */
export async function saveEntry(entry) {
  const row = toSupabaseFormat(entry)
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })

  if (error) {
    console.error('[Supabase] save error:', error)
    throw error
  }
  return data
}

/**
 * Delete an entry from Supabase by id
 */
export async function deleteEntry(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Supabase] delete error:', error)
    throw error
  }
}

/**
 * Sync ALL localStorage entries to Supabase (batch upsert)
 */
export async function syncAllToSupabase(localEntries) {
  if (!localEntries || localEntries.length === 0) return { synced: 0 }

  const rows = localEntries.map(toSupabaseFormat)
  const now = new Date().toISOString()

  let synced = 0
  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50).map(r => ({ ...r, updated_at: now }))
    const { error } = await supabase
      .from(TABLE)
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`[Supabase] batch ${i} error:`, error)
      throw error
    }
    synced += batch.length
  }

  localStorage.setItem('niu_lkh_sync_time', new Date().toISOString())
  return { synced }
}

/**
 * Check Supabase connection + table health
 */
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })

    if (error) return { ok: false, error: error.message }
    return { ok: true, count: data?.length || 0 }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime() {
  const t = localStorage.getItem('niu_lkh_sync_time')
  if (!t) return null
  return new Date(t)
}
