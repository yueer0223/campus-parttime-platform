import client from './client'
import type { Task } from '../types'

export const favoriteApi = {
  list: () => client.get<Task[]>('/favorites').then((r) => r.data),
}
