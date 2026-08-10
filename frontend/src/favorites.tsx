import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ItemType } from './types'

export interface FavItem {
  key: string
  type: ItemType
  id: number
  title: string
  sub: string
  emoji: string
  seed: string
  price: number
  priceLabel: string
}

interface FavValue {
  items: FavItem[]
  count: number
  has: (key: string) => boolean
  toggle: (item: FavItem) => void
  remove: (key: string) => void
}

const KEY = 'voyago_favs'
const FavContext = createContext<FavValue | null>(null)

export function useFavorites(): FavValue {
  const ctx = useContext(FavContext)
  if (!ctx) throw new Error('useFavorites должен использоваться внутри FavoritesProvider')
  return ctx
}

function load(): FavItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as FavItem[]) : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavItem[]>(load)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)) }, [items])

  const value = useMemo<FavValue>(() => ({
    items,
    count: items.length,
    has: (key) => items.some((i) => i.key === key),
    toggle: (item) => setItems((prev) =>
      prev.some((i) => i.key === item.key) ? prev.filter((i) => i.key !== item.key) : [...prev, item]),
    remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
  }), [items])

  return <FavContext.Provider value={value}>{children}</FavContext.Provider>
}

/** Кнопка-сердечко; безопасна поверх ссылок (гасит переход). */
export function FavButton({ item, className = '' }: { item: FavItem; className?: string }) {
  const { has, toggle } = useFavorites()
  const active = has(item.key)
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item) }}
      aria-label={active ? 'Убрать из избранного' : 'В избранное'}
      className={`w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-base leading-none ${className}`}
    >
      <span className={active ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}>{active ? '♥' : '♡'}</span>
    </button>
  )
}
