import { useState, useEffect, useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Trash2, MapPin, FileText, Search, Filter, X, Briefcase, FolderOpen, Image, Download, FileSpreadsheet, File as FileIcon } from 'lucide-react'
import { getEntries, deleteEntry, getCalendarData, getProfile } from '../utils/storage'
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/export'

export default function History() {
  const [entries, setEntries] = useState([])
  const [viewMode, setViewMode] = useState('list')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTempat, setFilterTempat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    setEntries(getEntries())
  }, [])

  const calendarData = useMemo(() => getCalendarData(currentYear, currentMonth + 1), [currentYear, currentMonth, entries])

  const filteredEntries = useMemo(() => {
    let result = entries
    if (selectedDate) result = result.filter(e => e.tanggal === selectedDate)
    if (searchQuery) result = result.filter(e =>
      e.uraianKegiatan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tempat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.outputHasilKerja?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.penjab?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filterTempat) result = result.filter(e => e.tempat === filterTempat)
    return result
  }, [entries, selectedDate, searchQuery, filterTempat])

  const allTempat = useMemo(() => [...new Set(entries.map(e => e.tempat).filter(Boolean))], [entries])

  function handleDelete(id) {
    const updated = deleteEntry(id)
    setEntries(updated)
    setConfirmDelete(null)
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
  }

  const monthDays = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const today = new Date().toISOString().split('T')[0]

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* View Toggle */}
      <div className="flex gap-1 bg-cyber-900/60 border border-slate-800 rounded-xl p-1">
        {[
          { id: 'list', label: 'Daftar', icon: FileText },
          { id: 'calendar', label: 'Kalender', icon: CalendarDays },
        ].map(tab => (
          <button key={tab.id} onClick={() => setViewMode(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              viewMode === tab.id ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-white font-semibold text-lg">{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-xs text-slate-500 font-medium py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: monthDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const count = calendarData[dateStr] || 0
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate

              return (
                <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected ? 'bg-cyan-500/20 border border-cyan-500/40' :
                    isToday ? 'bg-cyan-500/10 border border-cyan-500/20' :
                    'hover:bg-slate-800/50 border border-transparent'
                  }`}>
                  <span className={`text-sm font-medium ${isSelected ? 'text-cyan-400' : isToday ? 'text-cyan-400' : 'text-slate-300'}`}>{day}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-green-400 mt-0.5">{count} laporan</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected Date Entries */}
          {selectedDate && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-300">
                  Kegiatan — {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                {filteredEntries.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => {
                      const profile = getProfile()
                      exportToPDF(filteredEntries, profile)
                    }} className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 hover:bg-red-800/30 border border-slate-700 hover:border-red-500/30 rounded-lg text-[10px] text-slate-400 hover:text-red-400 transition-all">
                      <FileIcon className="w-3 h-3" /> PDF
                    </button>
                    <button onClick={() => {
                      const profile = getProfile()
                      exportToExcel(filteredEntries, profile)
                    }} className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 hover:bg-green-800/30 border border-slate-700 hover:border-green-500/30 rounded-lg text-[10px] text-slate-400 hover:text-green-400 transition-all">
                      <FileSpreadsheet className="w-3 h-3" /> XLSX
                    </button>
                  </div>
                )}
              </div>
              {filteredEntries.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Tidak ada kegiatan</p>
              ) : (
                <div className="space-y-2">
                  {filteredEntries.map(entry => (
                    <EntryCard key={entry.id} entry={entry} onDelete={setConfirmDelete} onPreview={setPreviewImage} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari uraian kegiatan, tempat, output..."
                className="w-full pl-10 pr-4 py-3 bg-cyber-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 transition-all outline-none text-sm" />
            </div>
            {allTempat.length > 0 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={filterTempat} onChange={e => setFilterTempat(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-cyber-900/60 border border-slate-800 rounded-xl text-slate-100 focus:border-cyan-500/50 transition-all outline-none text-sm appearance-none cursor-pointer min-w-[150px]">
                  <option value="">Semua Tempat</option>
                  {allTempat.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Entry Count & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">{filteredEntries.length} laporan ditemukan</p>
              {(selectedDate || searchQuery || filterTempat) && (
                <button onClick={() => { setSelectedDate(null); setSearchQuery(''); setFilterTempat('') }}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                  <X className="w-3 h-3" /> Hapus filter
                </button>
              )}
            </div>

            {filteredEntries.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Export:</span>
                <button onClick={() => {
                  const profile = getProfile()
                  exportToPDF(filteredEntries, profile)
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-red-800/30 border border-slate-700 hover:border-red-500/30 rounded-lg text-xs text-slate-300 hover:text-red-400 transition-all" title="Export PDF dengan foto bukti dukung">
                  <FileIcon className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => {
                  const profile = getProfile()
                  exportToExcel(filteredEntries, profile)
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-green-800/30 border border-slate-700 hover:border-green-500/30 rounded-lg text-xs text-slate-300 hover:text-green-400 transition-all" title="Export Excel">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => {
                  const profile = getProfile()
                  exportToCSV(filteredEntries, profile)
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-cyan-800/30 border border-slate-700 hover:border-cyan-500/30 rounded-lg text-xs text-slate-300 hover:text-cyan-400 transition-all" title="Export CSV">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            )}
          </div>

          {/* Entry List */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Belum ada laporan</p>
              </div>
            ) : (
              filteredEntries.map((entry, i) => (
                <div key={entry.id} className="bg-cyber-900/60 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/20 transition-all animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full">{entry.tanggal}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {entry.tempat}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium">{entry.uraianKegiatan}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {entry.penjab}</span>
                        {entry.dasarSurat && <span className="text-slate-600">Surat: {entry.dasarSurat}</span>}
                        <span className="flex items-center gap-1 text-green-400/80"><FolderOpen className="w-3 h-3" /> {entry.outputHasilKerja}</span>
                      </div>
                      {entry.buktiDukung && (
                        <button onClick={() => setPreviewImage(entry.buktiDukung)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-pink-400/70 hover:text-pink-400 transition-colors">
                          <Image className="w-3 h-3" /> Lihat bukti dukung
                        </button>
                      )}
                    </div>
                    <button onClick={() => setConfirmDelete(entry.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="bg-cyber-900 border border-slate-800 rounded-xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-2">Hapus Laporan?</h4>
            <p className="text-slate-400 text-sm mb-4">Data yang dihapus tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-all">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 px-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-slate-900 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-red-600/60 transition-all z-10">
              <X className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="Bukti dukung"
              className="max-w-full max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl object-contain bg-slate-900" />
          </div>
        </div>
      )}
    </div>
  )
}

function EntryCard({ entry, onDelete, onPreview }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 text-sm font-medium">{entry.uraianKegiatan}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{entry.tempat}</span>
            <span className="text-green-400/70">{entry.outputHasilKerja}</span>
          </div>
          {entry.buktiDukung && (
            <button onClick={() => onPreview(entry.buktiDukung)}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-pink-400/70 hover:text-pink-400 transition-colors">
              <Image className="w-3 h-3" /> Bukti dukung
            </button>
          )}
        </div>
        <button onClick={() => onDelete(entry.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-600 hover:text-red-400 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
