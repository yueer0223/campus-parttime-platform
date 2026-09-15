import client from './client'
import type { CardExchange } from '../types'

export const cardApi = {
  get: (taskId: number) =>
    client.get<CardExchange>(`/cards/exchange/${taskId}`).then((r) => r.data),

  exchange: (taskId: number) =>
    client.post<CardExchange>(`/cards/exchange/${taskId}`).then((r) => r.data),
}
