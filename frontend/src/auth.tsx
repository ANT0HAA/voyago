import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { User } from './types'

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return
    }
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setReady(true))
  }, [])

  const login = async (email: string, password: string) => {
    const r = await api.login(email, password)
    setToken(r.access_token)
    setUser(r.user)
  }
  const register = async (email: string, name: string, password: string) => {
    const r = await api.register(email, name, password)
    setToken(r.access_token)
    setUser(r.user)
  }
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
