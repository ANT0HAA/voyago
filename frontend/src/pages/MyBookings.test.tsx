import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyBookings from './MyBookings'
import { api } from '../api'

const { booking } = vi.hoisted(() => ({
  booking: {
    id: 7, item_type: 'hotel' as const, item_id: 3, title: 'Гранд Отель',
    quantity: 2, total_price: 12000, status: 'confirmed', created_at: '2026-08-01T09:00:00',
  },
}))

vi.mock('../api', () => ({
  api: {
    myBookings: vi.fn().mockResolvedValue([booking]),
    cancel: vi.fn().mockResolvedValue({ ...booking, status: 'cancelled' }),
  },
  getToken: () => null,
  setToken: vi.fn(),
}))

describe('MyBookings', () => {
  it('показывает бронь и вызывает отмену', async () => {
    const user = userEvent.setup()
    render(<MyBookings />)

    expect(await screen.findByText('Гранд Отель')).toBeInTheDocument()
    expect(screen.getByText('12 000 ₽')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Отменить' }))
    expect(vi.mocked(api.cancel)).toHaveBeenCalledWith(7)
  })
})
