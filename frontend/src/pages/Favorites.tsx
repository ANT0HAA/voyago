import { Link } from 'react-router-dom'
import { useFavorites } from '../favorites'
import { Cover } from '../media'
import { money, ROUTE_OF_TYPE } from '../itemView'

export default function Favorites() {
  const { items, remove } = useFavorites()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <div className="text-5xl mb-4">♡</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">В избранном пока пусто</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Нажимайте на сердечко у предложений — и они сохранятся здесь.</p>
        <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Избранное</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((f) => (
          <div key={f.key} className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex flex-col hover:shadow-md transition">
            <div className="relative">
              <Cover seed={f.seed} emoji={f.emoji} className="h-40" glyphClass="text-5xl" />
              <button onClick={() => remove(f.key)} aria-label="Убрать из избранного"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-rose-500">♥</button>
            </div>
            <Link to={`/${ROUTE_OF_TYPE[f.type]}/${f.id}`} className="p-4 flex flex-col flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-100">{f.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{f.sub}</div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-end justify-between">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{money(f.price)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{f.priceLabel}</span></div>
                <span className="text-sm font-medium text-brand-600">Подробнее →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
