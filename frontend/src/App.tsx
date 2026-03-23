import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'
import TrendsPage from './pages/TrendsPage'
import ComparePage from './pages/ComparePage'
import DiscoverPage from './pages/DiscoverPage'
import SourcingPage from './pages/SourcingPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Navigate to="/sourcing" replace />} />
            <Route path="/sourcing" element={<SourcingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
