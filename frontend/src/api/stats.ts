import client from './client'
import type { DashboardStats } from '../types'

export const statsApi = {
  dashboard: () => client.get<DashboardStats>('/stats/dashboard').then((r) => r.data),
}
