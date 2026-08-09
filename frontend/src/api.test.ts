import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, getToken, setToken } from './api'

describe('хранение токена', () => {
  afterEach(() => setToken(null))

  it('сохраняет токен в localStorage', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
    expect(localStorage.getItem('voyago_token')).toBe('abc')
  })

  it('очищает токен', () => {
    setToken('abc')
    setToken(null)
    expect(getToken()).toBeNull()
    expect(localStorage.getItem('voyago_token')).toBeNull()
  })
})

describe('api.login', () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.restoreAllMocks())

  it('отправляет учётные данные и возвращает токен', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ access_token: 't', user: { id: 1, email: 'a@b.c', name: 'A', role: 'user' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const r = await api.login('a@b.c', 'secret')

    expect(r.access_token).toBe('t')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/auth/login')
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.c', password: 'secret' })
  })

  it('бросает сообщение detail при ошибке', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ detail: 'Неверный email или пароль' }),
    }))
    await expect(api.login('x@y.z', 'w')).rejects.toThrow('Неверный email или пароль')
  })
})

describe('api.book', () => {
  afterEach(() => { vi.restoreAllMocks(); setToken(null) })

  it('добавляет заголовок авторизации и корректное тело', async () => {
    setToken('tok')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await api.book('flight', 5, 2)

    const [, opts] = fetchMock.mock.calls[0]
    expect((opts.headers as Headers).get('Authorization')).toBe('Bearer tok')
    expect(JSON.parse(opts.body)).toEqual({ item_type: 'flight', item_id: 5, quantity: 2 })
  })
})
