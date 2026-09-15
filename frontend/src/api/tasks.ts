import client from './client'
import type { Complaint, Page, Review, Task, TaskInput } from '../types'

export interface TaskQuery {
  status?: string
  category_id?: number
  keyword?: string
  sort?: string
  min_reward?: number
  max_reward?: number
}

export const taskApi = {
  list: (params?: TaskQuery) =>
    client.get<Page<Task>>('/tasks', { params }).then((r) => r.data),

  get: (id: number) => client.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: TaskInput) =>
    client.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: number, payload: Partial<TaskInput>) =>
    client.put<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  remove: (id: number) => client.delete(`/tasks/${id}`),

  apply: (id: number, offerPrice?: number) =>
    client.post<Task>(`/tasks/${id}/apply`, { offer_price: offerPrice }).then((r) => r.data),

  approveApplication: (id: number, finalPrice?: number) =>
    client.post<Task>(`/tasks/${id}/approve-application`, { final_price: finalPrice }).then((r) => r.data),

  rejectApplication: (id: number) =>
    client.post<Task>(`/tasks/${id}/reject-application`).then((r) => r.data),

  complete: (id: number) => client.post<Task>(`/tasks/${id}/complete`).then((r) => r.data),

  cancel: (id: number) => client.post<Task>(`/tasks/${id}/cancel`).then((r) => r.data),

  minePublished: () => client.get<Task[]>('/tasks/mine/published').then((r) => r.data),

  mineAccepted: () => client.get<Task[]>('/tasks/mine/accepted').then((r) => r.data),

  approve: (id: number) => client.post<Task>(`/tasks/${id}/approve`).then((r) => r.data),

  reject: (id: number) => client.post<Task>(`/tasks/${id}/reject`).then((r) => r.data),

  review: (id: number, payload: { rating: number; content: string }) =>
    client.post<Review>(`/tasks/${id}/review`, payload).then((r) => r.data),

  complain: (id: number, payload: { reason: string; detail: string }) =>
    client.post<Complaint>(`/tasks/${id}/complaint`, payload).then((r) => r.data),

  pending: () => client.get<Task[]>('/tasks/admin/pending').then((r) => r.data),

  favorite: (id: number) => client.post<Task>(`/tasks/${id}/favorite`).then((r) => r.data),

  unfavorite: (id: number) => client.delete(`/tasks/${id}/favorite`),
}
