import client from './client'
import type { AuthResponse, User } from '../types'

export interface RegisterPayload {
  username: string
  password: string
  role: 'publisher' | 'receiver'
  nickname?: string
}

export const authApi = {
  login: (username: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { username, password }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    client.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}
