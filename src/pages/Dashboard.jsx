import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getEntries, getStats } from '../utils/storage'
import { seedFromJSON, isSeeded, getMonthlyProgress, seedToSupabase } from '../utils/seed'
import { checkConnection, getLastSyncTime } from '../utils/supabaseService'
import {
  LayoutDashboard, ClipboardList, History, BarChart3,
  CalendarDays, MapPin, CheckCircle2, Download, FileSpreadsheet,
  TrendingUp, Loader2, AlertCircle, Sparkles, Cloud, CloudOff, RefreshCw
} from 'lucide-react'

const MONTH_NAMES = {
  '2026-01': 'Januari', '2026-02': 'Februari', '2026-03': 'Maret',
  '2026-04': 'April', '2026-05': 'Mei', '2026-06': 'Juni',
}

function formatTimeAgo(date) {
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState(null)
  const [seedInfo, setSeedInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [cloudStatus, setCloudStatus] = useState(null) // null | {ok,count,error} | 'syncing'
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    loadData()
    checkCloud()
  }, [])

  function loadData() {
    const e = getEntries()
    setEntries(e)
    setStats(getStats())
    setSeedInfo(isSeeded())
    setLastSync(getLastSyncTime())
  }

  async function checkCloud() {
    const result = await checkConnection()
    setCloudStatus(result)
  }

  async function handleSyncToCloud() {
    setCloudStatus('syncing')
    try {
      const result = await seedToSupabase()
      setCloudStatus({ ok: true, count: result.synced })
      setLastSync(getLastSyncTime())
    } catch (err) {
      setCloudStatus({ ok: false, error: err.message })
    }
  }

  async function handleSeed() {
    setIsLoading(true)
    try {
      const result = await seedFromJSON()
      if (result.error) {
        alert('Gagal memuat data LKH: ' + result.error)
      } else {
        setShowSeedConfirm(false)
        loadData()
        // Auto-sync to Supabase after seeding
        seedToSupabase().then(syncResult => {
          setCloudStatus(syncResult.error ? { ok: false, error: syncResult.error } : { ok: true, count: syncResult.synced })
          setLastSync(getLastSyncTime())
        }).catch(() => {})
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setIsLoading(false)
  }

  const monthlyProgress = useMemo(() => {
    if (entries.length === 0) return []
    return getMonthlyProgress(entries)
  }, [entries])

  const totalWorkdays = monthlyProgress.reduce((s, m) => s + m.workdays, 0)
  const totalHolidays = monthlyProgress.reduce((s, m) => s + m.holidays, 0)
  const totalLocations = new Set(entries.map(e => e.tempat)).size

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyber-800 via-cyber-900 to-cyber-950 border border-slate-800 rounded-2xl p-6 lg:p-8">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Niu-LKH v3.1.1</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Laporan Kegiatan Harian</h1>
          <p className="text-slate-400 mt-1">{entries.length > 0 ? `${entries.length} kegiatan tercatat` : 'Belum ada data'}</p>

          {entries.length > 0 && seedInfo && (
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {seedInfo.profile?.nama || 'Tersimpan'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
                <CalendarDays className="w-3.5 h-3.5" />
                Januari — Juni 2026
              </span>
              {/* Cloud Sync Status */}
              {cloudStatus === 'syncing' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sinkronisasi...
                </span>
              ) : cloudStatus?.ok ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400">
                  <Cloud className="w-3 h-3" />
                  Tersimpan di cloud {lastSync ? `(${formatTimeAgo(lastSync)})` : ''}
                </span>
              ) : cloudStatus && !cloudStatus.ok ? (
                <button onClick={handleSyncToCloud}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer">
                  <CloudOff className="w-3 h-3" />
                  Sync ke Cloud
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox icon={BarChart3} value={totalWorkdays} label="Hari Kerja" color="from-cyan-500 to-blue-500" />
          <StatBox icon={CalendarDays} value={totalHolidays} label="Libur/Cuti" color="from-amber-500 to-orange-500" />
          <StatBox icon={MapPin} value={totalLocations} label="Lokasi" color="from-green-500 to-emerald-500" />
          <StatBox icon={TrendingUp} value={`${monthlyProgress.length}`} suffix="bulan" label="Periode Aktif" color="from-purple-500 to-pink-500" />
        </div>
      ) : (
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Belum Ada Data LKH</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Kamu bisa langsung isi manual lewat form, upload file Excel untuk preview,
            atau muat data LKH yang sudah disiapkan (Januari — Juni 2026).
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/form"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition-all">
              <ClipboardList className="w-4 h-4" /> Isi LKH Baru
            </Link>
            <button onClick={() => setShowSeedConfirm(true)} disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:border-cyan-500/30 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Muat Data LKH
            </button>
            <Link to="/excel-preview"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:border-cyan-500/30 transition-all">
              <FileSpreadsheet className="w-4 h-4" /> Preview Excel
            </Link>
          </div>
        </div>
      )}

      {/* Seed Confirm Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSeedConfirm(false)}>
          <div className="bg-cyber-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Muat Data LKH?</h3>
                <p className="text-slate-400 text-sm">Data sample Januari — Juni 2026</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Akan memuat <strong className="text-cyan-400">181 entri</strong> LKH untuk Afrizal Munthe
              (Januari — Juni 2026). Entri yang sudah ada sebelumnya tidak akan ditimpa.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSeedConfirm(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-600 transition-all">
                Batal
              </button>
              <button onClick={handleSeed} disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-500 transition-all disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Muat Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Progress */}
      {monthlyProgress.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              Progress Bulanan
            </h2>
            <Link to="/stats"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              Detail Statistik <TrendingUp className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {monthlyProgress.map(m => (
              <div key={m.month} className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/20 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{MONTH_NAMES[m.month] || m.month}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    m.completion >= 70 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    m.completion >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {m.completion}% Aktif
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Hari Kerja</span>
                    <span className="text-cyan-400 font-medium">{m.workdays} hari</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((m.workdays / m.total) * 100, 5)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Libur/Cuti</span>
                    <span className="text-amber-400 font-medium">{m.holidays} hari</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((m.holidays / m.total) * 100, 5)}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {m.locations} lokasi
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {m.total} hari
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionCard to="/form" icon={ClipboardList} label="Form LKH" sub="Catat kegiatan baru" color="cyan" />
            <ActionCard to="/history" icon={History} label="Riwayat" sub={`Lihat ${entries.length} entri`} color="purple" />
            <ActionCard to="/stats" icon={BarChart3} label="Statistik" sub="Analisis & grafik" color="green" />
            <ActionCard to="/excel-preview" icon={FileSpreadsheet} label="Excel Preview" sub="Upload & lihat file" color="amber" />
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ icon: Icon, value, suffix, label, color }) {
  return (
    <div className="bg-cyber-900/60 border border-slate-800 rounded-xl p-4 lg:p-5 hover:border-cyan-500/30 transition-all">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-white transition-all">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix ? <span className="text-sm text-slate-400 font-normal ml-1">{suffix}</span> : ''}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function ActionCard({ to, icon: Icon, label, sub, color }) {
  const colors = {
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-600/20 hover:border-cyan-500/30 icon-cyan',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-600/20 hover:border-purple-500/30',
    green: 'from-green-600/20 to-green-600/5 border-green-600/20 hover:border-green-500/30',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-600/20 hover:border-amber-500/30',
  }
  const c = colors[color] || colors.cyan

  return (
    <Link to={to}
      className={`bg-gradient-to-br ${c} rounded-xl p-4 transition-all group`}>
      <Icon className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
      <p className="text-white font-medium text-sm">{label}</p>
      <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
    </Link>
  )
}
