import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FormLKH from './pages/FormLKH'
import History from './pages/History'
import Stats from './pages/Stats'

const ExcelPreview = lazy(() => import('./pages/ExcelPreview'))

function LazyFallback() {
  return (
    <div className="max-w-4xl mx-auto py-24 text-center text-slate-500 animate-fade-in">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm">Memuat...</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form" element={<FormLKH />} />
        <Route path="/history" element={<History />} />
        <Route path="/stats" element={<Stats />} />
        <Route
          path="/excel-preview"
          element={
            <Suspense fallback={<LazyFallback />}>
              <ExcelPreview />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
