import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Cover, cityEmoji } from '../media'
import { describe, money, type AnyItem, type ItemView } from '../itemView'
import type { ItemType } from '../types'

const TABS = [
  { key: 'flights', label: '✈ Рейсы' },
  { key: 'hotels', label: '🏨 Отели' },
  { key: 'tours', label: '🧭 Туры' },
]

const CATS = [
  { to: '/search/flights', emoji: '✈', title: 'Авиабилеты', text: 'Прямые и удобные рейсы по России.' },
  { to: '/search/hotels', emoji: '🏨', title: 'Отели', text: 'От уютных до 5★ у моря.' },
  { to: '/search/tours', emoji: '🧭', title: 'Туры', text: 'Экскурсии и впечатления на месте.' },
]

const DESTINATIONS = ['Сочи', 'Санкт-Петербург', 'Казань', 'Калининград', 'Екатеринбург', 'Мурманск']

export default function Home() {
  const nav = useNavigate()
  const [tab, setTab] = useState('flights')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [city, setCity] = useState('')
  const [offers, setOffers] = useState<ItemView[]>([])

  useEffect(() => {
    Promise.all([api.listFlights(), api.listHotels(), api.listTours()])
      .then(([f, h, t]) => {
        const pick = (arr: AnyItem[], type: ItemType, n: number) => arr.slice(0, n).map((it) => describe(it, type))
        setOffers([...pick(f, 'flight', 2), ...pick(h, 'hotel', 2), ...pick(t, 'tour', 2)])
      })
      .catch(() => {})
  }, [])

  const search = () => {
    const p = new URLSearchParams()
    if (tab === 'flights') {
      if (from.trim()) p.set('from_city', from.trim())
      if (to.trim()) p.set('to_city', to.trim())
    } else if (city.trim()) {
      p.set('city', city.trim())
    }
    nav(`/search/${tab}?${p.toString()}`)
  }

  const input = 'flex-1 min-w-0 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <>
      <section className="bg-gradient-to-br from-brand-600 to-brand-400 text-white">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Путешествия начинаются здесь</h1>
          <p className="mt-3 text-brand-50 text-lg">Авиабилеты, отели и туры — забронируйте отдых в пару кликов.</p>

          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl text-slate-800 dark:text-slate-100 max-w-3xl">
            <div className="flex gap-1.5 mb-3">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {tab === 'flights' ? (
                <>
                  <input className={input} placeholder="Откуда" value={from} onChange={(e) => setFrom(e.target.value)} />
                  <input className={input} placeholder="Куда" value={to} onChange={(e) => setTo(e.target.value)} />
                </>
              ) : (
                <input className={input} placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
              )}
              <button onClick={search}
                className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-6 py-2.5 rounded-lg shrink-0">
                Найти
              </button>
            </div>
          </div>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-12">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">🔥 Горящие предложения</h2>
          <OffersCarousel offers={offers} />
        </section>
      )}

      <section className="max-w-6xl mx-auto px-5 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">Популярные направления</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DESTINATIONS.map((d) => (
            <Link key={d} to={`/search/hotels?city=${encodeURIComponent(d)}`}
              className="rounded-2xl overflow-hidden hover:shadow-md transition">
              <Cover seed={d} emoji={cityEmoji(d)} label={d} photoSeed={`city-${d}`} className="h-28" glyphClass="text-4xl" />
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-3 gap-5">
        {CATS.map((c) => (
          <Link key={c.to} to={c.to}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 hover:shadow-md hover:border-brand-200 transition">
            <div className="text-3xl mb-3">{c.emoji}</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{c.title}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.text}</div>
          </Link>
        ))}
      </section>
    </>
  )
}

function OffersCarousel({ offers }: { offers: ItemView[] }) {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const count = offers.length

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = setInterval(() => setIdx((i) => (i + 1) % count), 4500)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [count])

  const go = (i: number) => setIdx((i + count) % count)

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {offers.map((o) => (
            <Link key={`${o.type}-${o.id}`} to={o.detailPath} className="w-full shrink-0">
              <div className="relative h-64">
                <Cover seed={o.seed} emoji={o.emoji} photoSeed={`${o.type}-${o.id}`} className="absolute inset-0 w-full h-full" glyphClass="text-7xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <div className="text-xs uppercase tracking-wide opacity-80">Специальное предложение</div>
                  <div className="text-2xl font-bold mt-1">{o.title}</div>
                  <div className="opacity-90">{o.sub}</div>
                  <div className="mt-2 text-lg font-semibold">от {money(o.price)} {o.priceLabel}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <button onClick={() => go(idx - 1)} aria-label="Назад"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 dark:text-slate-200 shadow flex items-center justify-center">‹</button>
      <button onClick={() => go(idx + 1)} aria-label="Вперёд"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 dark:text-slate-200 shadow flex items-center justify-center">›</button>

      <div className="flex justify-center gap-1.5 mt-3">
        {offers.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Слайд ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300'}`} />
        ))}
      </div>
    </div>
  )
}
