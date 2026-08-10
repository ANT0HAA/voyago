import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Booking, Flight, Hotel, Stats, Tour } from '../types'

type ManageType = 'flight' | 'hotel' | 'tour'
type Tab = ManageType | 'bookings'
type AnyItem = Flight | Hotel | Tour
type FieldType = 'text' | 'number' | 'datetime' | 'textarea'
interface Field { key: string; label: string; type: FieldType; min?: number; max?: number }

const money = (n: number) => n.toLocaleString('ru-RU')

const FIELDS: Record<ManageType, Field[]> = {
  flight: [
    { key: 'airline', label: 'Авиакомпания', type: 'text' },
    { key: 'from_city', label: 'Откуда', type: 'text' },
    { key: 'to_city', label: 'Куда', type: 'text' },
    { key: 'departure', label: 'Вылет', type: 'datetime' },
    { key: 'arrival', label: 'Прилёт', type: 'datetime' },
    { key: 'price', label: 'Цена, ₽', type: 'number', min: 1 },
    { key: 'seats_total', label: 'Всего мест', type: 'number', min: 1 },
  ],
  hotel: [
    { key: 'name', label: 'Название', type: 'text' },
    { key: 'city', label: 'Город', type: 'text' },
    { key: 'stars', label: 'Звёзды (1–5)', type: 'number', min: 1, max: 5 },
    { key: 'price_per_night', label: 'Цена за ночь, ₽', type: 'number', min: 1 },
    { key: 'rooms_total', label: 'Всего номеров', type: 'number', min: 1 },
    { key: 'description', label: 'Описание', type: 'textarea' },
  ],
  tour: [
    { key: 'title', label: 'Название', type: 'text' },
    { key: 'city', label: 'Город', type: 'text' },
    { key: 'duration_days', label: 'Длительность, дней', type: 'number', min: 1 },
    { key: 'price', label: 'Цена, ₽', type: 'number', min: 1 },
    { key: 'spots_total', label: 'Всего мест', type: 'number', min: 1 },
    { key: 'description', label: 'Описание', type: 'textarea' },
  ],
}

const TAB_LABEL: Record<Tab, string> = { flight: 'Рейсы', hotel: 'Отели', tour: 'Туры', bookings: 'Брони' }

interface Row { main: string; sub: string; price: number; left: number; total: number }
function rowView(type: ManageType, item: AnyItem): Row {
  if (type === 'flight') {
    const f = item as Flight
    return { main: `${f.from_city} → ${f.to_city}`, sub: f.airline, price: f.price, left: f.seats_left, total: f.seats_total }
  }
  if (type === 'hotel') {
    const h = item as Hotel
    return { main: h.name, sub: `${h.city} · ${'★'.repeat(h.stars)}`, price: h.price_per_night, left: h.rooms_left, total: h.rooms_total }
  }
  const t = item as Tour
  return { main: t.title, sub: `${t.city} · ${t.duration_days} дн.`, price: t.price, left: t.spots_left, total: t.spots_total }
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('flight')
  const [stats, setStats] = useState<Stats | null>(null)

  const loadStats = () => { api.adminStats().then(setStats).catch(() => {}) }
  useEffect(loadStats, [])

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Панель администратора</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Пользователи" value={stats.users} />
          <StatCard label="Рейсы" value={stats.flights} />
          <StatCard label="Отели" value={stats.hotels} />
          <StatCard label="Туры" value={stats.tours} />
          <StatCard label="Активные брони" value={stats.bookings_active} />
          <StatCard label="Выручка, ₽" value={money(stats.revenue)} />
        </div>
      )}

      <div className="flex gap-1.5 mb-5 border-b border-slate-200 dark:border-slate-700">
        {(['flight', 'hotel', 'tour', 'bookings'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'bookings' ? <BookingsTable /> : <Manage type={tab} onChange={loadStats} />}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}

function Manage({ type, onChange }: { type: ManageType; onChange: () => void }) {
  const [items, setItems] = useState<AnyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AnyItem | 'new' | null>(null)

  const load = () => {
    setLoading(true)
    const p = type === 'hotel' ? api.listHotels() : type === 'tour' ? api.listTours() : api.listFlights()
    p.then((d) => setItems(d as AnyItem[])).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [type])

  const remove = async (id: number) => {
    try {
      await api.adminDelete(type, id)
      load(); onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить')
    }
  }

  const saved = () => { setEditing(null); load(); onChange() }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setEditing('new')}
          className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Добавить
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 text-sm">{error}</div>}
      {loading && <p className="text-slate-400 dark:text-slate-500">Загрузка…</p>}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Название</th>
              <th className="px-4 py-2.5 font-medium">Цена</th>
              <th className="px-4 py-2.5 font-medium">Свободно</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const v = rowView(type, item)
              return (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{v.main}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{v.sub}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{money(v.price)} ₽</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{v.left} / {v.total}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(item)} className="text-brand-600 hover:underline mr-3">Изменить</button>
                    <button onClick={() => remove(item.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600">Удалить</button>
                  </td>
                </tr>
              )
            })}
            {!loading && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">Пусто</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditorModal type={type} item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={saved} />
      )}
    </div>
  )
}

function EditorModal({ type, item, onClose, onSaved }: {
  type: ManageType; item: AnyItem | null; onClose: () => void; onSaved: () => void
}) {
  const fields = FIELDS[type]
  const initial: Record<string, string> = {}
  for (const f of fields) {
    const raw = item ? (item as unknown as Record<string, unknown>)[f.key] : ''
    initial[f.key] = f.type === 'datetime' && typeof raw === 'string' ? raw.slice(0, 16) : raw == null ? '' : String(raw)
  }
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }))

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      for (const f of fields) {
        payload[f.key] = f.type === 'number' ? Number(values[f.key]) : values[f.key]
      }
      if (item) await api.adminUpdate(type, item.id, payload)
      else await api.adminCreate(type, payload)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = 'mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {item ? 'Изменить' : 'Добавить'} · {TAB_LABEL[type]}
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map((f) => (
            <label key={f.key} className="block text-sm text-slate-600 dark:text-slate-300">
              {f.label}
              {f.type === 'textarea' ? (
                <textarea className={inputCls} rows={2} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <input className={inputCls}
                  type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                  min={f.min} max={f.max}
                  value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800">Отмена</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = { flight: 'Рейс', hotel: 'Отель', tour: 'Тур' }

function BookingsTable() {
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.adminBookings().then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-left">
          <tr>
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Тип</th>
            <th className="px-4 py-2.5 font-medium">Предложение</th>
            <th className="px-4 py-2.5 font-medium">Кол-во</th>
            <th className="px-4 py-2.5 font-medium">Сумма</th>
            <th className="px-4 py-2.5 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="border-t border-slate-100 dark:border-slate-700">
              <td className="px-4 py-2.5 text-slate-400 dark:text-slate-500">{b.id}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{TYPE_LABEL[b.item_type] ?? b.item_type}</td>
              <td className="px-4 py-2.5 text-slate-800 dark:text-slate-100">{b.title}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{b.quantity}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{money(b.total_price)} ₽</td>
              <td className="px-4 py-2.5">
                <span className={b.status === 'confirmed' ? 'text-emerald-600' : 'text-rose-500'}>
                  {b.status === 'confirmed' ? 'активна' : 'отменена'}
                </span>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">Броней нет</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
