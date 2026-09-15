import client from './client'
import type { PolishResponse } from '../types'

export const polishApi = {
  polish: (text: string) =>
    client.post<PolishResponse>('/polish', { text }).then((r) => r.data),
}
