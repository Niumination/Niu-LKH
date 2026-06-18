/**
 * Export utilities — PDF, Excel (XLSX), CSV
 * Supports embedded photo/bukti dukung in PDF output
 *
 * PDF: uses jspdf + jspdf-autotable v5 (standalone autoTable())
 * XLSX: uses SheetJS with structured layout (merged cells, header section)
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * Format date string (YYYY-MM-DD) to Indonesian locale
 */
function formatDateID(dateStr) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format date to dd MMMM yyyy (Indonesian)
 */
function formatDateShort(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

/**
 * Get day name in Indonesian
 */
function getDayName(dateStr) {
  if (!dateStr) return ''
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  try {
    return days[new Date(dateStr).getDay()]
  } catch {
    return ''
  }
}

/**
 * Format time display
 */
function formatTime(jam) {
  if (!jam) return '-'
  // Already in HH:MM or HH:MM:SS format
  if (jam.includes(':')) return jam.slice(0, 5)
  return jam
}

// ──────────────────────────────────────────────
//  PDF Export
// ──────────────────────────────────────────────

/**
 * Export entries to PDF with embedded bukti dukung photos
 * Uses jspdf-autotable v5+ standalone autoTable() API
 * @param {Array} entries - Array of entry objects
 * @param {Object} profile - Profile { nama, nip, gol, jabatan, unitKerja, periodeMulai, periodeSelesai }
 * @param {Object} [options] - { filename, title }
 */
export function exportToPDF(entries, profile = {}, options = {}) {
  if (!entries || entries.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const doc = new jsPDF('l', 'mm', 'a4') // Landscape A4
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  // ── Header Info ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('LAPORAN KEGIATAN HARIAN (LKH)', pageWidth / 2, 18, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let yHeader = 26
  const lineH = 5

  // Profile info
  if (profile.nama) {
    doc.setFont('helvetica', 'bold')
    doc.text('Nama:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.nama, margin + 12, yHeader)
    yHeader += lineH
  }
  if (profile.nip) {
    doc.setFont('helvetica', 'bold')
    doc.text('NIP:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.nip, margin + 12, yHeader)
    yHeader += lineH
  }
  if (profile.jabatan) {
    doc.setFont('helvetica', 'bold')
    doc.text('Jabatan:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.jabatan, margin + 12, yHeader)
    yHeader += lineH
  }
  if (profile.unitKerja) {
    doc.setFont('helvetica', 'bold')
    doc.text('Unit Kerja:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.unitKerja, margin + 16, yHeader)
    yHeader += lineH
  }
  if (profile.periodeMulai && profile.periodeSelesai) {
    doc.setFont('helvetica', 'bold')
    doc.text('Periode:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(`${formatDateID(profile.periodeMulai)} — ${formatDateID(profile.periodeSelesai)}`,
      margin + 14, yHeader)
    yHeader += lineH
  }

  // Date range from data
  const sorted = [...entries].sort((a, b) => a.tanggal?.localeCompare(b.tanggal || ''))
  const firstDate = sorted[0]?.tanggal
  const lastDate = sorted[sorted.length - 1]?.tanggal
  if (firstDate && lastDate) {
    doc.setFont('helvetica', 'bold')
    doc.text('Laporan:', margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(`${formatDateID(firstDate)} — ${formatDateID(lastDate)}`,
      margin + 14, yHeader)
    yHeader += lineH
  }

  // Total entries
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', margin, yHeader)
  doc.setFont('helvetica', 'normal')
  doc.text(`${entries.length} kegiatan`, margin + 12, yHeader)
  yHeader += 6

  // ── Table ──
  const tableHead = [
    ['No', 'Hari/Tanggal', 'Jam', 'Uraian Kegiatan', 'Tempat',
     'Penanggung Jawab', 'Dasar Surat', 'Hasil Kerja', 'Dukungan']
  ]
  const tableBody = entries.map((entry, i) => [
    i + 1,
    `${getDayName(entry.tanggal)}, ${formatDateShort(entry.tanggal)}`,
    formatTime(entry.jam),
    entry.uraianKegiatan || '-',
    entry.tempat || '-',
    entry.penjab || '-',
    entry.dasarSurat || '-',
    entry.outputHasilKerja || '-',
    entry.buktiDukung ? '✓' : '-',
  ])

  // Column widths (landscape A4: 277mm usable, 9 columns)
  const colWidths = [8, 22, 8, 60, 28, 30, 30, 30, 8]

  // Use standalone autoTable(doc, options) — jspdf-autotable v5 API
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: yHeader,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1] },
      2: { cellWidth: colWidths[2], halign: 'center' },
      3: { cellWidth: colWidths[3] },
      4: { cellWidth: colWidths[4] },
      5: { cellWidth: colWidths[5] },
      6: { cellWidth: colWidths[6] },
      7: { cellWidth: colWidths[7] },
      8: { cellWidth: colWidths[8], halign: 'center' },
    },
    headStyles: {
      fillColor: [15, 15, 42],
      textColor: [34, 211, 238],
      fontStyle: 'bold',
      fontSize: 6,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [200, 200, 200],
      cellPadding: 1.5,
    },
    alternateRowStyles: {
      fillColor: [20, 20, 58, 30],
    },
    styles: {
      lineColor: [30, 41, 59],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    didDrawCell: (data) => {
      // Embed bukti dukung image in column 8 (index 8)
      if (data.column.index === 8 && data.cell.raw === '✓') {
        const entryIndex = data.row.index
        const entry = entries[entryIndex]
        if (entry?.buktiDukung) {
          try {
            const imgWidth = 14
            const imgHeight = 10
            const x = data.cell.x + (data.cell.width - imgWidth) / 2
            const y = data.cell.y + (data.cell.height - imgHeight) / 2
            const format = entry.buktiDukung.includes('image/png') ? 'PNG' : 'JPEG'
            doc.addImage(entry.buktiDukung, format, x, y, imgWidth, imgHeight)
          } catch (e) {
            console.warn('[PDF Export] Failed to embed image:', e)
          }
        }
      }
    },
    didParseCell: (data) => {
      if (data.column.index === 8 && data.cell.raw === '✓') {
        data.cell.styles.minCellHeight = 14
      }
    },
  })

  // ── Footer (page numbers) ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Halaman ${i} dari ${totalPages} | Niu-LKH v3.1 | ${new Date().toLocaleDateString('id-ID')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  // ── Save ──
  const filename = options.filename || `LKH_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// ──────────────────────────────────────────────
//  Excel (XLSX) Export
// ──────────────────────────────────────────────

/**
 * Export entries to structured Excel (.xlsx) with proper LKH layout
 * Uses merged cells for header sections, structured columns
 */
export function exportToExcel(entries, profile = {}, options = {}) {
  if (!entries || entries.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const sorted = [...entries].sort((a, b) => a.tanggal?.localeCompare(b.tanggal || ''))
  const firstDate = sorted[0]?.tanggal
  const lastDate = sorted[sorted.length - 1]?.tanggal
  const numCols = 9 // No, Hari/Tanggal, Jam, Kegiatan, Tempat, Penjab, Dasar Surat, Hasil Kerja, Dukungan

  // ── Build rows ──
  const rows = []

  // Row 0: Title (merged across all columns)
  rows.push(['LAPORAN KEGIATAN HARIAN (LKH)'])

  // Row 1: Empty
  rows.push([])

  // Row 2: Profile header
  let rowIdx = 2
  rows.push(['Nama', profile.nama || ''])
  rows.push(['NIP', profile.nip || ''])
  rows.push(['Pangkat/Gol', profile.gol || ''])
  rows.push(['Jabatan', profile.jabatan || ''])
  rows.push(['Unit Kerja', profile.unitKerja || ''])
  if (profile.periodeMulai && profile.periodeSelesai) {
    rows.push([`Periode: ${formatDateShort(profile.periodeMulai)} — ${formatDateShort(profile.periodeSelesai)}`])
  }

  // Empty row before table
  rows.push([])
  rowIdx = rows.length

  // Table header
  rows.push(['No', 'Hari/Tanggal', 'Jam', 'Uraian Kegiatan', 'Tempat',
    'Penanggung Jawab', 'Dasar Surat', 'Output/Hasil Kerja', 'Ket.'])

  // Data rows
  sorted.forEach((entry, i) => {
    rows.push([
      i + 1,
      `${getDayName(entry.tanggal)}, ${formatDateShort(entry.tanggal)}`,
      formatTime(entry.jam),
      entry.uraianKegiatan || '',
      entry.tempat || '',
      entry.penjab || '',
      entry.dasarSurat || '',
      entry.outputHasilKerja || '',
      entry.buktiDukung ? 'Ada foto' : '',
    ])
  })

  // Total row
  const totalRowIdx = rows.length
  const totalRow = new Array(numCols).fill('')
  totalRow[0] = 'Jumlah'
  totalRow[2] = `${sorted.length} kegiatan`
  rows.push(totalRow)

  // Empty row
  rows.push([])

  // Signature section
  rows.push(['Mengetahui,'])
  rows.push(['Kepala Dinas / Atasan Langsung'])
  rows.push([])
  rows.push([]) // signature line
  rows.push(['( _______________________________ )'])
  rows.push([])
  rows.push(['NIP. ........................................'])

  // ── Create Sheet ──
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // ── Merged cells ──
  const merges = [
    // Title row (A1:I1)
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    // Periode row (if present)
  ]
  // Add period row merge if it exists
  if (profile.periodeMulai && profile.periodeSelesai) {
    const periodeRow = rows.findIndex(r =>
      r[0] && typeof r[0] === 'string' && r[0].startsWith('Periode:'))
    if (periodeRow >= 0) {
      merges.push({ s: { r: periodeRow, c: 0 }, e: { r: periodeRow, c: numCols - 1 } })
    }
  }

  ws['!merges'] = merges

  // ── Column widths ──
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 24 },  // Hari/Tanggal
    { wch: 6 },   // Jam
    { wch: 55 },  // Uraian Kegiatan
    { wch: 22 },  // Tempat
    { wch: 28 },  // Penjab
    { wch: 28 },  // Dasar Surat
    { wch: 32 },  // Output/Hasil Kerja
    { wch: 10 },  // Ket
  ]

  // ── Row heights (title row taller) ──
  ws['!rows'] = []
  ws['!rows'][0] = { hpx: 36 }  // Title row

  // ── Workbook ──
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'LKH')

  // ── Profile sheet ──
  const profileRows = [
    ['Profil Pengguna'],
    [],
    ['Nama', profile.nama || ''],
    ['NIP', profile.nip || ''],
    ['Pangkat/Gol', profile.gol || ''],
    ['Jabatan', profile.jabatan || ''],
    ['Unit Kerja', profile.unitKerja || ''],
    ['Periode Mulai', profile.periodeMulai || ''],
    ['Periode Selesai', profile.periodeSelesai || ''],
    [],
    ['Ringkasan'],
    ['Total Kegiatan', entries.length],
    ['Periode Data', `${firstDate || '-'} s.d. ${lastDate || '-'}`],
    ['Diexport', new Date().toLocaleString('id-ID')],
  ]
  const wsProfile = XLSX.utils.aoa_to_sheet(profileRows)
  wsProfile['!cols'] = [{ wch: 20 }, { wch: 45 }]
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Profil')

  // ── Save ──
  const filename = options.filename || `LKH_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ──────────────────────────────────────────────
//  CSV Export
// ──────────────────────────────────────────────

/**
 * Export entries to CSV
 */
export function exportToCSV(entries, profile = {}, options = {}) {
  if (!entries || entries.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const header = [
    'No', 'Hari/Tanggal', 'Jam', 'Uraian Kegiatan', 'Tempat',
    'Penanggung Jawab', 'Dasar Surat', 'Output/Hasil Kerja', 'Ket'
  ]

  const rows = entries.map((entry, i) => [
    i + 1,
    `${getDayName(entry.tanggal)}, ${formatDateShort(entry.tanggal)}`,
    formatTime(entry.jam),
    `"${(entry.uraianKegiatan || '').replace(/"/g, '""')}"`,
    `"${(entry.tempat || '').replace(/"/g, '""')}"`,
    `"${(entry.penjab || '').replace(/"/g, '""')}"`,
    `"${(entry.dasarSurat || '').replace(/"/g, '""')}"`,
    `"${(entry.outputHasilKerja || '').replace(/"/g, '""')}"`,
    entry.buktiDukung ? 'Ada foto' : '',
  ])

  const csvContent = [
    header.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n')

  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = options.filename || `LKH_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
