import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Catalog from './Catalog'

vi.mock('../api', () => ({
  api: {
    listFlights: vi.fn().mockResolvedValue([{
      id: 1, airline: 'Аэрофлот', from_city: 'Москва', to_city: 'Сочи',
      departure: '2026-08-10T10:00:00', arrival: '2026-08-10T12:00:00',
      price: 5400, seats_total: 100, seats_left: 40,
    }]),
    listHotels: vi.fn().mockResolvedValue([]),
    listTours: vi.fn().mockResolvedValue([]),
  },
  getToken: () => null,
  setToken: vi.fn(),
}))

function renderCatalog() {
  return render(
    <MemoryRouter initialEntries={['/search/flights']}>
      <Routes>
        <Route path="/search/:type" element={<Catalog />} />
        <Route path="/flights/:id" element={<div>Страница рейса</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Catalog', () => {
  it('показывает загруженные рейсы с остатком мест', async () => {
    renderCatalog()
    expect(await screen.findByText('Москва → Сочи')).toBeInTheDocument()
    expect(screen.getByText(/осталось 40/)).toBeInTheDocument()
  })

  it('карточка ведёт на страницу деталей', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.click(await screen.findByText('Москва → Сочи'))
    expect(await screen.findByText('Страница рейса')).toBeInTheDocument()
  })

  it('фильтр по городу прилёта скрывает несовпадающие рейсы', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findByText('Москва → Сочи')
    await user.type(screen.getByPlaceholderText('Город прилёта'), 'Казань')
    expect(screen.queryByText('Москва → Сочи')).not.toBeInTheDocument()
    expect(screen.getByText(/Ничего не найдено/)).toBeInTheDocument()
  })
})
