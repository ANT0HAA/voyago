import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Detail from './Detail'
import { CartProvider } from '../cart'
import { FavoritesProvider } from '../favorites'

vi.mock('../api', () => ({
  api: {
    getFlight: vi.fn().mockResolvedValue({
      id: 1, airline: 'Аэрофлот', from_city: 'Москва', to_city: 'Сочи',
      departure: '2026-08-10T10:00:00', arrival: '2026-08-10T12:00:00',
      price: 5400, seats_total: 100, seats_left: 40,
    }),
  },
  getToken: () => null,
  setToken: vi.fn(),
}))

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/flights/1']}>
      <FavoritesProvider>
        <CartProvider>
          <Routes>
            <Route path="/flights/:id" element={<Detail type="flight" />} />
            <Route path="/cart" element={<div>Корзина открыта</div>} />
          </Routes>
        </CartProvider>
      </FavoritesProvider>
    </MemoryRouter>,
  )
}

describe('Detail', () => {
  beforeEach(() => localStorage.clear())

  it('показывает описание рейса и факты', async () => {
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Москва → Сочи' })).toBeInTheDocument()
    expect(screen.getByText('Авиакомпания')).toBeInTheDocument()
    expect(screen.getByText(/осталось 40/)).toBeInTheDocument()
  })

  it('кнопка «В корзину» добавляет предложение', async () => {
    const user = userEvent.setup()
    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'В корзину' }))
    expect(screen.getByText(/Добавлено в корзину/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('voyago_cart') || '[]')).toHaveLength(1)
  })
})
