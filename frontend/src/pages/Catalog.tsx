import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import type { Flight, Hotel, ItemType, Tour } from '../types'

type AnyItem = Flight | Hotel | Tour
const TITLES: Record<string, string> = { flights: 'Рейсы', hotels: 'Отели', tours: 'Туры' }
const TO_TYPE: Record<string, ItemType> = { flights: 'flight', hotels: 'hotel', tours: 'tour' }

interface View { title: string; sub: string; price: number; priceLabel: string; left: number; unit: string; desc?: string }

function describe(item: AnyItem, type: ItemType): View {
  if (type === 'flight') {
    const f = item as Flight
    const dep = new Date(f.departure).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    return { title: `${f.from_city} → ${f.to_city}`, sub: `${f.airline} · ${dep}`, price: f.price, priceLabel: '₽ за место', left: f.seats_left, unit: 'мест' }
  }
  if (type === 'hotel') {
    const h = item as Hotel
    return { title: h.name, sub: `${h.city} · ${'★'.repeat(h.stars)}`, price: h.price_per_night, priceLabel: '₽ за ночь', left: h.rooms_left, unit: 'номеров', desc: h.description }
  }
  const t = item as Tour
  return { title: t.title, sub: `${t.city} · ${t.duration_days} дн.`, price: t.price, priceLabel: '₽ с человека', left: t.spots_left, unit: 'мест', desc: t.description }
}

const money = (n: number) => n.toLocaleString('ru-RU')

export default function Catalog() {
  const { type = 'flights' } = useParams()
  const [sp] = useSearchParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [items, setItems] = useState<AnyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<AnyItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const itemType = TO_TYPE[type] ?? 'flight'

  const load = () => {
    setLoading(true)
    setError(null)
    const params = Object.fromEntries(sp.entries())
    const p = type === 'hotels' ? api.listHotels(params)
      : type === 'tours' ? api.listTours(params)
      : api.listFlights(params)
    p.then((data) => setItems(data)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [type, sp.toString()])

  const onBooked = () => {
    setBooking(null)
    setToast('Бронирование оформлено — смотрите «Мои брони».')
    load()
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">{TITLES[type] ?? 'Каталог'}</h1>
      <p className="text-slate-500 mb-6">{items.length} предложений</p>

      {toast && <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 text-sm">{toast}</div>}
      {error && <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 text-sm">{error}</div>}
      {loading && <p className="text-slate-400">Загрузка…</p>}
      {!loading && !error && items.length === 0 && <p className="text-slate-400">Ничего не найдено.</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const v = describe(item, itemType)
          const soldOut = v.left <= 0
          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <div className="font-semibold text-slate-800">{v.title}</div>
              <div className="text-sm text-slate-500 mt-0.5">{v.sub}</div>
              {v.desc && <div className="text-sm text-slate-500 mt-2 line-clamp-2">{v.desc}</div>}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xl font-bold text-slate-800">{money(v.price)} <span className="text-sm font-normal text-slate-400">{v.priceLabel}</span></div>
                  <div className={`text-xs mt-0.5 ${soldOut ? 'text-rose-500' : 'text-slate-400'}`}>
                    {soldOut ? 'мест нет' : `осталось ${v.left} ${v.unit}`}
                  </div>
                </div>
                <button disabled={soldOut}
                  onClick={() => (user ? setBooking(item) : nav('/login'))}
                  className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  Забронировать
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {booking && (
        <BookingModal item={booking} type={itemType} onClose={() => setBooking(null)} onBooked={onBooked} />
      )}
    </div>
  )
}

function BookingModal({ item, type, onClose, onBooked }: {
  item: AnyItem; type: ItemType; onClose: () => void; onBooked: () => void
}) {
  const v = describe(item, type)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.book(type, item.id, qty)
      onBooked()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось забронировать')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-slate-800">{v.title}</div>
        <div className="text-sm text-slate-500">{v.sub}</div>
        <label className="block mt-4 text-sm text-slate-600">
          Количество ({v.unit})
          <input type="number" min={1} max={v.left} value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(v.left, Number(e.target.value) || 1)))}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Итого</span>
          <span className="text-lg font-bold text-slate-800">{money(v.price * qty)} ₽</span>
        </div>
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-slate-600 hover:text-slate-800">Отмена</button>
          <button onClick={confirm} disabled={busy}
            className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Оформляю…' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  )
}
