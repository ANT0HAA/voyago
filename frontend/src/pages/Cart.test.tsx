import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Cart from './Cart'
import { CartProvider } from '../cart'
import { AuthProvider } from '../auth'

const ITEM = {
  key: 'flight-1', type: 'flight', id: 1, title: 'Москва → Сочи', sub: 'Аэрофлот',
  emoji: '✈️', seed: 'Сочи', unitPrice: 5400, priceLabel: '₽ за место', unit: 'мест', qty: 2, max: 100,
}

function renderCart() {
  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<div>Нужен вход</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('voyago_cart', JSON.stringify([ITEM]))
  })

  it('показывает позицию и сумму строки (цена × количество)', () => {
    renderCart()
    expect(screen.getByText('Москва → Сочи')).toBeInTheDocument()
    expect(screen.getAllByText(/10 800/).length).toBeGreaterThan(0) // 5400 × 2
  })

  it('без авторизации «Оформить» ведёт на вход', async () => {
    const user = userEvent.setup()
    renderCart()
    await user.click(screen.getByRole('button', { name: /Оформить/ }))
    expect(await screen.findByText('Нужен вход')).toBeInTheDocument()
  })
})
