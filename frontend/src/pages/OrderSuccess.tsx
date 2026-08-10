import { Link, useLocation } from 'react-router-dom'
import { money } from '../itemView'

interface OrderState {
  summary?: { title: string; qty: number; sum: number }[]
  total?: number
  discount?: number
  promo?: string
}

export default function OrderSuccess() {
  const { state } = useLocation() as { state?: OrderState }
  const summary = state?.summary ?? []
  const discount = state?.discount ?? 0

  return (
    <div className="max-w-2xl mx-auto px-5 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center mx-auto">✓</div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">Заказ оформлен!</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2">
        Спасибо за покупку. Детали брони мы отправили на вашу почту (демо), они также доступны в разделе «Мои брони».
      </p>

      {summary.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-left">
          <div className="space-y-2 text-sm">
            {summary.map((s, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300 truncate">{s.title} × {s.qty}</span>
                <span className="text-slate-800 dark:text-slate-100 font-medium whitespace-nowrap">{money(s.sum)} ₽</span>
              </div>
            ))}
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 text-sm mt-2">
              <span>Скидка{state?.promo ? ` (${state.promo})` : ''}</span><span>−{money(discount)} ₽</span>
            </div>
          )}
          {state?.total != null && (
            <div className="border-t border-slate-100 dark:border-slate-700 mt-3 pt-3 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Итого оплачено</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{money(state.total)} ₽</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3 justify-center">
        <Link to="/bookings" className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
          Мои брони
        </Link>
        <Link to="/" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 px-5 py-2.5">
          На главную
        </Link>
      </div>
    </div>
  )
}
