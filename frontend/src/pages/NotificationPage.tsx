import { useEffect, useState } from 'react'
import { notificationApi } from '../api/notifications'
import type { Notification } from '../types'
import { formatRelativeTime, getErrorMessage } from '../utils'

export default function NotificationPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [error, setError] = useState('')

  const load = () => {
    notificationApi.list().then(setItems).catch((e) => setError(getErrorMessage(e)))
  }

  useEffect(() => {
    load()
  }, [])

  const markAll = async () => {
    await notificationApi.readAll().catch(() => {})
    load()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold text-ink">通知</h1>
        <button onClick={markAll} className="rounded-xl border border-iris-200 px-4 py-2 text-sm font-semibold text-iris-700 hover:bg-iris-50">全部已读</button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white/95 py-20 text-center text-ink-muted shadow-soft">暂无通知</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <div key={n.id} className={`rounded-2xl p-4 ${n.is_read ? 'bg-white/80' : 'bg-iris-50'} shadow-soft`}>
              <p className="text-sm leading-relaxed text-ink">{n.content}</p>
              <p className="mt-1 text-xs text-ink-muted">{formatRelativeTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
