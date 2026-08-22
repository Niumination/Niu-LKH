import { describe, it, expect } from 'vitest'
import { toLocalISODate, todayLocalISO, toLocalDate, getLocalWeekStart } from '../../src/lib/date'

describe('date helpers', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 5)
    expect(toLocalISODate(d)).toBe('2026-01-05')
  })

  it('todayLocalISO returns a stamp', () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('parses YYYY-MM-DD into a local Date (mind timezone)', () => {
    const d = toLocalDate('2026-07-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(1)
  })

  it('computes Monday as week start', () => {
    const sunday = '2026-07-05'
    expect(getLocalWeekStart(sunday)).toBe('2026-06-29')
  })
})
