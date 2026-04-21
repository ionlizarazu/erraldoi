import { useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, NavLink, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import KonpartsakList from './pages/KonpartsakList'
import ErraldoiakList from './pages/ErraldoiakList'
import KonpartsaDetail from './pages/KonpartsaDetail'
import ErraldoiDetail from './pages/ErraldoiDetail'
import Mapa from './pages/Mapa'
import Jolasa from './pages/Jolasa'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `font-headline tracking-tight font-semibold transition-all duration-300 no-underline pb-1 border-b-2 ${
      isActive 
        ? "text-primary border-amber-400" 
        : "text-slate-600 border-transparent hover:text-amber-500"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `text-2xl font-headline font-black tracking-tight no-underline py-4 border-b border-slate-100 w-full text-center ${
      isActive ? "text-primary" : "text-slate-600"
    }`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        {/* TopNavBar */}
        <nav className="fixed top-0 left-0 w-full z-[1000] bg-white/80 backdrop-blur-xl border-b border-surface-container-highest">
          <div className="flex justify-between items-center px-8 py-5 max-w-screen-2xl mx-auto">
            <Link title="Hasiera" to="/" onClick={closeMenu} className="text-xl font-bold text-primary font-headline tracking-tight no-underline">
              erraldoi.eus
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink to="/konpartsak" className={navLinkClass}>Konpartsak</NavLink>
              <NavLink to="/erraldoiak" className={navLinkClass}>Erraldoiak</NavLink>
              <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
              <NavLink to="/jolasa" className={navLinkClass}>Jolasa</NavLink>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="material-symbols-outlined text-primary text-3xl cursor-pointer p-2 select-none"
              >
                {isMenuOpen ? 'close' : 'menu'}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-[999] bg-white pt-24 px-8 flex flex-col items-center md:hidden"
            >
              <NavLink to="/konpartsak" onClick={closeMenu} className={mobileNavLinkClass}>Konpartsak</NavLink>
              <NavLink to="/erraldoiak" onClick={closeMenu} className={mobileNavLinkClass}>Erraldoiak</NavLink>
              <NavLink to="/mapa" onClick={closeMenu} className={mobileNavLinkClass}>Mapa</NavLink>
              <NavLink to="/jolasa" onClick={closeMenu} className={mobileNavLinkClass}>Jolasa</NavLink>
              
              <div className="mt-auto pb-12 text-slate-400 text-xs uppercase tracking-widest font-bold">
                Euskal Folklorearen Artxiboa
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-20 flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/konpartsak" replace />} />
            <Route path="/konpartsak" element={<KonpartsakList />} />
            <Route path="/erraldoiak" element={<ErraldoiakList />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/jolasa" element={<Jolasa />} />
            <Route path="/konpartsa/:id" element={<KonpartsaDetail />} />
            <Route path="/erraldoi/:id" element={<ErraldoiDetail />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  )
}

export default App
