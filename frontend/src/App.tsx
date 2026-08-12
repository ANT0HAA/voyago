import { useState, type ReactElement } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { useCart } from './cart'
import { useFavorites } from './favorites'
import { getTheme, toggleTheme } from './theme'
import { IS_DEMO } from './api'
import { demoReset } from './demo/api'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Detail from './pages/Detail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Favorites from './pages/Favorites'
import Account from './pages/Account'
import MyBookings from './pages/MyBookings'
import AuthPage from './pages/AuthPage'
import Admin from './pages/Admin'

function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState(getTheme())
  return (
    <button onClick={() => setTheme(toggleTheme())} aria-label="Переключить тему" className={className}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

function DemoBanner() {
  if (!IS_DEMO) return null
  const reset = () => { demoReset(); window.location.reload() }
  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
      <div className="max-w-6xl mx-auto px-5 py-1.5 flex items-center gap-2 flex-wrap">
        <span>🧪 Демо-версия — данные хранятся только в вашем браузере. Вход: <b>admin@voyago.app</b>/admin123 · <b>manager@voyago.app</b>/manager123 · <b>user@voyago.app</b>/user123.</span>
        <button onClick={reset} className="underline hover:text-amber-900 dark:hover:text-amber-200 ml-auto">Сбросить демо</button>
      </div>
    </div>
  )
}

function Badge({ n, color }: { n: number; color: string }) {
  if (n <= 0) return null
  return (
    <span className={`absolute -top-2 -right-2 ${color} text-white text-[10px] leading-none min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center`}>
      {n}
    </span>
  )
}

function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { count: favCount } = useFavorites()
  const [open, setOpen] = useState(false)
  const link = 'text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600'
  const close = () => setOpen(false)

  const authLinks = (onNav: () => void) => user ? (
    <>
      <Link to="/bookings" className={link} onClick={onNav}>Мои брони</Link>
      {(user.role === 'admin' || user.role === 'manager') && <Link to="/admin" className="text-sm font-medium text-brand-600" onClick={onNav}>Админка</Link>}
      <Link to="/account" className={link} onClick={onNav}>{user.name}</Link>
      <button onClick={() => { logout(); onNav() }} className={`${link} text-left`}>Выйти</button>
    </>
  ) : (
    <Link to="/login" onClick={onNav} className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 px-3.5 py-1.5 rounded-lg text-center">
      Войти
    </Link>
  )

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
      <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-5">
        <Link to="/" onClick={close} className="font-bold text-brand-600 text-lg mr-2">✈ Voyago</Link>
        <div className="hidden md:flex items-center gap-5">
          <Link to="/search/flights" className={link}>Рейсы</Link>
          <Link to="/search/hotels" className={link}>Отели</Link>
          <Link to="/search/tours" className={link}>Туры</Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle className="text-base leading-none" />
          <Link to="/favorites" className={`relative ${link}`} aria-label="Избранное">
            ♡<Badge n={favCount} color="bg-rose-500" />
          </Link>
          <Link to="/cart" className={`relative ${link}`} aria-label="Корзина">
            🛒<Badge n={count} color="bg-brand-600" />
          </Link>
          <div className="hidden md:flex items-center gap-4">{authLinks(close)}</div>
          <button className="md:hidden text-xl leading-none text-slate-600 dark:text-slate-300"
            aria-label="Меню" onClick={() => setOpen((o) => !o)}>{open ? '✕' : '☰'}</button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex flex-col gap-3">
          <Link to="/search/flights" className={link} onClick={close}>Рейсы</Link>
          <Link to="/search/hotels" className={link} onClick={close}>Отели</Link>
          <Link to="/search/tours" className={link} onClick={close}>Туры</Link>
          <hr className="border-slate-100 dark:border-slate-700" />
          {authLinks(close)}
        </div>
      )}
    </header>
  )
}

function RequireAuth({ children, admin = false, staff = false }: { children: ReactElement; admin?: boolean; staff?: boolean }) {
  const { user, ready } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'manager'
  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  if (staff && !isStaff) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <DemoBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search/:type" element={<Catalog />} />
          <Route path="/flights/:id" element={<Detail type="flight" />} />
          <Route path="/hotels/:id" element={<Detail type="hotel" />} />
          <Route path="/tours/:id" element={<Detail type="tour" />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/order" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin" element={<RequireAuth staff><Admin /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-5 py-6 text-xs text-slate-400 dark:text-slate-500">
          Voyago · демо-проект бронирования путешествий · open-source
        </div>
      </footer>
    </div>
  )
}
