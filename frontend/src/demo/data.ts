import type { Booking, Flight, Hotel, Tour, User } from '../types'

export type DemoUser = User & { password: string }

export interface DemoDB {
  flights: Flight[]
  hotels: Hotel[]
  tours: Tour[]
  users: DemoUser[]
  bookings: Booking[]
  seqFlight: number
  seqHotel: number
  seqTour: number
  seqBooking: number
}

/** ISO-время: сегодня + смещение в днях, заданный час (локальное время). */
function at(dayOffset: number, hour: number): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString()
}

// (авиакомпания, откуда, куда, день_вылета, час_вылета, день_прилёта, час_прилёта, цена, мест)
const RAW_FLIGHTS: [string, string, string, number, number, number, number, number, number][] = [
  ['Аэрофлот', 'Москва', 'Сочи', 2, 9, 2, 12, 6500, 180],
  ['S7', 'Москва', 'Казань', 3, 7, 3, 9, 4800, 150],
  ['Победа', 'Санкт-Петербург', 'Сочи', 4, 6, 4, 10, 5900, 189],
  ['Уральские авиалинии', 'Екатеринбург', 'Сочи', 5, 10, 5, 14, 7200, 160],
  ['Аэрофлот', 'Москва', 'Калининград', 2, 14, 2, 16, 5400, 170],
  ['S7', 'Новосибирск', 'Москва', 6, 8, 6, 12, 9800, 200],
  ['Аэрофлот', 'Москва', 'Санкт-Петербург', 1, 19, 1, 20, 3900, 190],
  ['Победа', 'Москва', 'Краснодар', 3, 11, 3, 13, 4300, 189],
  ['Россия', 'Санкт-Петербург', 'Казань', 4, 15, 4, 17, 5100, 140],
  ['Аэрофлот', 'Москва', 'Минеральные Воды', 5, 12, 5, 15, 6100, 175],
  ['S7', 'Москва', 'Владивосток', 7, 21, 8, 9, 18900, 250],
  ['Уральские авиалинии', 'Екатеринбург', 'Москва', 2, 7, 2, 8, 5200, 160],
  ['Аэрофлот', 'Москва', 'Мурманск', 6, 13, 6, 15, 6700, 165],
  ['S7', 'Москва', 'Уфа', 3, 16, 3, 18, 4600, 150],
]

// (название, город, звёзды, цена_за_ночь, номеров, описание)
const RAW_HOTELS: [string, string, number, number, number, string][] = [
  ['Гранд Отель Сочи', 'Сочи', 5, 9500, 40, '5★ у моря, бассейн, спа.'],
  ['Приморская', 'Сочи', 3, 4200, 60, 'Уютный отель в центре, 5 минут до пляжа.'],
  ['Казань Палас', 'Казань', 4, 5600, 35, 'Исторический центр, вид на Кремль.'],
  ['Балтика', 'Калининград', 4, 4800, 50, 'Рядом с Куршской косой.'],
  ['Сибирь', 'Новосибирск', 3, 3500, 45, 'Бизнес-отель у вокзала.'],
  ['Астория', 'Санкт-Петербург', 5, 12000, 30, 'Легендарный отель на Исаакиевской площади.'],
  ['Невский Бриз', 'Санкт-Петербург', 3, 5200, 55, 'В шаге от Невского проспекта.'],
  ['Екатеринбург Центральный', 'Екатеринбург', 4, 4600, 40, 'В центре, рядом с Плотинкой.'],
  ['Роза Хутор Резорт', 'Сочи', 4, 8700, 48, 'Горнолыжный курорт Красной Поляны.'],
  ['Азимут Мурманск', 'Мурманск', 3, 3900, 42, 'Северное сияние и виды на залив.'],
]

// (название, город, дней, цена, мест, описание)
const RAW_TOURS: [string, string, number, number, number, string][] = [
  ['Красная Поляна: канатки и горы', 'Сочи', 1, 3500, 30, 'Подъём на 2320 м, панорамы Кавказа.'],
  ['Кремль и старый город', 'Казань', 1, 2200, 25, 'Пешеходная экскурсия с гидом.'],
  ['Куршская коса', 'Калининград', 1, 2800, 20, 'Дюны, танцующий лес, орнитостанция.'],
  ['Олимпийский парк вечером', 'Сочи', 1, 1800, 40, 'Поющие фонтаны и набережная.'],
  ['Эрмитаж и Дворцовая', 'Санкт-Петербург', 1, 2600, 22, 'Главный музей и центр Петербурга.'],
  ['Разводные мосты ночью', 'Санкт-Петербург', 1, 2400, 30, 'Ночная прогулка на теплоходе.'],
  ['Гранд-каньон Урала', 'Екатеринбург', 2, 5400, 18, 'Двухдневный тур по природному парку.'],
  ['Териберка и Баренцево море', 'Мурманск', 2, 7900, 16, 'Скалы, водопад и кит-сафари.'],
]

/** Свежая копия демо-БД (используется при первом запуске и при сбросе демо). */
export function freshDB(): DemoDB {
  const flights: Flight[] = RAW_FLIGHTS.map((f, i) => ({
    id: i + 1, airline: f[0], from_city: f[1], to_city: f[2],
    departure: at(f[3], f[4]), arrival: at(f[5], f[6]),
    price: f[7], seats_total: f[8], seats_left: f[8],
  }))
  const hotels: Hotel[] = RAW_HOTELS.map((h, i) => ({
    id: i + 1, name: h[0], city: h[1], stars: h[2],
    price_per_night: h[3], rooms_total: h[4], rooms_left: h[4], description: h[5],
  }))
  const tours: Tour[] = RAW_TOURS.map((t, i) => ({
    id: i + 1, title: t[0], city: t[1], duration_days: t[2],
    price: t[3], spots_total: t[4], spots_left: t[4], description: t[5],
  }))
  const users: DemoUser[] = [
    { id: 1, email: 'admin@voyago.app', name: 'Администратор', role: 'admin', password: 'admin123' },
    { id: 2, email: 'user@voyago.app', name: 'Гость', role: 'user', password: 'user123' },
  ]

  // Готовые брони демо-пользователя (id 2) — уменьшают доступность.
  const bookings: Booking[] = []
  let seqBooking = 1
  const book = (item: Flight | Hotel | Tour, type: 'flight' | 'hotel' | 'tour',
                left: 'seats_left' | 'rooms_left' | 'spots_left', unit: number, qty: number, title: string) => {
    ;(item as unknown as Record<string, number>)[left] -= qty
    bookings.push({
      id: seqBooking++, item_type: type, item_id: item.id, title,
      quantity: qty, total_price: Math.round(unit * qty * 100) / 100,
      status: 'confirmed', created_at: at(-3, 10),
    })
  }
  book(flights[0], 'flight', 'seats_left', flights[0].price, 2,
    `${flights[0].airline}: ${flights[0].from_city} → ${flights[0].to_city}`)
  book(hotels[0], 'hotel', 'rooms_left', hotels[0].price_per_night, 1,
    `${hotels[0].name} (${hotels[0].city}, ${hotels[0].stars}★)`)
  book(tours[0], 'tour', 'spots_left', tours[0].price, 2,
    `${tours[0].title} (${tours[0].city})`)

  return {
    flights, hotels, tours, users, bookings,
    seqFlight: flights.length + 1, seqHotel: hotels.length + 1,
    seqTour: tours.length + 1, seqBooking,
  }
}
