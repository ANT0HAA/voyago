import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthPage from './AuthPage'
import { AuthProvider } from '../auth'
import { api } from '../api'

vi.mock('../api', () => ({
  api: {
    login: vi.fn().mockResolvedValue({ access_token: 't', user: { id: 1, email: 'a@b.c', name: 'A', role: 'user' } }),
    register: vi.fn(),
    me: vi.fn(),
  },
  getToken: () => null,
  setToken: vi.fn(),
}))

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<div>Главная</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthPage', () => {
  it('вход вызывает api.login и переводит на главную', async () => {
    const user = userEvent.setup()
    renderAuth()

    await user.type(screen.getByLabelText('Email'), 'a@b.c')
    await user.type(screen.getByLabelText('Пароль'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(vi.mocked(api.login)).toHaveBeenCalledWith('a@b.c', 'secret1')
    expect(await screen.findByText('Главная')).toBeInTheDocument()
  })

  it('переключается на регистрацию и показывает поле имени', async () => {
    const user = userEvent.setup()
    renderAuth()

    await user.click(screen.getByRole('button', { name: 'Создать' }))
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
  })
})
