import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, History, BarChart3, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/form', label: 'Form LKH', icon: ClipboardList },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/stats', label: 'Statistik', icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()
  const currentLabel = navItems.find(n => n.to === location.pathname)?.label ?? 'Niu-LKH'

  return (
    <div className="min-h-screen bg-cyber-950 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse-glow" />
        <div className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-cyber-900/80 backdrop-blur-xl border-r border-slate-800 z-50 hidden md:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NL</span>
            </div>
            <span className="text-white font-semibold text-lg hidden lg:block">Niu-LKH</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-800 hidden lg:block">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Niu-LKH v2.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cyber-900/90 backdrop-blur-xl border-t border-slate-800 z-50 md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-20 lg:ml-64 pb-20 md:pb-0 min-h-screen relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-cyber-950/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between h-14 px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse-glow" />
              <h2 className="text-slate-200 font-semibold text-sm lg:text-base">{currentLabel}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:block">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
