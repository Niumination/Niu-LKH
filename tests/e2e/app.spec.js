import { test, expect } from '@playwright/test'

test.describe('Niu-LKH app', () => {
  test('dashboard renders', async ({ page }) => {
    await page.goto('/#/dashboard')
    await expect(page.getByRole('heading', { name: /Laporan Kegiatan Harian/i })).toBeVisible()
  })

  test('form has required fields', async ({ page }) => {
    await page.goto('/#/form')
    await expect(page.getByLabel(/Nama Lengkap/i)).toBeVisible()
    await expect(page.getByLabel(/Uraian Kegiatan/i)).toBeVisible()
    await expect(page.getByLabel(/Tempat/i)).toBeVisible()
  })

  test('accessible navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
  })
})
