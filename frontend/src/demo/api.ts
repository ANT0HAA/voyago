/**
 * Клиентский «бэкенд» для демо-режима (GitHub Pages): весь API работает прямо в браузере
 * на данных из localStorage. Полная версия с FastAPI — в каталоге backend/.
 */
import type { Booking, Flight, Hotel, Stats, Tour, User } from '../types'
import { freshDB, type DemoDB } from './data'

const DB_KEY = 'voyago_demo_db'
const TOKEN_KEY = 'voyago_token'

function load(): DemoDB {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    try { return JSON.parse(raw) as DemoDB } catch { /* пересоздадим ниже */ }
  }
  const db = freshDB()
  save(db)
  return db
}

function save(db: DemoDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function demoReset(): void {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

const publicUser = ({ password, ...u }: DemoDB['users'][number]): User => u

function currentUserId(): number | null {
  const t = getToken()
  if (!t || !t.startsWith('demo:')) return null
  const id = Number(t.slice(5))
  return Number.isFinite(id) ? id : null
}

function requireUser(db: DemoDB): DemoDB['users'][number] {
  const id = currentUserId()
  const user = id != null ? db.users.find((u) => u.id === id) : undefined
  if (!user) throw new Error('Не авторизованы')
  return user
}

function requireAdmin(db: DemoDB): DemoDB['users'][number] {
  const user = requireUser(db)
  if (user.role !== 'admin') throw new Error('Требуются права администратора')
  return user
}

// имитируем сетевую задержку, чтобы спиннеры/состояния были видны
const delay = <T>(value: T): Promise<T> => new Promise((res) => setTimeout(() => res(value), 180))

const contains = (hay: string, needle?: string) =>
  !needle || hay.toLowerCase().includes(needle.toLowerCase())

const LEFT = { flight: 'seats_left', hotel: 'rooms_left', tour: 'spots_left' } as const
const LIST = { flight: 'flights', hotel: 'hotels', tour: 'tours' } as const
type ItemType = keyof typeof LEFT

function findItem(db: DemoDB, type: ItemType, id: number): Flight | Hotel | Tour | undefined {
  return (db[LIST[type]] as (Flight | Hotel | Tour)[]).find((x) => x.id === id)
}

function unitPrice(item: Flight | Hotel | Tour, type: ItemType): number {
  return type === 'hotel' ? (item as Hotel).price_per_night : (item as Flight | Tour).price
}

function titleOf(item: Flight | Hotel | Tour, type: ItemType): string {
  if (type === 'flight') {
    const f = item as Flight
    return `${f.airline}: ${f.from_city} → ${f.to_city}`
  }
  if (type === 'hotel') {
    const h = item as Hotel
    return `${h.name} (${h.city}, ${h.stars}★)`
  }
  const t = item as Tour
  return `${t.title} (${t.city})`
}

export const demoApi = {
  register: (email: string, name: string, password: string) => {
    const db = load()
    if (db.users.some((u) => u.email === email)) throw new Error('Пользователь с таким email уже существует')
    const id = Math.max(0, ...db.users.map((u) => u.id)) + 1
    const user = { id, email, name, role: 'user', password }
    db.users.push(user)
    save(db)
    return delay({ access_token: `demo:${id}`, user: publicUser(user) })
  },

  login: (email: string, password: string) => {
    const db = load()
    const user = db.users.find((u) => u.email === email && u.password === password)
    if (!user) throw new Error('Неверный email или пароль')
    return delay({ access_token: `demo:${user.id}`, user: publicUser(user) })
  },

  me: () => {
    const db = load()
    const user = requireUser(db)
    return delay(publicUser(user))
  },

  listFlights: (p: Record<string, string> = {}) => {
    const db = load()
    return delay(db.flights.filter((f) => contains(f.from_city, p.from_city) && contains(f.to_city, p.to_city)))
  },
  listHotels: (p: Record<string, string> = {}) => {
    const db = load()
    return delay(db.hotels.filter((h) => contains(h.city, p.city)))
  },
  listTours: (p: Record<string, string> = {}) => {
    const db = load()
    return delay(db.tours.filter((t) => contains(t.city, p.city)))
  },

  getFlight: (id: number) => {
    const db = load()
    const item = db.flights.find((f) => f.id === id)
    if (!item) throw new Error('Рейс не найден')
    return delay(item)
  },
  getHotel: (id: number) => {
    const db = load()
    const item = db.hotels.find((h) => h.id === id)
    if (!item) throw new Error('Отель не найден')
    return delay(item)
  },
  getTour: (id: number) => {
    const db = load()
    const item = db.tours.find((t) => t.id === id)
    if (!item) throw new Error('Тур не найден')
    return delay(item)
  },

  book: (itemType: string, itemId: number, quantity: number) => {
    const db = load()
    const user = requireUser(db)
    const type = itemType as ItemType
    const item = findItem(db, type, itemId)
    if (!item) throw new Error('Предложение не найдено')
    const leftAttr = LEFT[type]
    const left = (item as unknown as Record<string, number>)[leftAttr]
    if (left < quantity) throw new Error(`Недостаточно мест — осталось ${left}`)
    ;(item as unknown as Record<string, number>)[leftAttr] = left - quantity
    const booking: Booking = {
      id: db.seqBooking++, item_type: type, item_id: itemId, title: titleOf(item, type),
      quantity, total_price: Math.round(unitPrice(item, type) * quantity * 100) / 100,
      status: 'confirmed', created_at: new Date().toISOString(),
    }
    // сохраняем «владельца» брони для фильтра «Мои брони»
    ownerOf[booking.id] = user.id
    db.bookings.push(booking)
    saveOwners(db)
    save(db)
    return delay(booking)
  },

  myBookings: () => {
    const db = load()
    const user = requireUser(db)
    return delay(db.bookings.filter((b) => (ownerOf[b.id] ?? 2) === user.id).slice().reverse())
  },

  cancel: (id: number) => {
    const db = load()
    requireUser(db)
    const booking = db.bookings.find((b) => b.id === id)
    if (!booking) throw new Error('Бронь не найдена')
    if (booking.status === 'cancelled') throw new Error('Бронь уже отменена')
    booking.status = 'cancelled'
    const item = findItem(db, booking.item_type as ItemType, booking.item_id)
    if (item) {
      const leftAttr = LEFT[booking.item_type as ItemType]
      ;(item as unknown as Record<string, number>)[leftAttr] += booking.quantity
    }
    save(db)
    return delay(booking)
  },

  adminStats: (): Promise<Stats> => {
    const db = load()
    requireAdmin(db)
    const active = db.bookings.filter((b) => b.status === 'confirmed')
    return delay({
      users: db.users.length, flights: db.flights.length, hotels: db.hotels.length,
      tours: db.tours.length, bookings_active: active.length,
      revenue: Math.round(active.reduce((s, b) => s + b.total_price, 0) * 100) / 100,
    })
  },

  adminBookings: () => {
    const db = load()
    requireAdmin(db)
    return delay(db.bookings.slice().reverse())
  },

  adminCreate: (type: string, data: Record<string, unknown>) => {
    const db = load()
    requireAdmin(db)
    const t = type as ItemType
    const obj = buildItem(db, t, data, null)
    ;(db[LIST[t]] as unknown[]).push(obj)
    save(db)
    return delay(obj)
  },

  adminUpdate: (type: string, id: number, data: Record<string, unknown>) => {
    const db = load()
    requireAdmin(db)
    const t = type as ItemType
    const existing = findItem(db, t, id)
    if (!existing) throw new Error('Не найдено')
    const updated = buildItem(db, t, data, existing)
    const list = db[LIST[t]] as (Flight | Hotel | Tour)[]
    const idx = list.findIndex((x) => x.id === id)
    list[idx] = updated
    save(db)
    return delay(updated)
  },

  adminDelete: (type: string, id: number) => {
    const db = load()
    requireAdmin(db)
    const t = type as ItemType
    const list = db[LIST[t]] as (Flight | Hotel | Tour)[]
    const idx = list.findIndex((x) => x.id === id)
    if (idx >= 0) list.splice(idx, 1)
    save(db)
    return delay(undefined as unknown as void)
  },
}

// ── владельцы броней (в отдельном ключе, чтобы не менять форму Booking) ──────────
const OWNERS_KEY = 'voyago_demo_owners'
const ownerOf: Record<number, number> = (() => {
  try { return JSON.parse(localStorage.getItem(OWNERS_KEY) || '{}') } catch { return {} }
})()
function saveOwners(_db: DemoDB): void {
  localStorage.setItem(OWNERS_KEY, JSON.stringify(ownerOf))
}

/** Собирает Flight/Hotel/Tour из данных формы админки; сохраняет проданные места при правке. */
function buildItem(db: DemoDB, type: ItemType, data: Record<string, unknown>,
                   existing: Flight | Hotel | Tour | null): Flight | Hotel | Tour {
  const num = (k: string) => Number(data[k])
  const str = (k: string) => String(data[k] ?? '')
  if (type === 'flight') {
    const total = num('seats_total')
    const booked = existing ? (existing as Flight).seats_total - (existing as Flight).seats_left : 0
    return {
      id: existing ? existing.id : db.seqFlight++,
      airline: str('airline'), from_city: str('from_city'), to_city: str('to_city'),
      departure: str('departure'), arrival: str('arrival'),
      price: num('price'), seats_total: total, seats_left: Math.max(0, total - booked),
    }
  }
  if (type === 'hotel') {
    const total = num('rooms_total')
    const booked = existing ? (existing as Hotel).rooms_total - (existing as Hotel).rooms_left : 0
    return {
      id: existing ? existing.id : db.seqHotel++,
      name: str('name'), city: str('city'), stars: num('stars'),
      price_per_night: num('price_per_night'), rooms_total: total,
      rooms_left: Math.max(0, total - booked), description: str('description'),
    }
  }
  const total = num('spots_total')
  const booked = existing ? (existing as Tour).spots_total - (existing as Tour).spots_left : 0
  return {
    id: existing ? existing.id : db.seqTour++,
    title: str('title'), city: str('city'), duration_days: num('duration_days'),
    price: num('price'), spots_total: total,
    spots_left: Math.max(0, total - booked), description: str('description'),
  }
}
