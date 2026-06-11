import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Save, RotateCcw, Clock, MapPin, FileText, Calendar, User, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react'
import { getDraft, saveDraft, clearDraft, saveEntry, getProfile, saveProfile } from '../utils/storage'

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDYqsyF2a6MkK3ZvLO798dHxYhuxwp6PQEJXzOUXiry1jRxEcluKkW-ePafc4j1qy6/exec'

const LOKASI_OPTIONS = ['Kantor', 'Lapangan', 'Work From Home', 'Dinas Luar', 'Rapat Online', 'Lainnya']

export default function FormLKH() {
  const navigate = useNavigate()
  const [profile, setProfileState] = useState({ nama: '', nip: '', unit: '' })
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    unit: '',
    tanggal: new Date().toISOString().split('T')[0],
    jamMulai: '',
    jamSelesai: '',
    lokasi: '',
    kegiatan: '',
    keterangan: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('form')
  const [focusedField, setFocusedField] = useState(null)
  const [showLokasiPicker, setShowLokasiPicker] = useState(false)
  const [errors, setErrors] = useState({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])

  // Load profile & draft on mount
  useEffect(() => {
    const savedProfile = getProfile()
    if (savedProfile.nama) {
      setProfileState(savedProfile)
      setFormData(prev => ({
        ...prev,
        nama: savedProfile.nama,
        nip: savedProfile.nip,
        unit: savedProfile.unit,
      }))
    }
    const draft = getDraft()
    if (draft && draft.tanggal) {
      setFormData(prev => ({ ...prev, ...draft }))
    }
    // Set default times
    const now = new Date()
    const defaultMulai = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setFormData(prev => ({
      ...prev,
      jamMulai: prev.jamMulai || defaultMulai,
      jamSelesai: prev.jamSelesai || '',
    }))

    loadRecent()
  }, [])

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.kegiatan || formData.lokasi) {
        saveDraft(formData)
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [formData])

  function loadRecent() {
    try {
      const raw = localStorage.getItem('niu_lkh_entries')
      if (raw) {
        const entries = JSON.parse(raw)
        setRecentSubmissions(entries.slice(0, 3))
      }
    } catch {}
  }

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: null }))
  }, [])

  function validate() {
    const errs = {}
    if (!formData.nama.trim()) errs.nama = 'Nama wajib diisi'
    if (!formData.tanggal) errs.tanggal = 'Tanggal wajib diisi'
    if (!formData.jamMulai) errs.jamMulai = 'Jam mulai wajib diisi'
    if (!formData.jamSelesai) errs.jamSelesai = 'Jam selesai wajib diisi'
    if (!formData.lokasi) errs.lokasi = 'Lokasi wajib diisi'
    if (!formData.kegiatan.trim()) errs.kegiatan = 'Deskripsi kegiatan wajib diisi'

    // Validate time range
    if (formData.jamMulai && formData.jamSelesai) {
      const [a, b] = [formData.jamMulai, formData.jamSelesai]
      if (a >= b) errs.jamSelesai = 'Jam selesai harus setelah jam mulai'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nama: profile.nama || formData.nama,
          timestamp: new Date().toISOString()
        })
      })

      // Save locally
      saveEntry({ ...formData, nama: profile.nama || formData.nama })

      setSubmitStatus('success')
      clearDraft()

      // Reset form (keep profile & tanggal)
      setFormData(prev => ({
        nama: profile.nama || formData.nama,
        nip: profile.nip || '',
        unit: profile.unit || '',
        tanggal: prev.tanggal,
        jamMulai: '',
        jamSelesai: '',
        lokasi: '',
        kegiatan: '',
        keterangan: ''
      }))

      loadRecent()

      setTimeout(() => setSubmitStatus(null), 5000)
    } catch (error) {
      console.error('Error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function saveProfileData() {
    const p = { nama: formData.nama, nip: formData.nip, unit: formData.unit }
    saveProfile(p)
    setProfileState(p)
    setSubmitStatus('profile-saved')
    setTimeout(() => setSubmitStatus(null), 3000)
  }

  function applyDraft(entry) {
    setFormData(prev => ({
      ...prev,
      kegiatan: entry.kegiatan,
      lokasi: entry.lokasi,
      keterangan: '',
    }))
    setActiveTab('form')
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Tab: Form / Profil */}
      <div className="flex gap-1 bg-cyber-900/60 border border-slate-800 rounded-xl p-1">
        {[
          { id: 'form', label: 'Form Laporan', icon: FileText },
          { id: 'profile', label: 'Profil', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        /* Profile Settings */
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8">
          <h3 className="text-white font-semibold text-lg mb-6">Profil Pengguna</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Masukkan nama lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">NIP</label>
              <input type="text" name="nip" value={formData.nip} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Nomor induk pegawai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit/Bagian</label>
              <input type="text" name="unit" value={formData.unit} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Contoh: Diskominfo, Sekretariat" />
            </div>
            <button onClick={saveProfileData}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-500 transition-all">
              <Save className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </div>
      ) : (
        /* Main Form */
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-cyber-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 lg:p-8">
              <div className="space-y-5">
                {/* Auto-filled Name */}
                {profile.nama && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-xs text-cyan-400">
                    <User className="w-3 h-3" />
                    <span>Melapor sebagai: <strong>{profile.nama}</strong></span>
                    {profile.unit && <span className="text-slate-500">| {profile.unit}</span>}
                  </div>
                )}

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Tanggal <span className="text-red-400">*</span>
                    </label>
                    <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange}
                      max={todayStr}
                      onFocus={() => setFocusedField('tanggal')} onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
                    {errors.tanggal && <p className="text-red-400 text-xs mt-1">{errors.tanggal}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Jam Mulai <span className="text-red-400">*</span>
                    </label>
                    <input type="time" name="jamMulai" value={formData.jamMulai} onChange={handleChange}
                      onFocus={() => setFocusedField('jamMulai')} onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
                    {errors.jamMulai && <p className="text-red-400 text-xs mt-1">{errors.jamMulai}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Jam Selesai <span className="text-red-400">*</span>
                    </label>
                    <input type="time" name="jamSelesai" value={formData.jamSelesai} onChange={handleChange}
                      onFocus={() => setFocusedField('jamSelesai')} onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
                    {errors.jamSelesai && <p className="text-red-400 text-xs mt-1">{errors.jamSelesai}</p>}
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Lokasi <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type="text" name="lokasi" value={formData.lokasi} onChange={handleChange}
                      onFocus={() => { setFocusedField('lokasi'); setShowLokasiPicker(true); }}
                      onBlur={() => setTimeout(() => setShowLokasiPicker(false), 200)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                      placeholder="Pilih atau ketik lokasi" autoComplete="off" />
                    {showLokasiPicker && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-cyber-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                        {LOKASI_OPTIONS.map(loc => (
                          <button key={loc} type="button" onMouseDown={() => { setFormData(prev => ({ ...prev, lokasi: loc })); setShowLokasiPicker(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${formData.lokasi === loc ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300 hover:bg-slate-700/50'}`}>
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.lokasi && <p className="text-red-400 text-xs mt-1">{errors.lokasi}</p>}
                </div>

                {/* Kegiatan */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Deskripsi Kegiatan <span className="text-red-400">*</span>
                  </label>
                  <textarea name="kegiatan" value={formData.kegiatan} onChange={handleChange}
                    onFocus={() => setFocusedField('kegiatan')} onBlur={() => setFocusedField(null)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none resize-none"
                    placeholder="Jelaskan kegiatan yang dilakukan secara detail..." />
                  {errors.kegiatan && <p className="text-red-400 text-xs mt-1">{errors.kegiatan}</p>}
                </div>

                {/* Keterangan */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    Keterangan Tambahan <span className="text-slate-500 text-xs">(opsional)</span>
                  </label>
                  <textarea name="keterangan" value={formData.keterangan} onChange={handleChange}
                    onFocus={() => setFocusedField('keterangan')} onBlur={() => setFocusedField(null)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none resize-none"
                    placeholder="Catatan tambahan (opsional)" />
                </div>

                {/* Draft Indicator */}
                {draftSaved && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 animate-fade-in">
                    <Save className="w-3 h-3" />
                    Draft tersimpan otomatis
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Area */}
          <div className="mt-6 space-y-3">
            <button type="submit" disabled={isSubmitting}
              className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
              <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim Data...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kirim Laporan
                  </>
                )}
              </div>
            </button>

            {/* Reset */}
            <button type="button" onClick={() => { clearDraft(); setFormData({
              nama: profile.nama || '', nip: profile.nip || '', unit: profile.unit || '',
              tanggal: todayStr, jamMulai: '', jamSelesai: '', lokasi: '', kegiatan: '', keterangan: ''
            }) }} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="relative mt-4 animate-slide-up">
              <div className="absolute -inset-0.5 bg-green-500/20 rounded-xl blur" />
              <div className="relative bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <span className="text-green-400 font-medium">Laporan berhasil dikirim!</span>
                  <span className="text-green-400/70 text-sm ml-2">Data tersimpan di sistem & lokal.</span>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mt-4 animate-slide-up">
              <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 font-medium">Gagal mengirim. Periksa koneksi dan coba lagi.</span>
              </div>
            </div>
          )}

          {submitStatus === 'profile-saved' && (
            <div className="mt-4 animate-fade-in">
              <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span className="text-cyan-400 font-medium">Profil berhasil disimpan!</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && activeTab === 'form' && (
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-5">
          <h4 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Laporan Terakhir
          </h4>
          <div className="space-y-2">
            {recentSubmissions.map((entry, i) => (
              <button key={entry.id} type="button" onClick={() => applyDraft(entry)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 transition-all group text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{entry.kegiatan}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.tanggal} &middot; {entry.jamMulai}-{entry.jamSelesai} &middot; {entry.lokasi}</p>
                </div>
                <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Gunakan</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
