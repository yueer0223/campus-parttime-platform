import client from './client'
import type { MyStats, Role, User } from '../types'

export const userApi = {
  list: () => client.get<User[]>('/users').then((r) => r.data),

  changeRole: (id: number, role: Role) =>
    client.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),

  updateProfile: (payload: { nickname?: string; phone?: string; wechat?: string }) =>
    client.patch<User>('/users/me', payload).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    client.post('/users/me/change-password', { old_password: oldPassword, new_password: newPassword }).then((r) => r.data),

  myStats: () => client.get<MyStats>('/users/me/stats').then((r) => r.data),
}
