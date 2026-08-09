export type ItemType = 'flight' | 'hotel' | 'tour'

export interface Flight {
  id: number
  airline: string
  from_city: string
  to_city: string
  departure: string
  arrival: string
  price: number
  seats_total: number
  seats_left: number
}

export interface Hotel {
  id: number
  name: string
  city: string
  stars: number
  price_per_night: number
  rooms_total: number
  rooms_left: number
  description: string
}

export interface Tour {
  id: number
  title: string
  city: string
  duration_days: number
  price: number
  spots_total: number
  spots_left: number
  description: string
}

export interface Booking {
  id: number
  item_type: ItemType
  item_id: number
  title: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export interface Stats {
  users: number
  flights: number
  hotels: number
  tours: number
  bookings_active: number
  revenue: number
}
