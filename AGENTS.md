# Niu-LKH — Project AGENTS.md

**Lokasi:** `Niu-LKH/`  
**Stack:** React 19, Vite 6, Tailwind v4, React Hook Form + Zod, Supabase, jspdf, xlsx, Vitest, Playwright, TypeScript/JSDoc  
**Remote:** `github.com/Niumination/Niu-LKH`  
**Deploy:** 🟢 GH Pages — v3.2

## Overview

Laporan Kegiatan Harian (LKH) — Aplikasi web untuk pencatatan kegiatan harian PNS di lingkungan Pemerintah Kabupaten Aceh Tengah.

## Fitur

- 8+ kolom input kegiatan harian dengan validasi Zod + React Hook Form
- Export PDF + Excel + CSV
- Upload foto kegiatan (kompres otomatis di browser)
- Dashboard, riwayat/kalender, statistik, preview Excel
- Sinkronisasi best-effort ke Supabase + Google Sheets
- Unit test (Vitest) & E2E (Playwright) setup

## Status

✅ v3.2 — validasi terpusat, tes, a11y, SEO, Supabase schema, CI diperkuat.
