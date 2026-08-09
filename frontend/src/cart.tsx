import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ItemType } from './types'

export interface CartItem {
  key: string          // `${type}-${id}`
  type: ItemType
  id: number
  title: string
  sub: string
  emoji: string
  seed: string
  unitPrice: number
  priceLabel: string
  unit: string
  qty: number
  max: number          // доступность (мест/номеров)
  dateFrom?: string
  dateTo?: string
}

const KEY = 'voyago_cart'

export function nightsOf(item: CartItem): number {
  if (item.type !== 'hotel' || !item.dateFrom || !item.dateTo) return 1
  const days = (new Date(item.dateTo).getTime() - new Date(item.dateFrom).getTime()) / 86400000
  return Number.isFinite(days) ? Math.max(1, Math.round(days)) : 1
}

export function lineTotal(item: CartItem): number {
  return Math.round(item.unitPrice * item.qty * nightsOf(item) * 100) / 100
}

interface CartValue {
  items: CartItem[]
  count: number
  total: number
  add: (item: CartItem) => void
  remove: (key: string) => void
  update: (key: string, patch: Partial<CartItem>) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

export function useCart(): CartValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart должен использоваться внутри CartProvider')
  return ctx
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)) }, [items])

  const add = (item: CartItem) => setItems((prev) => {
    const found = prev.find((p) => p.key === item.key)
    if (found) {
      return prev.map((p) => p.key === item.key
        ? { ...p, qty: Math.min(p.max, p.qty + item.qty), dateFrom: item.dateFrom, dateTo: item.dateTo }
        : p)
    }
    return [...prev, item]
  })

  const remove = (key: string) => setItems((prev) => prev.filter((p) => p.key !== key))
  const update = (key: string, patch: Partial<CartItem>) =>
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  const clear = () => setItems([])

  const value = useMemo<CartValue>(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + lineTotal(i), 0),
    add, remove, update, clear,
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
