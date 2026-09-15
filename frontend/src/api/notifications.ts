import client from './client'
import type { Notification } from '../types'

export const notificationApi = {
  list: () => client.get<Notification[]>('/notifications').then((r) => r.data),

  unreadCount: () => client.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  readAll: () => client.post('/notifications/read-all').then((r) => r.data),
}
