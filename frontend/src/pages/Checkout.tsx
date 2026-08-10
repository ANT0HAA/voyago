import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { lineTotal, useCart } from '../cart'
import { money } from '../itemView'
import { promoDiscount, PROMO_HINT, type AppliedPromo } from '../promo'

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
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState<AppliedPromo | null>(null)
  const [promoMsg, setPromoMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (items.length === 0 && !busy) nav('/cart', { replace: true }) }, [items.length, busy, nav])

  const discount = applied?.discount ?? 0
  const payTotal = Math.max(0, total - discount)

  const applyPromo = () => {
    const r = promoDiscount(promo, total)
    if (!r) { setApplied(null); setPromoMsg('Промокод не найден'); return }
    setApplied(r)
    setPromoMsg(`Промокод «${r.code}» применён (${r.label})`)
  }

  const cardOk = onlyDigits(card).length >= 12
  const expiryOk = /^\d{2}\/\d{2}$/.test(expiry)
  const canPay = name.trim() && email.trim() && cardOk && holder.trim() && expiryOk && cvc.length >= 3

  const pay = async (e: FormEvent) => {
    e.preventDefault()
    if (!canPay) { setError('Заполните контакты и платёжные данные (демо).'); return }
    setBusy(true)
    setError(null)
    const summary = items.map((it) => ({ title: it.title, qty: it.qty, sum: lineTotal(it) }))
    try {
      for (const it of items) {
        const extra = it.type === 'hotel' ? { date_from: it.dateFrom, date_to: it.dateTo } : {}
        await api.book(it.type, it.id, it.qty, extra)
      }
      clear()
      nav('/order', { replace: true, state: { summary, total: payTotal, discount, promo: applied?.code } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ')
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Оформление заказа</h1>

      <form onSubmit={pay} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Контактные данные</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-500 dark:text-slate-400">Имя
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400">Email
                <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">Телефон
                <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Оплата картой</h2>
            <p className="text-xs text-amber-600 mb-3">🧪 Демо-оплата — платёж не проводится, данные никуда не отправляются.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">Номер карты
                <input className={field} value={card} inputMode="numeric" placeholder="4111 1111 1111 1111"
                  onChange={(e) => setCard(groupCard(e.target.value))} />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">Имя на карте
                <input className={field} value={holder} onChange={(e) => setHolder(e.target.value.toUpperCase())} placeholder="IVAN IVANOV" />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400">Срок (ММ/ГГ)
                <input className={field} value={expiry} placeholder="09/28" maxLength={5}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value).slice(0, 4)
                    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
                  }} />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400">CVC
                <input className={field} value={cvc} inputMode="numeric" placeholder="123" maxLength={4}
                  onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))} />
              </label>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 h-fit lg:sticky lg:top-20">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Ваш заказ</h2>
          <div className="space-y-2 text-sm">
            {items.map((it) => (
              <div key={it.key} className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300 truncate">{it.title} × {it.qty}</span>
                <span className="text-slate-800 dark:text-slate-100 font-medium whitespace-nowrap">{money(lineTotal(it))} ₽</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-xs text-slate-500 dark:text-slate-400">Промокод</label>
            <div className="flex gap-2 mt-1">
              <input className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="VOYAGO10" />
              <button type="button" onClick={applyPromo}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                ОК
              </button>
            </div>
            {promoMsg && <div className={`text-xs mt-1 ${applied ? 'text-emerald-600' : 'text-rose-600'}`}>{promoMsg}</div>}
            {!promoMsg && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{PROMO_HINT}</div>}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Сумма</span><span>{money(total)} ₽</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Скидка ({applied?.code})</span><span>−{money(discount)} ₽</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 dark:text-slate-400">К оплате</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{money(payTotal)} ₽</span>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
          <button type="submit" disabled={busy || !canPay}
            className="w-full mt-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Оформляю…' : `Оплатить ${money(payTotal)} ₽`}
          </button>
        </aside>
      </form>
    </div>
  )
}
