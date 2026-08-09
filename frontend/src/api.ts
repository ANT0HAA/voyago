import type { Booking, BookingExtra, Flight, Hotel, Stats, Tour, User } from './types'
import { demoApi, getToken as demoGetToken, setToken as demoSetToken } from './demo/api'

const BASE = import.meta.env.VITE_API_BASE ?? ''

/** Демо-режим (сборка для GitHub Pages): весь API работает в браузере, без бэкенда. */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'

let _token: string | null = localStorage.getItem('voyago_token')
function realGetToken(): string | null {
  return _token
}
function realSetToken(t: string | null): void {
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

const realApi = {
  register: (email: string, name: string, password: string) =>
    req<AuthResp>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  login: (email: string, password: string) =>
    req<AuthResp>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req<User>('/api/auth/me'),

  listFlights: (p: Record<string, string> = {}) => req<Flight[]>(`/api/flights?${qs(p)}`),
  listHotels: (p: Record<string, string> = {}) => req<Hotel[]>(`/api/hotels?${qs(p)}`),
  listTours: (p: Record<string, string> = {}) => req<Tour[]>(`/api/tours?${qs(p)}`),

  getFlight: (id: number) => req<Flight>(`/api/flights/${id}`),
  getHotel: (id: number) => req<Hotel>(`/api/hotels/${id}`),
  getTour: (id: number) => req<Tour>(`/api/tours/${id}`),

  book: (itemType: string, itemId: number, quantity: number, extra: BookingExtra = {}) =>
    req<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify({ item_type: itemType, item_id: itemId, quantity, ...extra }) }),
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

// В демо-режиме подменяем сетевой клиент на браузерный; иначе — настоящий REST.
export const api = (IS_DEMO ? (demoApi as unknown as typeof realApi) : realApi)
export const getToken = IS_DEMO ? demoGetToken : realGetToken
export const setToken = IS_DEMO ? demoSetToken : realSetToken
