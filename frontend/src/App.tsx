import { type ReactElement } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { useCart } from './cart'
import { IS_DEMO } from './api'
import { demoReset } from './demo/api'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Detail from './pages/Detail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import MyBookings from './pages/MyBookings'
import AuthPage from './pages/AuthPage'
import Admin from './pages/Admin'

function DemoBanner() {
  if (!IS_DEMO) return null
  const reset = () => { demoReset(); window.location.reload() }
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
      <div className="max-w-6xl mx-auto px-5 py-1.5 flex items-center gap-2 flex-wrap">
        <span>🧪 Демо-версия — все данные хранятся только в вашем браузере. Логин: <b>admin@voyago.app / admin123</b> или <b>user@voyago.app / user123</b>.</span>
        <button onClick={reset} className="underline hover:text-amber-900 ml-auto">Сбросить демо</button>
      </div>
    </div>
  )
}

function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const link = 'text-sm text-slate-600 hover:text-brand-600'
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-5">
        <Link to="/" className="font-bold text-brand-600 text-lg mr-2">✈ Voyago</Link>
        <Link to="/search/flights" className={link}>Рейсы</Link>
        <Link to="/search/hotels" className={link}>Отели</Link>
        <Link to="/search/tours" className={link}>Туры</Link>
        <div className="ml-auto flex items-center gap-4">
          <Link to="/cart" className={`relative ${link}`} aria-label="Корзина">
            🛒
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] leading-none min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/bookings" className={link}>Мои брони</Link>
              {user.role === 'admin' && <Link to="/admin" className="text-sm font-medium text-brand-600">Админка</Link>}
              <span className="text-sm text-slate-400">{user.name}</span>
              <button onClick={logout} className={link}>Выйти</button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 px-3.5 py-1.5 rounded-lg">
              Войти
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function RequireAuth({ children, admin = false }: { children: ReactElement; admin?: boolean }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
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
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/order" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-6 text-xs text-slate-400">
          Voyago · демо-проект бронирования путешествий · open-source
        </div>
      </footer>
    </div>
  )
}
