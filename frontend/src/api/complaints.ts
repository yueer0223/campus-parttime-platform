import client from './client'
import type { Complaint } from '../types'

export const complaintApi = {
  list: () => client.get<Complaint[]>('/complaints').then((r) => r.data),

  handle: (id: number, payload: { status: string; handled_note?: string }) =>
    client.patch<Complaint>(`/complaints/${id}`, payload).then((r) => r.data),
}
