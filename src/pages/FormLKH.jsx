import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Save, RotateCcw, MapPin, FileText, Calendar, User, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Briefcase, FileSignature, FolderOpen, Image, X } from 'lucide-react'
import { getDraft, saveDraft, clearDraft, saveEntry, getProfile, saveProfile } from '../utils/storage'
import { compressImage, estimateImageSize } from '../utils/image'

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDYqsyF2a6MkK3ZvLO798dHxYhuxwp6PQEJXzOUXiry1jRxEcluKkW-ePafc4j1qy6/exec'

export default function FormLKH() {
  const navigate = useNavigate()
  const [profile, setProfileState] = useState({ nama: '', nip: '', gol: '', jabatan: '', unitKerja: '', periodeMulai: '', periodeSelesai: '' })
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    gol: '',
    jabatan: '',
    unitKerja: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam: '',
    uraianKegiatan: '',
    tempat: '',
    penjab: '',
    dasarSurat: '',
    outputHasilKerja: '',
    buktiDukung: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('form')
  const [focusedField, setFocusedField] = useState(null)
  const [errors, setErrors] = useState({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
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
        gol: savedProfile.gol,
        jabatan: savedProfile.jabatan,
        unitKerja: savedProfile.unitKerja,
      }))
    }
    const draft = getDraft()
    if (draft && draft.tanggal) {
      setFormData(prev => ({ ...prev, ...draft }))
    }

    loadRecent()
  }, [])

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.uraianKegiatan || formData.tempat) {
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

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, buktiDukung: 'Hanya file gambar yang diperbolehkan' }))
      return
    }

    // Compress image before storing
    setIsCompressing(true)
    compressImage(file)
      .then(compressedDataUrl => {
        setFormData(prev => ({ ...prev, buktiDukung: compressedDataUrl }))
        setErrors(prev => ({ ...prev, buktiDukung: null }))
        const sizeKB = estimateImageSize(compressedDataUrl)
        console.log(`[Niu-LKH] Image compressed: ${sizeKB}KB`)
      })
      .catch(err => {
        setErrors(prev => ({ ...prev, buktiDukung: err.message }))
      })
      .finally(() => {
        setIsCompressing(false)
      })
  }

  function removeBuktiDukung() {
    setFormData(prev => ({ ...prev, buktiDukung: '' }))
    // Reset file input
    const fileInput = document.getElementById('buktiDukungInput')
    if (fileInput) fileInput.value = ''
  }

  function validate() {
    const errs = {}
    if (!formData.nama.trim()) errs.nama = 'Nama wajib diisi'
    if (!formData.tanggal) errs.tanggal = 'Tanggal wajib diisi'
    if (!formData.uraianKegiatan.trim()) errs.uraianKegiatan = 'Uraian kegiatan wajib diisi'
    if (!formData.tempat.trim()) errs.tempat = 'Tempat wajib diisi'
    if (!formData.penjab.trim()) errs.penjab = 'Penanggung jawab wajib diisi'
    if (!formData.outputHasilKerja.trim()) errs.outputHasilKerja = 'Output/hasil kerja wajib diisi'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Save locally (exclude buktiDukung from cloud sync)
      const { buktiDukung, ...entryData } = formData
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryData,
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
        gol: profile.gol || '',
        jabatan: profile.jabatan || '',
        unitKerja: profile.unitKerja || '',
        tanggal: prev.tanggal,
        jam: '',
        uraianKegiatan: '',
        tempat: '',
        penjab: '',
        dasarSurat: '',
        outputHasilKerja: '',
        buktiDukung: ''
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
    const p = {
      nama: formData.nama,
      nip: formData.nip,
      gol: formData.gol,
      jabatan: formData.jabatan,
      unitKerja: formData.unitKerja,
      periodeMulai: formData.periodeMulai,
      periodeSelesai: formData.periodeSelesai
    }
    saveProfile(p)
    setProfileState(p)
    setSubmitStatus('profile-saved')
    setTimeout(() => setSubmitStatus(null), 3000)
  }

  function applyDraft(entry) {
    setFormData(prev => ({
      ...prev,
      uraianKegiatan: entry.uraianKegiatan,
      tempat: entry.tempat,
      penjab: entry.penjab,
      dasarSurat: '',
      outputHasilKerja: '',
      buktiDukung: '',
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
        /* Profile Settings — Format Excel: Nama, Jabatan, Unit Kerja, Periode */
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8">
          <h3 className="text-white font-semibold text-lg mb-6">Profil Pengguna</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Masukkan nama lengkap" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">NIP</label>
                <input type="text" name="nip" value={formData.nip} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="19860727 202203 1 003" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Pangkat/Golongan</label>
                <input type="text" name="gol" value={formData.gol} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="Contoh: PENATA MUDA, II/d" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Jabatan</label>
              <input type="text" name="jabatan" value={formData.jabatan} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Contoh: Pranata Komputer Terampil" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit Kerja</label>
              <input type="text" name="unitKerja" value={formData.unitKerja} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                placeholder="Contoh: Bidang Layanan E-Government, Diskominfo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Periode Mulai</label>
                <input type="date" name="periodeMulai" value={formData.periodeMulai} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Periode Selesai</label>
                <input type="date" name="periodeSelesai" value={formData.periodeSelesai} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
              </div>
            </div>
            <button onClick={saveProfileData}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-500 transition-all">
              <Save className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </div>
      ) : (
        /* Main Form — Struktur Excel: Tanggal, Uraian Kegiatan, Tempat, Penjab, Dasar Surat, Output/Hasil Kerja */
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-cyber-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 lg:p-8">
              <div className="space-y-5">
                {/* Auto-filled Profile Info */}
                {profile.nama && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-xs text-cyan-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> <strong>{profile.nama}</strong></span>
                    {profile.jabatan && <span className="text-slate-500">| {profile.jabatan}</span>}
                    {profile.unitKerja && <span className="text-slate-500">| {profile.unitKerja}</span>}
                  </div>
                )}

                {/* Tanggal */}
                <div className="max-w-xs">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Tanggal <span className="text-red-400">*</span>
                  </label>
                  <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange}
                    max={todayStr}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
                  {errors.tanggal && <p className="text-red-400 text-xs mt-1">{errors.tanggal}</p>}
                </div>

                {/* Jam */}
                <div className="max-w-[180px]">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Jam <span className="text-slate-500 text-xs">(opsional)</span>
                  </label>
                  <input type="time" name="jam" value={formData.jam} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none" />
                </div>

                {/* Uraian Kegiatan */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Uraian Kegiatan <span className="text-red-400">*</span>
                  </label>
                  <textarea name="uraianKegiatan" value={formData.uraianKegiatan} onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none resize-none"
                    placeholder="Jelaskan kegiatan yang dilakukan secara detail..." />
                  {errors.uraianKegiatan && <p className="text-red-400 text-xs mt-1">{errors.uraianKegiatan}</p>}
                </div>

                {/* Tempat */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> Tempat <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="tempat" value={formData.tempat} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    placeholder="Contoh: Diskominfo, Lapangan Setdakab, WFH" />
                  {errors.tempat && <p className="text-red-400 text-xs mt-1">{errors.tempat}</p>}
                </div>

                {/* Penjab */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Penanggung Jawab (Penjab) <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="penjab" value={formData.penjab} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    placeholder="Contoh: Kepala Dinas Kominfo" />
                  {errors.penjab && <p className="text-red-400 text-xs mt-1">{errors.penjab}</p>}
                </div>

                {/* Dasar Surat */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-slate-400" /> Dasar Surat <span className="text-slate-500 text-xs">(opsional)</span>
                  </label>
                  <input type="text" name="dasarSurat" value={formData.dasarSurat} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    placeholder="Nomor surat/dasar pelaksanaan kegiatan (jika ada)" />
                </div>

                {/* Bukti Dukung (Foto) */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <Image className="w-3.5 h-3.5 text-pink-400" /> Bukti Dukung <span className="text-slate-500 text-xs">(opsional, maks. 2MB)</span>
                  </label>
                  {formData.buktiDukung ? (
                    <div className="relative inline-block group">
                      <img src={formData.buktiDukung} alt="Preview bukti dukung"
                        className="max-h-48 rounded-xl border border-slate-700 object-cover" />
                      <button type="button" onClick={removeBuktiDukung}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-900/70 text-[10px] text-slate-400 rounded">
                        {estimateImageSize(formData.buktiDukung)}KB
                      </span>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl transition-all ${
                      isCompressing
                        ? 'border-cyan-500/40 bg-cyan-500/5 cursor-wait'
                        : 'border-slate-700 cursor-pointer hover:border-pink-500/40 hover:bg-pink-500/5'
                    }`}>
                      {isCompressing ? (
                        <>
                          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                          <span className="text-sm text-cyan-400">Memproses gambar...</span>
                        </>
                      ) : (
                        <>
                          <Image className="w-6 h-6 text-slate-500" />
                          <span className="text-sm text-slate-400">Klik untuk upload foto bukti dukung</span>
                          <span className="text-xs text-slate-600">JPG, PNG, WEBP — dikompres otomatis</span>
                        </>
                      )}
                      <input id="buktiDukungInput" type="file" accept="image/*" onChange={handleFileChange}
                        className="hidden" disabled={isCompressing} />
                    </label>
                  )}
                  {errors.buktiDukung && <p className="text-red-400 text-xs mt-1">{errors.buktiDukung}</p>}
                </div>

                {/* Output / Hasil Kerja */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-green-400" /> Output / Hasil Kerja <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="outputHasilKerja" value={formData.outputHasilKerja} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    placeholder="Contoh: Domain baru aktif, Laporan bulanan, Dokumen terverifikasi" />
                  {errors.outputHasilKerja && <p className="text-red-400 text-xs mt-1">{errors.outputHasilKerja}</p>}
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
              nama: profile.nama || '', nip: profile.nip || '', gol: profile.gol || '', jabatan: profile.jabatan || '', unitKerja: profile.unitKerja || '',
              tanggal: todayStr, jam: '', uraianKegiatan: '', tempat: '', penjab: '',
              dasarSurat: '', outputHasilKerja: '', buktiDukung: ''
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
                  <p className="text-sm text-slate-200 truncate">{entry.uraianKegiatan}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.tanggal} &middot; {entry.tempat} &middot; {entry.outputHasilKerja}</p>
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
