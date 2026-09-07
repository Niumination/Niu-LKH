import { supabase, supabaseAvailable } from '../lib/supabase'

const TABLE = 'lkh_entries'
const BATCH_SIZE = 50
const SELECTED_COLUMNS = [
  'id',
  'user_id',
  'tanggal',
  'hari',
  'jam',
  'uraian_kegiatan',
  'tempat',
  'penjab',
  'dasar_surat',
  'output_hasil_kerja',
  'bukti_dukung',
  'nama',
  'nip',
  'gol',
  'jabatan',
  'unit_kerja',
  'created_at',
].join(',')

function toSupabaseFormat(entry) {
  const now = new Date().toISOString()
  return {
    id: entry.id,
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
    updated_at: now,
  }
}

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

export async function fetchEntries() {
  if (!supabaseAvailable) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECTED_COLUMNS)
    .order('tanggal', { ascending: false })

  if (error) {
    console.error('[Supabase] fetch error:', error)
    return []
  }
  return (data || []).map(fromSupabaseFormat)
}

export async function saveEntry(entry) {
  if (!supabaseAvailable) throw new Error('Supabase tidak dikonfigurasi')
  const row = toSupabaseFormat(entry)
  const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: 'id' })
  if (error) {
    console.error('[Supabase] save error:', error)
    throw error
  }
  return data
}

export async function deleteEntry(id) {
  if (!supabaseAvailable) throw new Error('Supabase tidak dikonfigurasi')
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) {
    console.error('[Supabase] delete error:', error)
    throw error
  }
}

export async function syncAllToSupabase(localEntries) {
  if (!supabaseAvailable) return { synced: 0, error: 'Supabase tidak dikonfigurasi' }
  if (!localEntries || localEntries.length === 0) return { synced: 0 }

  const rows = localEntries.map(toSupabaseFormat)
  let synced = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(TABLE).upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] batch ${i} error:`, error)
      throw error
    }
    synced += batch.length
  }

  localStorage.setItem('niu_lkh_sync_time', new Date().toISOString())
  return { synced }
}

export async function checkConnection() {
  if (!supabaseAvailable) return { ok: false, error: 'Supabase tidak dikonfigurasi' }
  try {
    const { data, error } = await supabase.from(TABLE).select('id', { count: 'exact', head: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, count: data?.length || 0 }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function getLastSyncTime() {
  const t = localStorage.getItem('niu_lkh_sync_time')
  if (!t) return null
  return new Date(t)
}
