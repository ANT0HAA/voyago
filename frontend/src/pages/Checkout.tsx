import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { lineTotal, useCart } from '../cart'
import { money } from '../itemView'

const onlyDigits = (s: string) => s.replace(/\D/g, '')
const groupCard = (s: string) => onlyDigits(s).slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

export default function Checkout() {
  const { items, total, clear } = useCart()
  const { user } = useAuth()
  const nav = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [card, setCard] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (items.length === 0 && !busy) nav('/cart', { replace: true }) }, [items.length, busy, nav])

  const cardOk = onlyDigits(card).length >= 12
  const expiryOk = /^\d{2}\/\d{2}$/.test(expiry)
  const canPay = name.trim() && email.trim() && cardOk && holder.trim() && expiryOk && cvc.length >= 3

  const pay = async (e: FormEvent) => {
    e.preventDefault()
    if (!canPay) { setError('Заполните контакты и платёжные данные (демо).'); return }
    setBusy(true)
    setError(null)
    const summary = items.map((it) => ({ title: it.title, qty: it.qty, sum: lineTotal(it) }))
    const grand = total
    try {
      for (const it of items) {
        const extra = it.type === 'hotel' ? { date_from: it.dateFrom, date_to: it.dateTo } : {}
        await api.book(it.type, it.id, it.qty, extra)
      }
      clear()
      nav('/order', { replace: true, state: { summary, total: grand } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ')
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Оформление заказа</h1>

      <form onSubmit={pay} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Контактные данные</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-500">Имя
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="block text-xs text-slate-500">Email
                <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block text-xs text-slate-500 sm:col-span-2">Телефон
                <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-700 mb-1">Оплата картой</h2>
            <p className="text-xs text-amber-600 mb-3">🧪 Демо-оплата — платёж не проводится, данные никуда не отправляются.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-500 sm:col-span-2">Номер карты
                <input className={field} value={card} inputMode="numeric" placeholder="4111 1111 1111 1111"
                  onChange={(e) => setCard(groupCard(e.target.value))} />
              </label>
              <label className="block text-xs text-slate-500 sm:col-span-2">Имя на карте
                <input className={field} value={holder} onChange={(e) => setHolder(e.target.value.toUpperCase())} placeholder="IVAN IVANOV" />
              </label>
              <label className="block text-xs text-slate-500">Срок (ММ/ГГ)
                <input className={field} value={expiry} placeholder="09/28" maxLength={5}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value).slice(0, 4)
                    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
                  }} />
              </label>
              <label className="block text-xs text-slate-500">CVC
                <input className={field} value={cvc} inputMode="numeric" placeholder="123" maxLength={4}
                  onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))} />
              </label>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 h-fit lg:sticky lg:top-20">
          <h2 className="font-semibold text-slate-700 mb-3">Ваш заказ</h2>
          <div className="space-y-2 text-sm">
            {items.map((it) => (
              <div key={it.key} className="flex justify-between gap-2">
                <span className="text-slate-600 truncate">{it.title} × {it.qty}</span>
                <span className="text-slate-800 font-medium whitespace-nowrap">{money(lineTotal(it))} ₽</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
            <span className="text-slate-500 text-sm">К оплате</span>
            <span className="text-xl font-bold text-slate-800">{money(total)} ₽</span>
          </div>
          {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
          <button type="submit" disabled={busy || !canPay}
            className="w-full mt-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Оформляю…' : `Оплатить ${money(total)} ₽`}
          </button>
        </aside>
      </form>
    </div>
  )
}
