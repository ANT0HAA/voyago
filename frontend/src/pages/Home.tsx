import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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

export default function Home() {
  const nav = useNavigate()
  const [tab, setTab] = useState('flights')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [city, setCity] = useState('')

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

  const input = 'flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <>
      <section className="bg-gradient-to-br from-brand-600 to-brand-400 text-white">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Путешествия начинаются здесь</h1>
          <p className="mt-3 text-brand-50 text-lg">Авиабилеты, отели и туры — забронируйте отдых в пару кликов.</p>

          <div className="mt-8 bg-white rounded-2xl p-4 shadow-xl text-slate-800 max-w-3xl">
            <div className="flex gap-1.5 mb-3">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
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

      <section className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-3 gap-5">
        {CATS.map((c) => (
          <Link key={c.to} to={c.to}
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-brand-200 transition">
            <div className="text-3xl mb-3">{c.emoji}</div>
            <div className="font-semibold text-slate-800">{c.title}</div>
            <div className="text-sm text-slate-500 mt-1">{c.text}</div>
          </Link>
        ))}
      </section>
    </>
  )
}
