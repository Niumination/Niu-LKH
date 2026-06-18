import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FormLKH from './pages/FormLKH'
import History from './pages/History'
import Stats from './pages/Stats'
import ExcelPreview from './pages/ExcelPreview'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form" element={<FormLKH />} />
        <Route path="/history" element={<History />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/excel-preview" element={<ExcelPreview />} />
      </Route>
    </Routes>
  )
}
