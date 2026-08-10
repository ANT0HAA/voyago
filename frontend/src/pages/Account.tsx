import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

const ROLE_LABEL: Record<string, string> = { admin: 'Администратор', user: 'Пользователь' }

export default function Account() {
  const { user, logout } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!user) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (newPassword.length < 6) { setError('Новый пароль — минимум 6 символов.'); return }
    if (newPassword !== confirm) { setError('Пароли не совпадают.'); return }
    setBusy(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      setDone(true)
      setOldPassword(''); setNewPassword(''); setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить пароль')
    } finally {
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Мой аккаунт</h1>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-600 text-white text-xl font-bold flex items-center justify-center">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
            <span className="inline-block mt-1 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-600/20 rounded px-2 py-0.5">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
          <button onClick={logout} className="ml-auto text-sm text-slate-400 dark:text-slate-500 hover:text-rose-600">Выйти</button>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Смена пароля</h2>
        <form onSubmit={submit} className="space-y-3 max-w-sm">
          <label className="block text-xs text-slate-500 dark:text-slate-400">Текущий пароль
            <input type="password" className={field} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password" required />
          </label>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Новый пароль
            <input type="password" className={field} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password" minLength={6} required />
          </label>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Повторите новый пароль
            <input type="password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" required />
          </label>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          {done && <div className="text-sm text-emerald-600">Пароль изменён ✓</div>}
          <button type="submit" disabled={busy}
            className="py-2.5 px-5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Сохраняю…' : 'Сменить пароль'}
          </button>
        </form>
      </section>
    </div>
  )
}
