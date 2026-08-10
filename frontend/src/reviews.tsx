/**
 * Отзывы и рейтинг (демо, на стороне клиента): у каждого предложения есть несколько
 * предзаполненных отзывов + добавленные пользователем (localStorage).
 */
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from './auth'
import type { ItemType } from './types'

export interface Review {
  author: string
  rating: number
  text: string
  date: string
}

const KEY = 'voyago_reviews'
const AUTHORS = ['Анна', 'Дмитрий', 'Ольга', 'Сергей', 'Мария', 'Игорь', 'Екатерина', 'Павел']
const TEXTS = [
  'Всё понравилось, обязательно вернёмся!',
  'Отличное соотношение цены и качества.',
  'Чисто, удобно, персонал вежливый.',
  'Приятно удивлены, рекомендуем.',
  'Впечатления только положительные.',
  'Хорошо, но есть куда расти.',
  'Спасибо за отличную организацию!',
  'Всё прошло гладко, без нареканий.',
]
const RATINGS = [5, 5, 4, 5, 4, 5, 5, 4]
const AGO = ['2 недели назад', 'месяц назад', '3 недели назад', 'неделю назад']

function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

function seeded(key: string): Review[] {
  const h = hash(key)
  return [0, 1, 2].map((i) => {
    const idx = (h * (i + 3) + i * 5) % AUTHORS.length
    return { author: AUTHORS[idx], rating: RATINGS[idx], text: TEXTS[(idx + i) % TEXTS.length], date: AGO[(h + i) % AGO.length] }
  })
}

function readUser(): Record<string, Review[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function getReviews(type: ItemType, id: number): Review[] {
  const key = `${type}-${id}`
  const user = readUser()[key] ?? []
  return [...user, ...seeded(key)]
}

export function addReview(type: ItemType, id: number, review: Review): void {
  const key = `${type}-${id}`
  const all = readUser()
  all[key] = [review, ...(all[key] ?? [])]
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function ratingSummary(type: ItemType, id: number): { avg: number; count: number } {
  const list = getReviews(type, id)
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length
  return { avg: Math.round(avg * 10) / 10, count: list.length }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value} из 5`}>
      {'★'.repeat(Math.round(value))}<span className="text-slate-300">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  )
}

export function Reviews({ type, id }: { type: ItemType; id: number }) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [author, setAuthor] = useState(user?.name ?? '')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')

  const list = useMemo(() => getReviews(type, id), [type, id, version])
  const summary = useMemo(() => ratingSummary(type, id), [type, id, version])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !text.trim()) return
    addReview(type, id, { author: author.trim(), rating, text: text.trim(), date: 'только что' })
    setText('')
    setVersion((v) => v + 1)
  }

  const field = 'mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Отзывы</h2>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{summary.avg}</span>
          <Stars value={summary.avg} />
          <span className="text-slate-400 dark:text-slate-500">· {summary.count}</span>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((r, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200">{r.author}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{r.date}</span>
            </div>
            <div className="mt-0.5"><Stars value={r.rating} /></div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{r.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Оставить отзыв</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-500 dark:text-slate-400">Имя
            <input className={field} value={author} onChange={(e) => setAuthor(e.target.value)} required />
          </label>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Оценка
            <select className={field} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mt-3">Комментарий
          <textarea className={field} rows={2} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <button type="submit"
          className="mt-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Отправить
        </button>
      </form>
    </section>
  )
}
