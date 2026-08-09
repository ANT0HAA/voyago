import type { Booking, Flight, Hotel, Stats, Tour, User } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

let _token: string | null = localStorage.getItem('voyago_token')
export function getToken(): string | null {
  return _token
}
export function setToken(t: string | null): void {
  _token = t
  if (t) localStorage.setItem('voyago_token', t)
  else localStorage.removeItem('voyago_token')
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = new Headers(opts.headers)
  if (_token) headers.set('Authorization', `Bearer ${_token}`)
  if (opts.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.detail) || `Ошибка ${res.status}`)
  return data as T
}

interface AuthResp {
  access_token: string
  user: User
}

const qs = (p: Record<string, string>) => new URLSearchParams(p).toString()

export const api = {
  register: (email: string, name: string, password: string) =>
    req<AuthResp>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  login: (email: string, password: string) =>
    req<AuthResp>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req<User>('/api/auth/me'),

  listFlights: (p: Record<string, string> = {}) => req<Flight[]>(`/api/flights?${qs(p)}`),
  listHotels: (p: Record<string, string> = {}) => req<Hotel[]>(`/api/hotels?${qs(p)}`),
  listTours: (p: Record<string, string> = {}) => req<Tour[]>(`/api/tours?${qs(p)}`),

  book: (itemType: string, itemId: number, quantity: number) =>
    req<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify({ item_type: itemType, item_id: itemId, quantity }) }),
  myBookings: () => req<Booking[]>('/api/bookings/mine'),
  cancel: (id: number) => req<Booking>(`/api/bookings/${id}/cancel`, { method: 'POST' }),

  adminStats: () => req<Stats>('/api/admin/stats'),
  adminBookings: () => req<Booking[]>('/api/admin/bookings'),
  adminCreate: (type: string, data: unknown) =>
    req<unknown>(`/api/admin/${type}s`, { method: 'POST', body: JSON.stringify(data) }),
  adminUpdate: (type: string, id: number, data: unknown) =>
    req<unknown>(`/api/admin/${type}s/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDelete: (type: string, id: number) =>
    req<void>(`/api/admin/${type}s/${id}`, { method: 'DELETE' }),
}
