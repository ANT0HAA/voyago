import { Link, useNavigate } from 'react-router-dom'
import { lineTotal, nightsOf, useCart } from '../cart'
import { useAuth } from '../auth'
import { Cover } from '../media'
import { money } from '../itemView'

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '')

export default function Cart() {
  const { items, total, count, remove, update, clear } = useCart()
  const { user } = useAuth()
  const nav = useNavigate()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <div className="text-5xl mb-4">🧳</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Корзина пуста</h1>
        <p className="text-slate-500 mb-6">Добавьте рейсы, отели или туры — и они появятся здесь.</p>
        <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Корзина</h1>
        <button onClick={clear} className="text-sm text-slate-400 hover:text-rose-600">Очистить</button>
      </div>

      <div className="space-y-3">
        {items.map((it) => {
          const nights = nightsOf(it)
          return (
            <div key={it.key} className="rounded-2xl border border-slate-200 bg-white p-3 flex gap-4 items-center">
              <Cover seed={it.seed} emoji={it.emoji} className="w-24 h-20 rounded-xl shrink-0" glyphClass="text-3xl" />
              <div className="flex-1 min-w-0">
                <Link to={`/${it.type === 'flight' ? 'flights' : it.type === 'hotel' ? 'hotels' : 'tours'}/${it.id}`}
                  className="font-semibold text-slate-800 hover:text-brand-600">{it.title}</Link>
                <div className="text-sm text-slate-500">{it.sub}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {money(it.unitPrice)} {it.priceLabel}
                  {it.type === 'hotel' && it.dateFrom && it.dateTo && ` · ${fmt(it.dateFrom)} — ${fmt(it.dateTo)} · ${nights} ноч.`}
                  {it.type === 'tour' && it.dateFrom && ` · ${fmt(it.dateFrom)}`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => update(it.key, { qty: Math.max(1, it.qty - 1) })}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">−</button>
                <span className="w-8 text-center text-sm">{it.qty}</span>
                <button onClick={() => update(it.key, { qty: Math.min(it.max, it.qty + 1) })}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">+</button>
              </div>
              <div className="text-right w-28 shrink-0">
                <div className="font-bold text-slate-800">{money(lineTotal(it))} ₽</div>
                <button onClick={() => remove(it.key)} className="text-xs text-slate-400 hover:text-rose-600">удалить</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Итого за {count} позиц.</div>
          <div className="text-2xl font-bold text-slate-800">{money(total)} ₽</div>
        </div>
        <button onClick={() => nav(user ? '/checkout' : '/login')}
          className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-6 py-3 rounded-lg">
          Оформить →
        </button>
      </div>
    </div>
  )
}
