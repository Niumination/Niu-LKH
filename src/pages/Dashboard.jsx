import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ClipboardList, TrendingUp, MapPin, Sparkles, ArrowRight, CalendarDays } from 'lucide-react'
import { getStats, getEntriesByDate } from '../utils/storage'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [todayEntries, setTodayEntries] = useState([])
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    setStats(getStats())
    const today = new Date().toISOString().split('T')[0]
    setTodayEntries(getEntriesByDate(today))

    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 18) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  if (!stats) return null

  const statCards = [
    { label: 'Total Laporan', value: stats.total, icon: ClipboardList, color: 'from-cyan-500 to-blue-500' },
    { label: 'Jam Tercatat', value: Math.round(stats.totalHours / 60), suffix: 'jam', icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Minggu Ini', value: stats.weekEntries, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Lokasi Aktif', value: Object.keys(stats.locations).length, icon: MapPin, color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyber-800 to-cyber-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{greeting}, Afrizal</h1>
            <p className="text-slate-400 mt-1">
              {currentTime} &middot; {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => navigate('/form')}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/10"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Lapor Kegiatan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-cyber-900/60 border border-slate-800 rounded-xl p-4 lg:p-5 hover:border-cyan-500/30 transition-all">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white">{card.value}{card.suffix ? <span className="text-sm text-slate-400 font-normal"> {card.suffix}</span> : ''}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Entries */}
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              Kegiatan Hari Ini
            </h3>
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">{todayEntries.length} entry</span>
          </div>
          {todayEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm">Belum ada kegiatan hari ini</p>
              <button onClick={() => navigate('/form')} className="mt-3 text-cyan-400 text-sm hover:underline">Buat laporan sekarang</button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEntries.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-medium text-sm truncate">{entry.kegiatan}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{entry.jamMulai} - {entry.jamSelesai}</span>
                        <span>{entry.lokasi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {todayEntries.length > 5 && (
                <button onClick={() => navigate('/history')} className="w-full text-center text-xs text-cyan-400 py-2 hover:underline">
                  +{todayEntries.length - 5} kegiatan lainnya
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            {[
              { label: 'Buat Laporan Baru', desc: 'Catat kegiatan harian Anda', to: '/form', color: 'cyan' },
              { label: 'Lihat Riwayat', desc: 'Cek laporan sebelumnya', to: '/history', color: 'purple' },
              { label: 'Statistik Mingguan', desc: 'Rekap jam & aktivitas', to: '/stats', color: 'green' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/20 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
