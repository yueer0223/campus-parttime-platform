import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { authApi, type RegisterPayload } from '../api/auth'
import type { User } from '../types'

interface AuthContextValue {
  token: string | null
  user: User | null
  login: (username: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(readStoredUser)

  const applyAuth = (accessToken: string, nextUser: User) => {
    setToken(accessToken)
    setUser(nextUser)
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  const login = async (username: string, password: string): Promise<User> => {
    const data = await authApi.login(username, password)
    applyAuth(data.access_token, data.user)
    return data.user
  }

  const register = async (payload: RegisterPayload): Promise<User> => {
    const data = await authApi.register(payload)
    applyAuth(data.access_token, data.user)
    return data.user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo(
    () => ({ token, user, login, register, logout }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
