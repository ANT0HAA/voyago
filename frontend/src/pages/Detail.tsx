import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
import { FavButton } from '../favorites'
import { Reviews } from '../reviews'
import { Cover, galleryEmojis } from '../media'
import { describe, fmtDateTime, money, ROUTE_OF_TYPE, TYPE_LABEL, type AnyItem, type ItemView } from '../itemView'
import type { Flight, Hotel, ItemType, Tour } from '../types'

const INCLUDED: Record<ItemType, string[]> = {
  flight: ['Ручная кладь 10 кг', 'Багаж 20 кг', 'Онлайн-регистрация', 'Выбор места'],
  hotel: ['Wi-Fi бесплатно', 'Завтрак «шведский стол»', 'Парковка', 'Бесплатная отмена'],
  tour: ['Сопровождение гида', 'Трансфер', 'Входные билеты', 'Страховка'],
}

function flightDuration(f: Flight): string {
  const ms = new Date(f.arrival).getTime() - new Date(f.departure).getTime()
  const h = Math.floor(ms / 3.6e6)
  const m = Math.round((ms % 3.6e6) / 6e4)
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

function facts(item: AnyItem, type: ItemType): [string, string][] {
  if (type === 'flight') {
    const f = item as Flight
    return [
      ['Авиакомпания', f.airline],
      ['Вылет', fmtDateTime(f.departure)],
      ['Прилёт', fmtDateTime(f.arrival)],
      ['В пути', flightDuration(f)],
      ['Свободно мест', `${f.seats_left} из ${f.seats_total}`],
    ]
  }
  if (type === 'hotel') {
    const h = item as Hotel
    return [
      ['Город', h.city],
      ['Категория', '★'.repeat(h.stars)],
      ['Цена за ночь', `${money(h.price_per_night)} ₽`],
      ['Свободно номеров', `${h.rooms_left} из ${h.rooms_total}`],
    ]
  }
  const t = item as Tour
  return [
    ['Город', t.city],
    ['Длительность', `${t.duration_days} дн.`],
    ['Цена', `${money(t.price)} ₽`],
    ['Свободно мест', `${t.spots_left} из ${t.spots_total}`],
  ]
}

function longDescription(item: AnyItem, type: ItemType): string {
  if (type === 'flight') {
    const f = item as Flight
    return `Прямой рейс авиакомпании «${f.airline}» из города ${f.from_city} в ${f.to_city}. ` +
      `Вылет ${fmtDateTime(f.departure)}, время в пути ${flightDuration(f)}. ` +
      `Удобное расписание, электронный билет приходит сразу после оплаты.`
  }
  return (item as Hotel | Tour).description
}

const getters: Record<ItemType, (id: number) => Promise<AnyItem>> = {
  flight: (id) => api.getFlight(id),
  hotel: (id) => api.getHotel(id),
  tour: (id) => api.getTour(id),
}

export default function Detail({ type }: { type: ItemType }) {
  const { id = '' } = useParams()
  const [item, setItem] = useState<AnyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getters[type](Number(id)).then(setItem).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [type, id])

  if (loading) return <div className="max-w-5xl mx-auto px-5 py-10 text-slate-400 dark:text-slate-500">Загрузка…</div>
  if (error || !item) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-10">
        <p className="text-rose-600 mb-3">{error ?? 'Не найдено'}</p>
        <Link to={`/search/${ROUTE_OF_TYPE[type]}`} className="text-brand-600 hover:underline">← к результатам</Link>
      </div>
    )
  }

  const v = describe(item, type)
  const emojis = galleryEmojis(type)

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <Link to={`/search/${ROUTE_OF_TYPE[type]}`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600">← к результатам</Link>

      <div className="grid lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2">
          <Gallery seed={v.seed} emojis={emojis} label={v.title} />

          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-600/20 rounded px-2 py-0.5">{TYPE_LABEL[type]}</span>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{v.title}</h1>
              <div className="text-slate-500 dark:text-slate-400 mt-1">{v.sub}</div>
            </div>
            <FavButton className="mt-1 shrink-0"
              item={{ key: `${v.type}-${v.id}`, type: v.type, id: v.id, title: v.title, sub: v.sub, emoji: v.emoji, seed: v.seed, price: v.price, priceLabel: v.priceLabel }} />
          </div>

          <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{longDescription(item, type)}</p>

          <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {facts(item, type).map(([k, val]) => (
              <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-1.5 text-sm">
                <span className="text-slate-400 dark:text-slate-500">{k}</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Что включено</div>
            <div className="flex flex-wrap gap-2">
              {INCLUDED[type].map((f) => (
                <span key={f} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1">✓ {f}</span>
              ))}
            </div>
          </div>

          {type !== 'flight' && <Reviews type={type} id={v.id} />}
        </div>

        <CartPanel view={v} />
      </div>
    </div>
  )
}

function Gallery({ seed, emojis, label }: { seed: string; emojis: string[]; label: string }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <Cover seed={seed} emoji={emojis[active]} label={label}
        className="w-full h-72 rounded-2xl" glyphClass="text-8xl" />
      <div className="flex gap-2 mt-2">
        {emojis.map((e, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`rounded-lg overflow-hidden ring-2 transition ${i === active ? 'ring-brand-500' : 'ring-transparent'}`}>
            <Cover seed={`${seed}-${i}`} emoji={e} className="w-24 h-16" glyphClass="text-2xl" />
          </button>
        ))}
      </div>
    </div>
  )
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }

function CartPanel({ view }: { view: ItemView }) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [dateFrom, setDateFrom] = useState(view.type === 'flight' ? '' : plusDays(7))
  const [dateTo, setDateTo] = useState(view.type === 'hotel' ? plusDays(9) : '')
  const [added, setAdded] = useState(false)

  const soldOut = view.left <= 0
  const rawNights = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000
  const nights = view.type === 'hotel' && Number.isFinite(rawNights) ? Math.max(1, Math.round(rawNights)) : 1
  const total = view.price * qty * nights

  const field = 'mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  const addToCart = () => {
    add({
      key: `${view.type}-${view.id}`, type: view.type, id: view.id, title: view.title, sub: view.sub,
      emoji: view.emoji, seed: view.seed, unitPrice: view.price, priceLabel: view.priceLabel, unit: view.unit,
      qty, max: view.left,
      dateFrom: view.type !== 'flight' ? dateFrom : undefined,
      dateTo: view.type === 'hotel' ? dateTo : undefined,
    })
    setAdded(true)
  }

  return (
    <aside className="lg:sticky lg:top-20 h-fit rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{money(view.price)} ₽</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{view.priceLabel}</div>
      </div>
      <div className={`text-xs mt-1 ${soldOut ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
        {soldOut ? 'мест нет' : `осталось ${view.left} ${view.unit}`}
      </div>

      {view.type === 'hotel' && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <label className="block text-xs text-slate-500 dark:text-slate-400">Заезд
            <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Выезд
            <input type="date" className={field} value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
      )}
      {view.type === 'tour' && (
        <label className="block text-xs text-slate-500 dark:text-slate-400 mt-4">Дата поездки
          <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
      )}

      <label className="block mt-3 text-xs text-slate-500 dark:text-slate-400">Количество ({view.unit})
        <input type="number" min={1} max={Math.max(1, view.left)} value={qty} disabled={soldOut}
          onChange={(e) => setQty(Math.max(1, Math.min(view.left, Number(e.target.value) || 1)))}
          className={`${field} disabled:bg-slate-50`} />
      </label>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">Итого{view.type === 'hotel' ? ` · ${nights} ноч.` : ''}</span>
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{money(total)} ₽</span>
      </div>

      {added ? (
        <div className="mt-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
            Добавлено в корзину ✓
          </div>
          <Link to="/cart" className="block text-center mt-3 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">
            Перейти в корзину →
          </Link>
          <button onClick={() => setAdded(false)} className="w-full mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600">
            Продолжить выбор
          </button>
        </div>
      ) : (
        <button onClick={addToCart} disabled={soldOut}
          className="w-full mt-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
          В корзину
        </button>
      )}
    </aside>
  )
}
