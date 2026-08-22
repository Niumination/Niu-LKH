import { describe, it, expect } from 'vitest'
import { validateLkh, validateProfile, parseSeedEntry } from '../../src/lib/validation'

const validEntry = {
  nama: 'Afrizal Munthe',
  nip: '199407272022031004',
  gol: 'PENATA MUDA, II/d',
  jabatan: 'PRANATA KOMPUTER',
  unitKerja: 'Dinas Kominfo',
  tanggal: '2026-07-01',
  jam: '08:00',
  uraianKegiatan: 'Monitoring jaringan',
  tempat: 'Kantor Dinas',
  penjab: 'Kepala Dinas',
  dasarSurat: '123/SP',
  outputHasilKerja: 'Laporan selesai',
  buktiDukung: '',
}

describe('validateLkh', () => {
  it('accepts a valid entry', () => {
    expect(validateLkh(validEntry).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const { success, error } = validateLkh({ ...validEntry, uraianKegiatan: ' ' })
    expect(success).toBe(false)
    expect(error.issues.some((i) => i.path.includes('uraianKegiatan'))).toBe(true)
  })

  it('rejects malformed date', () => {
    expect(validateLkh({ ...validEntry, tanggal: '01-07-2026' }).success).toBe(false)
  })

  it('rejects invalid time', () => {
    expect(validateLkh({ ...validEntry, jam: '25:99' }).success).toBe(false)
  })
})

describe('validateProfile', () => {
  it('accepts valid profile', () => {
    const res = validateProfile({ ...validEntry, periodeMulai: '2026-01-01', periodeSelesai: '2026-06-30' })
    expect(res.success).toBe(true)
  })

  it('rejects missing nama/nipp', () => {
    const res = validateProfile({ nama: '', nip: '' })
    expect(res.success).toBe(false)
  })

  it('rejects invalid period range', () => {
    const res = validateProfile({ ...validEntry, periodeMulai: '2026-06-30', periodeSelesai: '2026-01-01' })
    expect(res.success).toBe(false)
  })
})

describe('parseSeedEntry', () => {
  it('normalizes valid seed entry and adds id', () => {
    const parsed = parseSeedEntry(validEntry)
    expect(parsed).not.toBeNull()
    expect(parsed.id).toBeTruthy()
    expect(parsed.createdAt).toBeTruthy()
  })

  it('returns null for invalid seed entry', () => {
    expect(parseSeedEntry({ ...validEntry, tanggal: 'not-a-date' })).toBeNull()
  })
})
