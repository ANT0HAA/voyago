import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Catalog from './Catalog'
import { AuthProvider } from '../auth'

vi.mock('../api', () => ({
  api: {
    listFlights: vi.fn().mockResolvedValue([{
      id: 1, airline: 'Аэрофлот', from_city: 'Москва', to_city: 'Сочи',
      departure: '2026-08-10T10:00:00', arrival: '2026-08-10T12:00:00',
      price: 5400, seats_total: 100, seats_left: 40,
    }]),
    listHotels: vi.fn().mockResolvedValue([]),
    listTours: vi.fn().mockResolvedValue([]),
    book: vi.fn().mockResolvedValue({}),
  },
  getToken: () => null,
  setToken: vi.fn(),
}))

function renderCatalog() {
  return render(
    <MemoryRouter initialEntries={['/search/flights']}>
      <AuthProvider>
        <Routes>
          <Route path="/search/:type" element={<Catalog />} />
          <Route path="/login" element={<div>Страница входа</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Catalog', () => {
  it('показывает загруженные рейсы', async () => {
    renderCatalog()
    expect(await screen.findByText('Москва → Сочи')).toBeInTheDocument()
    expect(screen.getByText(/осталось 40/)).toBeInTheDocument()
  })

  it('без авторизации отправляет на страницу входа при бронировании', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.click(await screen.findByRole('button', { name: 'Забронировать' }))
    expect(await screen.findByText('Страница входа')).toBeInTheDocument()
  })
})
