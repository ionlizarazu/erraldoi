import { HashRouter as Router, Routes, Route, Navigate, NavLink, Link } from 'react-router-dom'
import KonpartsakList from './pages/KonpartsakList'
import ErraldoiakList from './pages/ErraldoiakList'
import KonpartsaDetail from './pages/KonpartsaDetail'
import ErraldoiDetail from './pages/ErraldoiDetail'
import Mapa from './pages/Mapa'
import './App.css'

function App() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `font-headline tracking-tight font-semibold transition-all duration-300 no-underline pb-1 border-b-2 ${
      isActive 
        ? "text-primary border-amber-400" 
        : "text-slate-600 border-transparent hover:text-amber-500"
    }`;

  return (
    <Router>
      <div className="min-h-screen bg-background text-on-surface">
        {/* TopNavBar */}
        <nav className="fixed top-0 left-0 w-full z-[1000] bg-white/80 backdrop-blur-xl border-b border-surface-container-highest">
          <div className="flex justify-between items-center px-8 py-5 max-w-screen-2xl mx-auto">
            <Link title="Hasiera" to="/" className="text-xl font-bold text-primary font-headline tracking-tight no-underline">
              Erraldoiak
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <NavLink to="/konpartsak" className={navLinkClass}>Konpartsak</NavLink>
              <NavLink to="/erraldoiak" className={navLinkClass}>Erraldoiak</NavLink>
              <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
            </div>
            <div className="md:hidden">
              <span className="material-symbols-outlined text-primary cursor-pointer">menu</span>
            </div>
          </div>
        </nav>

        <div className="pt-20">
          <Routes>
            <Route path="/" element={<Navigate to="/konpartsak" replace />} />
            <Route path="/konpartsak" element={<KonpartsakList />} />
            <Route path="/erraldoiak" element={<ErraldoiakList />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/konpartsa/:id" element={<KonpartsaDetail />} />
            <Route path="/erraldoi/:id" element={<ErraldoiDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
