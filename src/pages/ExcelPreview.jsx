import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  FileSpreadsheet, Upload, Table, Sheet as SheetIcon,
  Download, Trash2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  Eye, EyeOff, Search, X
} from 'lucide-react'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function ExcelPreview() {
  const [file, setFile] = useState(null)
  const [sheets, setSheets] = useState([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [rows, setRows] = useState([])
  const [cols, setCols] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    parseFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) parseFile(f)
  }

  function parseFile(f) {
    // Validate
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      setError('Hanya file .xlsx atau .xls yang didukung')
      return
    }

    setIsLoading(true)
    setError(null)
    setFile(f)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' })

        const sheetNames = wb.SheetNames
        const parsed = sheetNames.map((name, idx) => {
          const ws = wb.Sheets[name]
          const json = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 })
          return { name, idx, raw: json }
        })

        setSheets(parsed)
        setActiveSheet(0)

        // Set first sheet
        const first = parsed[0]
        setCols(first.raw[0] || [])
        setRows(first.raw.slice(1))
        setIsLoading(false)
      } catch (err) {
        setError('Gagal membaca file: ' + err.message)
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setError('Gagal membaca file')
      setIsLoading(false)
    }
    reader.readAsArrayBuffer(f)
  }

  function switchSheet(idx) {
    setActiveSheet(idx)
    const s = sheets[idx]
    setCols(s.raw[0] || [])
    setRows(s.raw.slice(1))
    setSearchQuery('')
  }

  function clearFile() {
    setFile(null)
    setSheets([])
    setRows([])
    setCols([])
    setActiveSheet(0)
    setSearchQuery('')
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const filteredRows = searchQuery
    ? rows.filter(r => r.some(cell =>
        String(cell || '').toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : rows

  const currentSheet = sheets[activeSheet]
  const sheetName = currentSheet?.name || ''
  const isLKH = sheetName.toLowerCase().includes('januari') ||
    sheetName.toLowerCase().includes('februari') ||
    MONTHS.includes(sheetName)

  function getHeaderColor(h) {
    const lower = String(h || '').toLowerCase()
    if (lower.includes('hari') || lower.includes('tanggal')) return 'text-cyan-400'
    if (lower.includes('kegiatan') || lower.includes('uraian')) return 'text-purple-400'
    if (lower.includes('tempat')) return 'text-green-400'
    if (lower.includes('penjab') || lower.includes('pemberi')) return 'text-amber-400'
    if (lower.includes('surat') || lower.includes('dasar')) return 'text-pink-400'
    if (lower.includes('foto') || lower.includes('dokumentasi') || lower.includes('bukti')) return 'text-rose-400'
    if (lower.includes('output') || lower.includes('hasil')) return 'text-emerald-400'
    if (lower.includes('jam')) return 'text-indigo-400'
    if (lower.includes('nip')) return 'text-sky-400'
    if (lower.includes('gol')) return 'text-orange-400'
    if (lower.includes('nama')) return 'text-cyan-400'
    return 'text-slate-300'
  }

  function cellValue(val) {
    if (val === null || val === undefined) return '-'
    if (val instanceof Date) {
      try { return val.toLocaleDateString('id-ID') } catch { return val.toISOString().split('T')[0] }
    }
    return String(val)
  }

  const totalDataRows = sheets.reduce((sum, s) => sum + Math.max(0, s.raw.length - 1), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyber-800 to-cyber-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Excel Preview</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Preview File Excel</h1>
          <p className="text-slate-400 mt-1">Upload dan lihat isi file .xlsx langsung di browser</p>
        </div>
      </div>

      {/* Upload Area */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/40 rounded-2xl p-12 lg:p-16 text-center transition-all group cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <div className="absolute inset-0 bg-cyan-500/[0.02] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-semibold text-lg mb-1">Upload File Excel</p>
            <p className="text-slate-400 text-sm mb-4">Drag & drop atau klik untuk pilih file</p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyber-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-cyan-500/30 transition-all">
              <FileSpreadsheet className="w-4 h-4" />
              Pilih File .xlsx
            </span>
            <p className="text-xs text-slate-600 mt-4">Didukung: Excel 2007+ (.xlsx, .xls)</p>
          </div>
        </div>
      ) : (
        /* File Loaded View */
        <>
          {/* File Info + Clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-cyber-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-200 font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB &middot; {sheets.length} sheet &middot; {totalDataRows} baris data
                </p>
              </div>
            </div>
            <button onClick={clearFile}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 rounded-lg text-xs text-slate-400 hover:text-red-400 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Hapus File
            </button>
          </div>

          {/* Sheet Tabs */}
          {sheets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {sheets.map((s, idx) => (
                <button key={s.name} onClick={() => switchSheet(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeSheet === idx
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}>
                  <SheetIcon className="w-3.5 h-3.5" />
                  {s.name}
                  <span className="text-[10px] opacity-50">({s.raw.length - 1})</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Cari di sheet ${sheetName}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-cyber-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 transition-all outline-none text-sm" />
          </div>

          {/* Sheet Name */}
          <div className="flex items-center gap-2">
            <SheetIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-semibold text-lg">{sheetName}</h3>
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
              {cols.length} kolom &middot; {filteredRows.length} baris
              {searchQuery && rows.length !== filteredRows.length && (
                <span className="text-cyan-400 ml-1">(filtered)</span>
              )}
            </span>
          </div>

          {/* Preview Table */}
          {isLoading ? (
            <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Memproses file...</p>
            </div>
          ) : cols.length === 0 ? (
            <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">Sheet ini kosong</p>
            </div>
          ) : (
            <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-cyber-800 border-b border-slate-700">
                      <th className="px-3 py-2.5 text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider w-10">#</th>
                      {cols.map((col, ci) => (
                        <th key={ci} className={`px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${getHeaderColor(col)}`}>
                          {cellValue(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={cols.length + 1} className="px-3 py-8 text-center text-slate-500">
                          {searchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada data'}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, ri) => (
                        <tr key={ri}
                          className={`hover:bg-cyan-500/[0.02] transition-colors ${
                            isLKH && cellValue(row[0]).toLowerCase().includes('libur') ? 'bg-red-500/[0.03]' : ''
                          }`}>
                          <td className="px-3 py-2 text-xs text-slate-600 font-mono">{ri + 1}</td>
                          {cols.map((_, ci) => {
                            const val = cellValue(row[ci])
                            const isEmpty = val === '-' || val === ''
                            return (
                              <td key={ci} className={`px-3 py-2 text-xs ${
                                isEmpty ? 'text-slate-700 italic' : 'text-slate-300'
                              } whitespace-pre-wrap max-w-[300px] truncate`}
                                title={val.length > 80 ? val : undefined}>
                                {isEmpty ? '-' : val}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>Data: {filteredRows.length} baris &middot; {cols.length} kolom &middot; Sheet: {activeSheet + 1}/{sheets.length}</span>
                <span>{filteredRows.length > 50 ? `Menampilkan ${filteredRows.length} baris` : ''}</span>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/10 rounded">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
    </div>
  )
}
