import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Home from './Home'

function Probe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname + decodeURIComponent(loc.search)}</div>
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search/:type" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('строит поисковый URL рейса из полей «Откуда/Куда»', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByPlaceholderText('Откуда'), 'Москва')
    await user.type(screen.getByPlaceholderText('Куда'), 'Сочи')
    await user.click(screen.getByRole('button', { name: 'Найти' }))

    const loc = screen.getByTestId('loc').textContent ?? ''
    expect(loc).toContain('/search/flights')
    expect(loc).toContain('from_city=Москва')
    expect(loc).toContain('to_city=Сочи')
  })

  it('переключает вкладку на отели и ищет по городу', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: /Отели/ }))
    await user.type(screen.getByPlaceholderText('Город'), 'Казань')
    await user.click(screen.getByRole('button', { name: 'Найти' }))

    const loc = screen.getByTestId('loc').textContent ?? ''
    expect(loc).toContain('/search/hotels')
    expect(loc).toContain('city=Казань')
  })
})
