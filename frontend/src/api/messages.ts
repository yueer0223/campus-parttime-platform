import client from './client'
import type { Conversation, Message } from '../types'

export const messageApi = {
  list: (taskId: number) =>
    client.get<Message[]>(`/messages/task/${taskId}`).then((r) => r.data),

  send: (taskId: number, content: string) =>
    client.post<Message>(`/messages/task/${taskId}`, { content }).then((r) => r.data),

  conversations: () =>
    client.get<Conversation[]>('/messages/conversations').then((r) => r.data),
}
