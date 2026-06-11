# Niu-LKH

**Laporan Kegiatan Harian Digital** — Aplikasi web modern untuk pencatatan dan pelaporan kegiatan harian.

## ✨ Fitur

- 📝 **Form Laporan** — Input kegiatan dengan 7 field + autosave draft
- 📊 **Dashboard** — Overview real-time statistik kegiatan
- 📅 **Riwayat + Kalender** — Cari, filter, dan lihat kegiatan per tanggal
- 📈 **Statistik** — Grafik harian, breakdown lokasi, kata kunci aktivitas
- 💾 **Penyimpanan Lokal** — Data tersimpan di browser (localStorage)
- ☁️ **Sinkronisasi Google Sheets** — Otomatis kirim ke Google Spreadsheet
- 🌙 **Tema Gaming HUD** — Dark theme dengan aksen cyan-purple
- 📱 **Responsif** — Layar desktop, tablet, dan mobile

## 🚀 Tech Stack

| Teknologi | Versi |
|-----------|-------|
| React | 19.2 |
| Vite | 6.4 |
| Tailwind CSS | 4.3 |
| React Router | 7.6 |
| Lucide Icons | 0.546 |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build produksi
npm run build

# Preview build
npm run preview
```

## 🌐 Deployment

Aplikasi ini dideploy ke **GitHub Pages**:
- **URL:** https://niumination.github.io/Niu-LKH
- **Deploy:** `npm run deploy`

## 📋 Struktur Proyek

```
Niu-LKH/
├── public/           # Static assets
├── src/
│   ├── components/   # Layout, reusable components
│   ├── pages/        # Dashboard, FormLKH, History, Stats
│   └── utils/        # storage.js, helpers
├── index.html
├── vite.config.js
└── package.json
```

## 🔧 Google Apps Script

Backend menggunakan Google Apps Script yang mengirim data ke Google Spreadsheet.
URL endpoint dikonfigurasi di `src/pages/FormLKH.jsx`.

## 📦 Status Proyek

- **v2.0** — Rebuild total dari CRA ke Vite + Tailwind v4
- Multi-page SPA dengan 4 halaman (Dashboard, Form, Riwayat, Statistik)
- Penyimpanan lokal + sinkronisasi cloud

---

Dibuat oleh [Afrizal Munthe](https://github.com/Niumination) — Bagian dari ekosistem Niumination.
