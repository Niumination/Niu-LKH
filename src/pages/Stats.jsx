import { useState, useEffect, useMemo } from 'react'
import { BarChart3, CalendarDays, MapPin, TrendingUp, Award, Sparkles } from 'lucide-react'
import { getEntries } from '../utils/storage'
import { isSeeded } from '../utils/seed'
import { todayLocalISO, toLocalDate } from '../lib/date'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import SectionHeader from '../components/ui/SectionHeader'

const STOP_WORDS = new Set(['dan', 'yang', 'dari', 'dengan', 'untuk', 'telah', 'akan', 'dapat', 'pada', 'ke', 'di'])

export default function Stats() {
  const [entries, setEntries] = useState([])
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    setEntries(getEntries())
    if (isSeeded() && !localStorage.getItem('niu_lkh_stats_range_set')) {
      setTimeRange('all')
      localStorage.setItem('niu_lkh_stats_range_set', '1')
    }
  }, [])

  useEffect(() => {
    if (entries.length === 0) localStorage.removeItem('niu_lkh_stats_range_set')
  }, [entries.length])

  const stats = useMemo(() => {
    if (entries.length === 0) return null

    const now = new Date()
    const todayStr = todayLocalISO(now)

    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    const weekAgoStr = todayLocalISO(weekAgo)

    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)
    const monthAgoStr = todayLocalISO(monthAgo)

    let filtered = entries
    if (timeRange === 'week') filtered = entries.filter((e) => e.tanggal >= weekAgoStr)
    else if (timeRange === 'month') filtered = entries.filter((e) => e.tanggal >= monthAgoStr)

    const daily = {}
    filtered.forEach((e) => {
      daily[e.tanggal] = (daily[e.tanggal] || 0) + 1
    })

    const tempat = {}
    filtered.forEach((e) => {
      tempat[e.tempat] = (tempat[e.tempat] || 0) + 1
    })
    const tempatData = Object.entries(tempat).sort((a, b) => b[1] - a[1])

    const activityWords = {}
    filtered.forEach((e) => {
      const words = (e.uraianKegiatan || '').toLowerCase().split(/\s+/).slice(0, 5)
      words.forEach((w) => {
        if (w.length > 3 && !STOP_WORDS.has(w)) {
          activityWords[w] = (activityWords[w] || 0) + 1
        }
      })
    })
    const topWords = Object.entries(activityWords).sort((a, b) => b[1] - a[1]).slice(0, 8)

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    filtered.forEach((e) => {
      const d = toLocalDate(e.tanggal).getDay()
      dayCount[d] = (dayCount[d] || 0) + 1
    })
    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]

    const dailySorted = Object.entries(daily).sort()
    const maxCount = Math.max(...dailySorted.map(([, c]) => c), 1)

    return {
      total: filtered.length,
      dailySorted,
      maxCount,
      tempatData,
      topWords,
      busiestDay: busiestDay ? { name: dayNames[parseInt(busiestDay[0], 10)], count: busiestDay[1] } : null,
      avgPerDay: filtered.length > 0 ? Math.round((filtered.length / Math.max(dailySorted.length, 1)) * 10) / 10 : 0,
      daysActive: Object.keys(daily).length,
    }
  }, [entries, timeRange])

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" aria-hidden="true" />
        <p className="text-slate-500">Belum ada data statistik</p>
        <p className="text-slate-600 text-sm mt-1">Mulai catat kegiatan untuk melihat statistik</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex gap-1 bg-cyber-900/60 border border-slate-800 rounded-xl p-1 max-w-xs" role="group" aria-label="Filter rentang waktu">
        {[
          { id: 'week', label: '7 Hari' },
          { id: 'month', label: '30 Hari' },
          { id: 'all', label: 'Semua' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTimeRange(t.id)}
            aria-pressed={timeRange === t.id}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              timeRange === t.id ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} value={stats.total} label="Total Laporan" color="from-cyan-500 to-blue-500" />
        <StatCard icon={CalendarDays} value={stats.daysActive} label="Hari Aktif" color="from-green-500 to-emerald-500" />
        <StatCard icon={TrendingUp} value={stats.avgPerDay} label="Rata-rata/Hari" color="from-purple-500 to-pink-500" />
        <StatCard icon={MapPin} value={stats.tempatData.length} label="Lokasi" color="from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionHeader icon={BarChart3} title="Grafik Harian" />
          <div className="space-y-1.5">
            {stats.dailySorted.slice(-14).map(([date, count]) => {
              const pct = (count / stats.maxCount) * 100
              const label = date.slice(5)
              return (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-12 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader icon={MapPin} title="Berdasarkan Tempat" />
          <div className="space-y-3">
            {stats.tempatData.map(([loc, count]) => {
              const pct = (count / stats.total) * 100
              return (
                <div key={loc}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{loc}</span>
                    <span className="text-slate-400">{count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {stats.busiestDay && (
          <Card className="p-6">
            <SectionHeader icon={Award} title="Hari Tersibuk" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.busiestDay.count}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{stats.busiestDay.name}</p>
                <p className="text-slate-400 text-sm">laporan terbanyak</p>
              </div>
            </div>
          </Card>
        )}

        {stats.topWords.length > 0 && (
          <Card className="p-6">
            <SectionHeader icon={Sparkles} title="Kata Kunci Aktivitas" />
            <div className="flex flex-wrap gap-2">
              {stats.topWords.map(([word, count]) => (
                <span key={word} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-400">
                  {word} <span className="text-cyan-500/60 ml-1">{count}x</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
