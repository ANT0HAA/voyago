import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function AuthPage() {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, name, password)
      nav(loc.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <div className="max-w-sm mx-auto px-5 py-12">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {mode === 'login' ? 'Войдите, чтобы бронировать и видеть свои поездки.' : 'Создайте аккаунт за минуту.'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Имя
              <input className={`mt-1 ${input}`} value={name} onChange={(e) => setName(e.target.value)}
                required autoComplete="name" />
            </label>
          )}
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Email
            <input className={`mt-1 ${input}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Пароль
            <input className={`mt-1 ${input}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <button type="submit" disabled={busy}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium">
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            className="text-brand-600 font-medium hover:underline">
            {mode === 'login' ? 'Создать' : 'Войти'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
            Демо-доступ: <b>user@voyago.app</b> / user123 · админ <b>admin@voyago.app</b> / admin123
          </div>
        )}
      </div>
    </div>
  )
}
