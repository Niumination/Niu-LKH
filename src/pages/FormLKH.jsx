import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Send,
  Save,
  RotateCcw,
  MapPin,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  FileSignature,
  FolderOpen,
  Image,
  X,
} from 'lucide-react'
import { getDraft, saveDraft, clearDraft, saveEntry, getProfile, saveProfile } from '../utils/storage'
import { isSeeded } from '../utils/seed'
import { saveEntry as saveToSupabase } from '../utils/supabaseService'
import { compressImage, estimateImageSize } from '../utils/image'
import { lkhFormSchema, validateProfile } from '../lib/validation'
import { todayLocalISO } from '../lib/date'
import Card from '../components/ui/Card'

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDYqsyF2a6MkK3ZvLO798dHxYhuxwp6PQEJXzOUXiry1jRxEcluKkW-ePafc4j1qy6/exec'

const DEFAULT_PROFILE = {
  nama: '',
  nip: '',
  gol: '',
  jabatan: '',
  unitKerja: '',
  periodeMulai: '',
  periodeSelesai: '',
}

const inputClass =
  'w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none'

export default function FormLKH() {
  const [profile, setProfileState] = useState(DEFAULT_PROFILE)
  const [activeTab, setActiveTab] = useState('form')
  const [submitStatus, setSubmitStatus] = useState(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const fileRef = useRef(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lkhFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      ...DEFAULT_PROFILE,
      tanggal: todayLocalISO(),
      jam: '',
      uraianKegiatan: '',
      tempat: '',
      penjab: '',
      dasarSurat: '',
      outputHasilKerja: '',
      buktiDukung: '',
    },
  })

  const draftTriggers = useWatch({ control, name: ['uraianKegiatan', 'tempat'] })
  const buktiDukung = useWatch({ control, name: 'buktiDukung' })

  useEffect(() => {
    const savedProfile = getProfile()
    let baseProfile = DEFAULT_PROFILE
    if (savedProfile.nama) {
      baseProfile = savedProfile
      setProfileState(savedProfile)
    } else {
      const seed = isSeeded()
      if (seed?.profile?.nama) {
        const p = {
          ...seed.profile,
          periodeMulai: '2026-01-01',
          periodeSelesai: '2026-06-30',
        }
        saveProfile(p)
        setProfileState(p)
        baseProfile = p
      }
    }
    const draft = getDraft()
    reset({
      ...baseProfile,
      tanggal: todayLocalISO(),
      jam: draft?.jam || '',
      uraianKegiatan: draft?.uraianKegiatan || '',
      tempat: draft?.tempat || '',
      penjab: draft?.penjab || '',
      dasarSurat: draft?.dasarSurat || '',
      outputHasilKerja: draft?.outputHasilKerja || '',
      buktiDukung: draft?.buktiDukung || '',
    })
    loadRecent()
  }, [reset])

  useEffect(() => {
    if (!draftTriggers?.[0] && !draftTriggers?.[1]) return
    const timer = setTimeout(() => {
      saveDraft(getValues())
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    }, 3000)
    return () => clearTimeout(timer)
  }, [draftTriggers, getValues])

  function loadRecent() {
    try {
      const raw = localStorage.getItem('niu_lkh_entries')
      setRecentSubmissions(raw ? JSON.parse(raw).slice(0, 3) : [])
    } catch {
      setRecentSubmissions([])
    }
  }

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('buktiDukung', { type: 'manual', message: 'Hanya file gambar yang diperbolehkan' })
        return
      }
      setIsCompressing(true)
      compressImage(file)
        .then((compressedDataUrl) => {
          setValue('buktiDukung', compressedDataUrl, { shouldValidate: true, shouldDirty: true })
          clearErrors('buktiDukung')
          console.log(`[Niu-LKH] Image compressed: ${estimateImageSize(compressedDataUrl)}KB`)
        })
        .catch((err) => setError('buktiDukung', { type: 'manual', message: err.message }))
        .finally(() => setIsCompressing(false))
    },
    [setError, setValue, clearErrors],
  )

  function removeBuktiDukung() {
    setValue('buktiDukung', '', { shouldValidate: true })
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFormSubmit(values) {
    setSubmitStatus(null)
    try {
      const { periodeMulai, periodeSelesai, ...restValues } = values
      const entry = {
        ...restValues,
        nama: profile.nama || values.nama,
        nip: profile.nip || values.nip,
        gol: profile.gol || '',
        jabatan: profile.jabatan || '',
        unitKerja: profile.unitKerja || '',
      }
      saveEntry(entry)
      clearDraft()

      const { buktiDukung, ...entryData } = entry
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entryData, nama: profile.nama || entry.nama, timestamp: new Date().toISOString() }),
      }).catch(() => console.warn('[Niu-LKH] Cloud sync skipped (offline or CORS)'))

      saveToSupabase(entry).catch(() => console.warn('[Niu-LKH] Supabase sync skipped'))

      setSubmitStatus('success')
      reset({
        nama: profile.nama || entry.nama,
        nip: profile.nip || '',
        gol: profile.gol || '',
        jabatan: profile.jabatan || '',
        unitKerja: profile.unitKerja || '',
        tanggal: values.tanggal,
        jam: '',
        uraianKegiatan: '',
        tempat: '',
        penjab: '',
        dasarSurat: '',
        outputHasilKerja: '',
        buktiDukung: '',
      })
      loadRecent()
      setTimeout(() => setSubmitStatus(null), 5000)
    } catch (error) {
      console.error('Error:', error)
      setSubmitStatus('error')
    }
  }

  function handleSaveProfile() {
    const values = getValues()
    const result = validateProfile(values)
    if (!result.success) {
      result.error.issues.forEach((issue) => setError(issue.path[0], { type: 'manual', message: issue.message }))
      return
    }
    saveProfile(result.data)
    setProfileState(result.data)
    setSubmitStatus('profile-saved')
    setTimeout(() => setSubmitStatus(null), 3000)
  }

  function applyDraft(entry) {
    setValue('uraianKegiatan', entry.uraianKegiatan || '')
    setValue('tempat', entry.tempat || '')
    setValue('penjab', entry.penjab || '')
    setValue('dasarSurat', '')
    setValue('outputHasilKerja', '')
    setValue('buktiDukung', '')
    setActiveTab('form')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex gap-1 bg-cyber-900/60 border border-slate-800 rounded-xl p-1" role="tablist" aria-label="Form dan profil">
        {[
          { id: 'form', label: 'Form Laporan', icon: FileText },
          { id: 'profile', label: 'Profil', icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <Card className="p-6 lg:p-8">
          <h3 className="text-white font-semibold text-lg mb-6">Profil Pengguna</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-slate-300 mb-1.5">Nama Lengkap <span className="text-red-400">*</span></label>
              <input id="nama" type="text" {...register('nama')} className={inputClass} placeholder="Masukkan nama lengkap" aria-invalid={!!errors.nama} />
              {errors.nama && <p className="text-red-400 text-xs mt-1" role="alert">{errors.nama.message}</p>}
            </div>
            <div>
              <label htmlFor="nip" className="block text-sm font-medium text-slate-300 mb-1.5">NIP <span className="text-red-400">*</span></label>
              <input id="nip" type="text" {...register('nip')} className={inputClass} placeholder="NIP" aria-invalid={!!errors.nip} />
              {errors.nip && <p className="text-red-400 text-xs mt-1" role="alert">{errors.nip.message}</p>}
            </div>
            <div>
              <label htmlFor="gol" className="block text-sm font-medium text-slate-300 mb-1.5">Pangkat/Golongan</label>
              <input id="gol" type="text" {...register('gol')} className={inputClass} placeholder="Contoh: PENATA MUDA, II/d" />
            </div>
            <div>
              <label htmlFor="jabatan" className="block text-sm font-medium text-slate-300 mb-1.5">Jabatan</label>
              <input id="jabatan" type="text" {...register('jabatan')} className={inputClass} placeholder="Jabatan" />
            </div>
            <div>
              <label htmlFor="unitKerja" className="block text-sm font-medium text-slate-300 mb-1.5">Unit Kerja</label>
              <input id="unitKerja" type="text" {...register('unitKerja')} className={inputClass} placeholder="Unit kerja" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="periodeMulai" className="block text-sm font-medium text-slate-300 mb-1.5">Periode Mulai</label>
                <input id="periodeMulai" type="date" {...register('periodeMulai')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="periodeSelesai" className="block text-sm font-medium text-slate-300 mb-1.5">Periode Selesai</label>
                <input id="periodeSelesai" type="date" {...register('periodeSelesai')} className={inputClass} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white transition-all"
          >
            <Save className="w-4 h-4" aria-hidden="true" /> Simpan Profil
          </button>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <Card className="p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-slate-300 mb-1.5">Nama Lengkap <span className="text-red-400">*</span></label>
                <input id="nama" type="text" {...register('nama')} className={inputClass} placeholder="Masukkan nama lengkap" aria-invalid={!!errors.nama} />
                {errors.nama && <p className="text-red-400 text-xs mt-1" role="alert">{errors.nama.message}</p>}
              </div>
              <div>
                <label htmlFor="nip" className="block text-sm font-medium text-slate-300 mb-1.5">NIP <span className="text-red-400">*</span></label>
                <input id="nip" type="text" {...register('nip')} className={inputClass} placeholder="NIP" aria-invalid={!!errors.nip} />
                {errors.nip && <p className="text-red-400 text-xs mt-1" role="alert">{errors.nip.message}</p>}
              </div>
              <div>
                <label htmlFor="tanggal" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> Tanggal <span className="text-red-400">*</span></label>
                <input id="tanggal" type="date" {...register('tanggal')} className={inputClass} aria-invalid={!!errors.tanggal} />
                {errors.tanggal && <p className="text-red-400 text-xs mt-1" role="alert">{errors.tanggal.message}</p>}
              </div>
              <div>
                <label htmlFor="jam" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> Jam</label>
                <input id="jam" type="time" {...register('jam')} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="uraianKegiatan" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><FileText className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> Uraian Kegiatan <span className="text-red-400">*</span></label>
                <textarea id="uraianKegiatan" {...register('uraianKegiatan')} rows={3} className={inputClass} placeholder="Jelaskan kegiatan yang dilakukan" aria-invalid={!!errors.uraianKegiatan} />
                {errors.uraianKegiatan && <p className="text-red-400 text-xs mt-1" role="alert">{errors.uraianKegiatan.message}</p>}
              </div>
              <div>
                <label htmlFor="tempat" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" /> Tempat <span className="text-red-400">*</span></label>
                <input id="tempat" type="text" {...register('tempat')} className={inputClass} placeholder="Contoh: Kantor, Dinas, Rumah" aria-invalid={!!errors.tempat} />
                {errors.tempat && <p className="text-red-400 text-xs mt-1" role="alert">{errors.tempat.message}</p>}
              </div>
              <div>
                <label htmlFor="penjab" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Penanggung Jawab <span className="text-red-400">*</span></label>
                <input id="penjab" type="text" {...register('penjab')} className={inputClass} placeholder="Contoh: Kepala Dinas Kominfo" aria-invalid={!!errors.penjab} />
                {errors.penjab && <p className="text-red-400 text-xs mt-1" role="alert">{errors.penjab.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="dasarSurat" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><FileSignature className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" /> Dasar Surat <span className="text-slate-500 text-xs">(opsional)</span></label>
                <input id="dasarSurat" type="text" {...register('dasarSurat')} className={inputClass} placeholder="Nomor surat/dasar pelaksanaan kegiatan (jika ada)" />
              </div>

              <div className="sm:col-span-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><Image className="w-3.5 h-3.5 text-pink-400" aria-hidden="true" /> Bukti Dukung <span className="text-slate-500 text-xs">(opsional, maks. 2MB)</span></span>
                {buktiDukung ? (
                  <div className="relative inline-block group">
                    <img src={buktiDukung} alt="Pratinjau bukti dukung yang diunggah" className="max-h-48 rounded-xl border border-slate-700 object-cover" />
                    <button type="button" onClick={removeBuktiDukung} aria-label="Hapus bukti dukung" className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-4 h-4 text-white" aria-hidden="true" />
                    </button>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-900/70 text-[10px] text-slate-400 rounded">{estimateImageSize(buktiDukung)}KB</span>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl transition-all ${isCompressing ? 'border-cyan-500/40 bg-cyan-500/5 cursor-wait' : 'border-slate-700 cursor-pointer hover:border-pink-500/40 hover:bg-pink-500/5'}`}>
                    {isCompressing ? (
                      <>
                        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" aria-hidden="true" />
                        <span className="text-sm text-cyan-400">Memproses gambar...</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-6 h-6 text-slate-500" aria-hidden="true" />
                        <span className="text-sm text-slate-400">Klik untuk upload foto bukti dukung</span>
                        <span className="text-xs text-slate-600">JPG, PNG, WEBP — dikompres otomatis</span>
                      </>
                    )}
                    <input ref={fileRef} id="buktiDukungInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isCompressing} />
                  </label>
                )}
                {errors.buktiDukung && <p className="text-red-400 text-xs mt-1" role="alert">{errors.buktiDukung.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="outputHasilKerja" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5"><FolderOpen className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> Output / Hasil Kerja <span className="text-red-400">*</span></label>
                <input id="outputHasilKerja" type="text" {...register('outputHasilKerja')} className={inputClass} placeholder="Contoh: Domain baru aktif, Laporan bulanan, Dokumen terverifikasi" aria-invalid={!!errors.outputHasilKerja} />
                {errors.outputHasilKerja && <p className="text-red-400 text-xs mt-1" role="alert">{errors.outputHasilKerja.message}</p>}
              </div>
            </div>

            {draftSaved && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 animate-fade-in" role="status">
                <Save className="w-3 h-3" aria-hidden="true" /> Draft tersimpan otomatis
              </div>
            )}
          </Card>

          <div className="mt-6 space-y-3">
            <button type="submit" disabled={isSubmitting} className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" aria-hidden="true" />
              <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Mengirim Data...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" aria-hidden="true" /> Kirim Laporan
                  </>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                clearDraft()
                reset({
                  nama: profile.nama || '',
                  nip: profile.nip || '',
                  gol: profile.gol || '',
                  jabatan: profile.jabatan || '',
                  unitKerja: profile.unitKerja || '',
                  periodeMulai: profile.periodeMulai || '',
                  periodeSelesai: profile.periodeSelesai || '',
                  tanggal: todayLocalISO(),
                  jam: '',
                  uraianKegiatan: '',
                  tempat: '',
                  penjab: '',
                  dasarSurat: '',
                  outputHasilKerja: '',
                  buktiDukung: '',
                })
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset Form
            </button>
          </div>

          <div aria-live="polite">
            {submitStatus === 'success' && (
              <div className="relative mt-4 animate-slide-up">
                <div className="absolute -inset-0.5 bg-green-500/20 rounded-xl blur" aria-hidden="true" />
                <div className="relative bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-green-400 font-medium">Laporan berhasil dikirim! <span className="text-green-400/70 text-sm ml-1">Data tersimpan di sistem & lokal.</span></span>
                </div>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="mt-4 animate-slide-up">
                <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-red-400 font-medium">Gagal mengirim. Periksa koneksi dan coba lagi.</span>
                </div>
              </div>
            )}
            {submitStatus === 'profile-saved' && (
              <div className="mt-4 animate-fade-in">
                <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-cyan-400 font-medium">Profil berhasil disimpan!</span>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {recentSubmissions.length > 0 && activeTab === 'form' && (
        <Card className="p-5">
          <h4 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> Laporan Terakhir
          </h4>
          <div className="space-y-2">
            {recentSubmissions.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => applyDraft(entry)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 transition-all group text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{entry.uraianKegiatan}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.tanggal} · {entry.tempat} · {entry.outputHasilKerja}</p>
                </div>
                <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Gunakan</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
