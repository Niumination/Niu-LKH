import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Clock, CalendarDays, MapPin, TrendingUp, Award, Sparkles } from 'lucide-react'
import { getEntries } from '../utils/storage'

export default function Stats() {
  const [entries, setEntries] = useState([])
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => { setEntries(getEntries()) }, [])

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    
    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)
    const monthAgoStr = monthAgo.toISOString().split('T')[0]
    
    let filtered = entries
    if (timeRange === 'week') filtered = entries.filter(e => e.tanggal >= weekAgoStr)
    else if (timeRange === 'month') filtered = entries.filter(e => e.tanggal >= monthAgoStr)
    
    // Total hours
    const totalMinutes = filtered.reduce((acc, e) => {
      if (e.jamMulai && e.jamSelesai) {
        const [a, b] = [e.jamMulai, e.jamSelesai]
        const diff = (parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1])) - (parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]))
        return acc + Math.max(0, diff)
      }
      return acc
    }, 0)
    
    // Daily breakdown
    const daily = {}
    filtered.forEach(e => {
      daily[e.tanggal] = daily[e.tanggal] || { count: 0, minutes: 0 }
      daily[e.tanggal].count++
      if (e.jamMulai && e.jamSelesai) {
        const [a, b] = [e.jamMulai, e.jamSelesai]
        const diff = (parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1])) - (parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]))
        daily[e.tanggal].minutes += Math.max(0, diff)
      }
    })
    
    // Location breakdown
    const locations = {}
    filtered.forEach(e => { locations[e.lokasi] = (locations[e.lokasi] || 0) + 1 })
    const locationData = Object.entries(locations).sort((a, b) => b[1] - a[1])
    
    // Top activities
    const activityWords = {}
    filtered.forEach(e => {
      const words = e.kegiatan.toLowerCase().split(/\s+/).slice(0, 5)
      words.forEach(w => {
        if (w.length > 3 && !['dan', 'yang', 'dari', 'dengan', 'untuk', 'telah', 'akan', 'dapat'].includes(w)) {
          activityWords[w] = (activityWords[w] || 0) + 1
        }
      })
    })
    const topWords = Object.entries(activityWords).sort((a, b) => b[1] - a[1]).slice(0, 8)
    
    // Busiest day
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    filtered.forEach(e => {
      const d = new Date(e.tanggal + 'T00:00:00').getDay()
      dayCount[d] = (dayCount[d] || 0) + 1
    })
    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
    
    // Daily sorted for chart
    const dailySorted = Object.entries(daily).sort()
    const maxCount = Math.max(...dailySorted.map(([_, d]) => d.count), 1)
    const maxMinutes = Math.max(...dailySorted.map(([_, d]) => d.minutes), 1)
    
    return {
      total: filtered.length,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      totalMinutes,
      dailySorted,
      maxCount,
      maxMinutes,
      locationData,
      topWords,
      busiestDay: busiestDay ? { name: dayNames[parseInt(busiestDay[0])], count: busiestDay[1] } : null,
      avgPerDay: filtered.length > 0 ? Math.round(filtered.length / Math.max(dailySorted.length, 1) * 10) / 10 : 0,
      daysActive: Object.keys(daily).length,
    }
  }, [entries, timeRange])

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500">Belum ada data statistik</p>
        <p className="text-slate-600 text-sm mt-1">Mulai catat kegiatan untuk melihat statistik</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Time Range Filter */}
      <div className="flex gap-1 bg-cyber-900/60 border border-slate-800 rounded-xl p-1 max-w-xs">
        {[
          { id: 'week', label: '7 Hari' },
          { id: 'month', label: '30 Hari' },
          { id: 'all', label: 'Semua' },
        ].map(t => (
          <button key={t.id} onClick={() => setTimeRange(t.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              timeRange === t.id ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={BarChart3} value={stats.total} label="Total Laporan" color="from-cyan-500 to-blue-500" />
        <StatBox icon={Clock} value={stats.totalHours} suffix="jam" label="Total Jam" color="from-purple-500 to-pink-500" />
        <StatBox icon={CalendarDays} value={stats.daysActive} label="Hari Aktif" color="from-green-500 to-emerald-500" />
        <StatBox icon={TrendingUp} value={stats.avgPerDay} label="Rata-rata/Hari" color="from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Grafik Harian
          </h3>
          <div className="space-y-1.5">
            {stats.dailySorted.slice(-14).map(([date, data]) => {
              const pct = (data.count / stats.maxCount) * 100
              const label = date.slice(5)
              return (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-12 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{data.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            Berdasarkan Lokasi
          </h3>
          <div className="space-y-3">
            {stats.locationData.map(([loc, count]) => {
              const pct = (count / stats.total) * 100
              return (
                <div key={loc}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{loc}</span>
                    <span className="text-slate-400">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Busiest Day */}
        {stats.busiestDay && (
          <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Hari Tersibuk
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.busiestDay.count}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{stats.busiestDay.name}</p>
                <p className="text-slate-400 text-sm">laporan terbanyak</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Keywords */}
        {stats.topWords.length > 0 && (
          <div className="bg-cyber-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Kata Kunci Aktivitas
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.topWords.map(([word, count]) => (
                <span key={word}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-400">
                  {word} <span className="text-cyan-500/60 ml-1">{count}x</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, value, suffix, label, color }) {
  return (
    <div className="bg-cyber-900/60 border border-slate-800 rounded-xl p-4 lg:p-5 hover:border-cyan-500/30 transition-all">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix ? <span className="text-sm text-slate-400 font-normal"> {suffix}</span> : ''}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}
