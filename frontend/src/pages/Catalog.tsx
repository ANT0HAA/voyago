import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { Cover } from '../media'
import { describe, money, TYPE_OF_ROUTE, type AnyItem } from '../itemView'
import type { Flight, Hotel, Tour } from '../types'

const TITLES: Record<string, string> = { flights: 'Рейсы', hotels: 'Отели', tours: 'Туры' }

type Sort = 'price' | '-price' | 'time'
interface FilterState {
  from: string; to: string; city: string
  date: string; minStars: number; duration: string
  maxPrice: number; sort: Sort
}

const priceOf = (item: AnyItem, type: string) =>
  type === 'hotel' ? (item as Hotel).price_per_night : (item as Flight | Tour).price

export default function Catalog() {
  const { type = 'flights' } = useParams()
  const [sp] = useSearchParams()
  const itemType = TYPE_OF_ROUTE[type] ?? 'flight'

  const [items, setItems] = useState<AnyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const maxAvailable = useMemo(
    () => items.reduce((m, it) => Math.max(m, priceOf(it, itemType)), 0),
    [items, itemType],
  )

  const [filters, setFilters] = useState<FilterState>({
    from: '', to: '', city: '', date: '', minStars: 0, duration: 'any', maxPrice: 0, sort: 'price',
  })

  // Первичная загрузка + инициализация фильтров из параметров поиска (с главной).
  useEffect(() => {
    setLoading(true)
    setError(null)
    const load = itemType === 'hotel' ? api.listHotels() : itemType === 'tour' ? api.listTours() : api.listFlights()
    load.then((data) => {
      setItems(data as AnyItem[])
      const top = (data as AnyItem[]).reduce((m, it) => Math.max(m, priceOf(it, itemType)), 0)
      setFilters({
        from: sp.get('from_city') ?? '', to: sp.get('to_city') ?? '', city: sp.get('city') ?? '',
        date: '', minStars: 0, duration: 'any', maxPrice: top, sort: 'price',
      })
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const set = <K extends keyof FilterState>(k: K, val: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [k]: val }))

  const visible = useMemo(() => {
    const inc = (hay: string, needle: string) => !needle || hay.toLowerCase().includes(needle.toLowerCase())
    let list = items.filter((item) => {
      const p = priceOf(item, itemType)
      if (filters.maxPrice && p > filters.maxPrice) return false
      if (itemType === 'flight') {
        const f = item as Flight
        if (!inc(f.from_city, filters.from) || !inc(f.to_city, filters.to)) return false
        if (filters.date && f.departure.slice(0, 10) < filters.date) return false
      } else if (itemType === 'hotel') {
        const h = item as Hotel
        if (!inc(h.city, filters.city) || h.stars < filters.minStars) return false
      } else {
        const t = item as Tour
        if (!inc(t.city, filters.city)) return false
        if (filters.duration === '1' && t.duration_days !== 1) return false
        if (filters.duration === 'multi' && t.duration_days < 2) return false
      }
      return true
    })
    list = list.slice().sort((a, b) => {
      if (filters.sort === 'time' && itemType === 'flight') {
        return (a as Flight).departure.localeCompare((b as Flight).departure)
      }
      const pa = priceOf(a, itemType), pb = priceOf(b, itemType)
      return filters.sort === '-price' ? pb - pa : pa - pb
    })
    return list
  }, [items, filters, itemType])

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">{TITLES[type] ?? 'Каталог'}</h1>
      <p className="text-slate-500 mb-6">{visible.length} из {items.length} предложений</p>

      {error && <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Filters type={itemType} filters={filters} set={set} maxAvailable={maxAvailable} />

        <div>
          {loading && <p className="text-slate-400">Загрузка…</p>}
          {!loading && visible.length === 0 && <p className="text-slate-400">Ничего не найдено — измените фильтры.</p>}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((item) => {
              const v = describe(item, itemType)
              const soldOut = v.left <= 0
              return (
                <Link key={item.id} to={v.detailPath}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col hover:shadow-md hover:border-brand-200 transition">
                  <Cover seed={v.seed} emoji={v.emoji} className="h-40" glyphClass="text-5xl" />
                  <div className="p-4 flex flex-col flex-1">
                    <div className="font-semibold text-slate-800">{v.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{v.sub}</div>
                    {v.desc && <div className="text-sm text-slate-500 mt-2 line-clamp-2">{v.desc}</div>}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <div className="text-lg font-bold text-slate-800">{money(v.price)} <span className="text-xs font-normal text-slate-400">{v.priceLabel}</span></div>
                        <div className={`text-xs mt-0.5 ${soldOut ? 'text-rose-500' : 'text-slate-400'}`}>
                          {soldOut ? 'мест нет' : `осталось ${v.left} ${v.unit}`}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-brand-600">Подробнее →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Filters({ type, filters, set, maxAvailable }: {
  type: 'flight' | 'hotel' | 'tour'
  filters: FilterState
  set: <K extends keyof FilterState>(k: K, val: FilterState[K]) => void
  maxAvailable: number
}) {
  const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit lg:sticky lg:top-20 space-y-4">
      <div className="font-semibold text-slate-700 text-sm">Фильтры</div>

      {type === 'flight' && (
        <>
          <label className="block text-xs text-slate-500">Откуда
            <input className={input} value={filters.from} onChange={(e) => set('from', e.target.value)} placeholder="Город вылета" />
          </label>
          <label className="block text-xs text-slate-500">Куда
            <input className={input} value={filters.to} onChange={(e) => set('to', e.target.value)} placeholder="Город прилёта" />
          </label>
          <label className="block text-xs text-slate-500">Дата вылета (от)
            <input type="date" className={input} value={filters.date} onChange={(e) => set('date', e.target.value)} />
          </label>
        </>
      )}

      {(type === 'hotel' || type === 'tour') && (
        <label className="block text-xs text-slate-500">Город
          <input className={input} value={filters.city} onChange={(e) => set('city', e.target.value)} placeholder="Любой город" />
        </label>
      )}

      {type === 'hotel' && (
        <label className="block text-xs text-slate-500">Минимум звёзд
          <select className={input} value={filters.minStars} onChange={(e) => set('minStars', Number(e.target.value))}>
            <option value={0}>Любые</option>
            <option value={3}>3★ и выше</option>
            <option value={4}>4★ и выше</option>
            <option value={5}>только 5★</option>
          </select>
        </label>
      )}

      {type === 'tour' && (
        <label className="block text-xs text-slate-500">Длительность
          <select className={input} value={filters.duration} onChange={(e) => set('duration', e.target.value)}>
            <option value="any">Любая</option>
            <option value="1">Однодневные</option>
            <option value="multi">Многодневные</option>
          </select>
        </label>
      )}

      {maxAvailable > 0 && (
        <label className="block text-xs text-slate-500">
          Цена до: <b className="text-slate-700">{money(filters.maxPrice)} ₽</b>
          <input type="range" min={0} max={maxAvailable} step={100} value={filters.maxPrice}
            onChange={(e) => set('maxPrice', Number(e.target.value))} className="mt-1 w-full accent-brand-600" />
        </label>
      )}

      <label className="block text-xs text-slate-500">Сортировка
        <select className={input} value={filters.sort} onChange={(e) => set('sort', e.target.value as Sort)}>
          <option value="price">Сначала дешевле</option>
          <option value="-price">Сначала дороже</option>
          {type === 'flight' && <option value="time">По времени вылета</option>}
        </select>
      </label>
    </aside>
  )
}
