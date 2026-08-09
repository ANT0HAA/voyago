/** Единое описание предложения для карточек, обложек и страницы деталей. */
import type { Flight, Hotel, ItemType, Tour } from './types'
import { coverEmoji } from './media'

export type AnyItem = Flight | Hotel | Tour

export const TYPE_OF_ROUTE: Record<string, ItemType> = { flights: 'flight', hotels: 'hotel', tours: 'tour' }
export const ROUTE_OF_TYPE: Record<ItemType, string> = { flight: 'flights', hotel: 'hotels', tour: 'tours' }
export const TYPE_LABEL: Record<ItemType, string> = { flight: 'Рейс', hotel: 'Отель', tour: 'Тур' }

export const money = (n: number) => n.toLocaleString('ru-RU')
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

export interface ItemView {
  id: number
  type: ItemType
  title: string
  sub: string
  city: string
  price: number
  priceLabel: string
  left: number
  unit: string
  desc?: string
  emoji: string
  seed: string
  detailPath: string
}

export function describe(item: AnyItem, type: ItemType): ItemView {
  const base = { id: item.id, type, detailPath: `/${ROUTE_OF_TYPE[type]}/${item.id}` }
  if (type === 'flight') {
    const f = item as Flight
    return {
      ...base, title: `${f.from_city} → ${f.to_city}`, sub: `${f.airline} · ${fmtDateTime(f.departure)}`,
      city: f.to_city, price: f.price, priceLabel: '₽ за место', left: f.seats_left, unit: 'мест',
      emoji: coverEmoji('flight'), seed: f.to_city,
    }
  }
  if (type === 'hotel') {
    const h = item as Hotel
    return {
      ...base, title: h.name, sub: `${h.city} · ${'★'.repeat(h.stars)}`, city: h.city,
      price: h.price_per_night, priceLabel: '₽ за ночь', left: h.rooms_left, unit: 'номеров',
      desc: h.description, emoji: coverEmoji('hotel', h.city), seed: h.city,
    }
  }
  const t = item as Tour
  return {
    ...base, title: t.title, sub: `${t.city} · ${t.duration_days} дн.`, city: t.city,
    price: t.price, priceLabel: '₽ с человека', left: t.spots_left, unit: 'мест',
    desc: t.description, emoji: coverEmoji('tour', t.city), seed: t.city,
  }
}
