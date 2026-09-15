import client from './client'
import type { Category } from '../types'

export const categoryApi = {
  list: () => client.get<Category[]>('/categories').then((r) => r.data),
}
