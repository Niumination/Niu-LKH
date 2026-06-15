/**
 * Export utilities — PDF, Excel (XLSX), CSV
 * Supports embedded photo/bukti dukung in PDF output
 */
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
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
 * Format month name in Indonesian
 */
function getMonthName(monthNum) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[monthNum - 1] || ''
}

// ──────────────────────────────────────────────
//  PDF Export
// ──────────────────────────────────────────────

/**
 * Export entries to PDF with embedded bukti dukung photos
 * @param {Array} entries - Array of entry objects
 * @param {Object} profile - Profile { nama, jabatan, unitKerja, periodeMulai, periodeSelesai }
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
    doc.text(`Nama:`, margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.nama, margin + 12, yHeader)
    yHeader += lineH
  }
  if (profile.jabatan) {
    doc.setFont('helvetica', 'bold')
    doc.text(`Jabatan:`, margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.jabatan, margin + 12, yHeader)
    yHeader += lineH
  }
  if (profile.unitKerja) {
    doc.setFont('helvetica', 'bold')
    doc.text(`Unit Kerja:`, margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.unitKerja, margin + 16, yHeader)
    yHeader += lineH
  }
  if (profile.periodeMulai && profile.periodeSelesai) {
    doc.setFont('helvetica', 'bold')
    doc.text(`Periode:`, margin, yHeader)
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
    doc.text(`Laporan:`, margin, yHeader)
    doc.setFont('helvetica', 'normal')
    doc.text(`${formatDateID(firstDate)} — ${formatDateID(lastDate)}`,
      margin + 14, yHeader)
    yHeader += lineH
  }

  // Total entries
  doc.setFont('helvetica', 'bold')
  doc.text(`Total:`, margin, yHeader)
  doc.setFont('helvetica', 'normal')
  doc.text(`${entries.length} kegiatan`, margin + 12, yHeader)
  yHeader += 6

  // ── Table ──
  const tableHead = [['No', 'Tanggal', 'Uraian Kegiatan', 'Tempat', 'Penjab', 'Dasar Surat', 'Output/Hasil Kerja', 'Bukti Dukung']]
  const tableBody = entries.map((entry, i) => [
    i + 1,
    entry.tanggal || '-',
    entry.uraianKegiatan || '-',
    entry.tempat || '-',
    entry.penjab || '-',
    entry.dasarSurat || '-',
    entry.outputHasilKerja || '-',
    entry.buktiDukung ? '✓' : '-',
  ])

  // Column widths (landscape A4: 277mm usable width)
  const colWidths = [10, 22, 70, 30, 35, 35, 35, 10]

  doc.autoTable({
    head: tableHead,
    body: tableBody,
    startY: yHeader,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], halign: 'center' },
      2: { cellWidth: colWidths[2] },
      3: { cellWidth: colWidths[3] },
      4: { cellWidth: colWidths[4] },
      5: { cellWidth: colWidths[5] },
      6: { cellWidth: colWidths[6] },
      7: { cellWidth: colWidths[7], halign: 'center' },
    },
    headStyles: {
      fillColor: [15, 15, 42],
      textColor: [34, 211, 238],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [200, 200, 200],
      cellPadding: 2,
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
      // Embed bukti dukung image in column 7 (index 7)
      if (data.column.index === 7 && data.cell.raw === '✓') {
        const entryIndex = data.row.index
        const entry = entries[entryIndex]
        if (entry?.buktiDukung) {
          try {
            const imgWidth = 18
            const imgHeight = 14
            const x = data.cell.x + (data.cell.width - imgWidth) / 2
            const y = data.cell.y + (data.cell.height - imgHeight) / 2

            // Format detection
            const format = entry.buktiDukung.includes('image/png') ? 'PNG' : 'JPEG'
            doc.addImage(entry.buktiDukung, format, x, y, imgWidth, imgHeight)
          } catch (e) {
            console.warn('[PDF Export] Failed to embed image:', e)
          }
        }
      }
    },
    didParseCell: (data) => {
      // Make image indicator cells have enough height
      if (data.column.index === 7 && data.cell.raw === '✓') {
        data.cell.styles.minCellHeight = 16
      }
    },
  })

  // ── Footer (page numbers) ──
  const totalPages = doc.internal.getNumberOfPages()
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
 * Export entries to Excel (.xlsx) with photo indicator
 */
export function exportToExcel(entries, profile = {}, options = {}) {
  if (!entries || entries.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  // ── Data Sheet ──
  const headerRow = [
    'No', 'Tanggal', 'Uraian Kegiatan', 'Tempat',
    'Penanggung Jawab', 'Dasar Surat', 'Output/Hasil Kerja', 'Bukti Dukung'
  ]

  const dataRows = entries.map((entry, i) => [
    i + 1,
    entry.tanggal || '',
    entry.uraianKegiatan || '',
    entry.tempat || '',
    entry.penjab || '',
    entry.dasarSurat || '',
    entry.outputHasilKerja || '',
    entry.buktiDukung ? '✓ Ada foto' : '-',
  ])

  const wsData = [headerRow, ...dataRows]

  // ── Profile Sheet ──
  const profileRows = [
    ['Profil Pengguna'],
    ['Nama', profile.nama || ''],
    ['Jabatan', profile.jabatan || ''],
    ['Unit Kerja', profile.unitKerja || ''],
    ['Periode Mulai', profile.periodeMulai || ''],
    ['Periode Selesai', profile.periodeSelesai || ''],
    [],
    ['Ringkasan'],
    ['Total Kegiatan', entries.length],
    ['Periode Data', `${entries[0]?.tanggal || '-'} s.d. ${entries[entries.length - 1]?.tanggal || '-'}`],
    ['Diexport', new Date().toLocaleString('id-ID')],
  ]

  // ── Workbook ──
  const wb = XLSX.utils.book_new()

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 14 },  // Tanggal
    { wch: 50 },  // Uraian Kegiatan
    { wch: 20 },  // Tempat
    { wch: 25 },  // Penjab
    { wch: 25 },  // Dasar Surat
    { wch: 30 },  // Output/Hasil Kerja
    { wch: 15 },  // Bukti Dukung
  ]

  const wsProfile = XLSX.utils.aoa_to_sheet(profileRows)
  wsProfile['!cols'] = [
    { wch: 20 },
    { wch: 40 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Data LKH')
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Profil')

  const filename = options.filename || `LKH_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ──────────────────────────────────────────────
//  CSV Export
// ──────────────────────────────────────────────

/**
 * Export entries to CSV
 * CSV cannot embed images, so bukti dukung is indicated by ✓/✗ column
 */
export function exportToCSV(entries, profile = {}, options = {}) {
  if (!entries || entries.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const header = [
    'No', 'Tanggal', 'Uraian Kegiatan', 'Tempat',
    'Penanggung Jawab', 'Dasar Surat', 'Output/Hasil Kerja', 'Bukti Dukung'
  ]

  const rows = entries.map((entry, i) => [
    i + 1,
    entry.tanggal || '',
    `"${(entry.uraianKegiatan || '').replace(/"/g, '""')}"`,
    `"${(entry.tempat || '').replace(/"/g, '""')}"`,
    `"${(entry.penjab || '').replace(/"/g, '""')}"`,
    `"${(entry.dasarSurat || '').replace(/"/g, '""')}"`,
    `"${(entry.outputHasilKerja || '').replace(/"/g, '""')}"`,
    entry.buktiDukung ? 'Ada foto' : '-',
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
