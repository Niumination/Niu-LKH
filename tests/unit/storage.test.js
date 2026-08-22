import { describe, it, expect, beforeEach } from 'vitest'
import { saveEntry, getEntries, getProfile, saveProfile, clearAll } from '../../src/utils/storage'

const entry = {
  nama: 'Afrizal Munthe',
  nip: '199407272022031004',
  tanggal: '2026-07-01',
  uraianKegiatan: 'Pemeliharaan server',
  tempat: 'Kantor',
  penjab: 'Kepala Dinas',
  outputHasilKerja: 'Server normal',
  jam: '09:00',
  gol: '',
  jabatan: '',
  unitKerja: '',
  dasarSurat: '',
  buktiDukung: '',
}

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  it('saves and loads an entry', () => {
    saveEntry(entry)
    const entries = getEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].uraianKegiatan).toBe(entry.uraianKegiatan)
    expect(entries[0].id).toBeTruthy()
  })

  it('rejects invalid entries', () => {
    expect(() => saveEntry({ ...entry, uraianKegiatan: '' })).toThrow()
  })

  it('persists valid profile', () => {
    saveProfile({ ...entry, periodeMulai: '2026-01-01', periodeSelesai: '2026-06-30' })
    const p = getProfile()
    expect(p.nama).toBe(entry.nama)
  })

  it('clears all data', () => {
    saveEntry(entry)
    clearAll()
    expect(getEntries()).toHaveLength(0)
  })
})
