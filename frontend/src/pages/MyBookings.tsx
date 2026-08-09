import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Booking } from '../types'

const TYPE_LABEL: Record<string, string> = { flight: 'Рейс', hotel: 'Отель', tour: 'Тур' }
const money = (n: number) => n.toLocaleString('ru-RU')
const when = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

export default function MyBookings() {
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.myBookings().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const cancel = async (id: number) => {
    setBusyId(id)
    try {
      await api.cancel(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отменить')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Мои брони</h1>

      {error && <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 text-sm">{error}</div>}
      {loading && <p className="text-slate-400">Загрузка…</p>}
      {!loading && items.length === 0 && (
        <p className="text-slate-400">У вас пока нет бронирований.</p>
      )}

      <div className="space-y-3">
        {items.map((b) => {
          const cancelled = b.status !== 'confirmed'
          return (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 rounded px-2 py-0.5">{TYPE_LABEL[b.item_type] ?? b.item_type}</span>
                  <span className="font-semibold text-slate-800">{b.title}</span>
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {b.quantity} × · оформлено {when(b.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{money(b.total_price)} ₽</div>
                {cancelled ? (
                  <span className="text-xs text-rose-500">отменено</span>
                ) : (
                  <button onClick={() => cancel(b.id)} disabled={busyId === b.id}
                    className="text-xs text-slate-400 hover:text-rose-600 disabled:opacity-40 mt-1">
                    {busyId === b.id ? 'Отменяю…' : 'Отменить'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
