import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { taskApi } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import type { Task } from '../types'
import { formatRelativeTime, statusLabel } from '../utils'

const statusClass: Record<string, string> = {
  open: 'bg-iris-100 text-iris-700',
  applied: 'bg-warning-bg text-warning',
  in_progress: 'bg-info-bg text-info',
  completed: 'bg-success-bg text-success',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function TaskCard({ task }: { task: Task }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favorited, setFavorited] = useState(task.is_favorited)

  const toggleFavorite = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }
    try {
      if (favorited) {
        await taskApi.unfavorite(task.id)
        setFavorited(false)
      } else {
        await taskApi.favorite(task.id)
        setFavorited(true)
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="glass-card block rounded-3xl p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-diffuse"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          {task.title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleFavorite}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-iris-50"
            title={favorited ? '取消收藏' : '收藏'}
          >
            <Star
              size={18}
              weight={favorited ? 'fill' : 'regular'}
              className={favorited ? 'text-amber-500' : 'text-ink-muted'}
            />
          </button>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[task.status]}`}>
            {statusLabel[task.status]}
          </span>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-white/60 pt-3 text-sm">
        <span className="text-ink-muted">{task.category_name ?? '未分类'}</span>
        <span className="text-xs text-ink-muted">{formatRelativeTime(task.created_at)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-ink-muted">
          {task.apply_count > 0 ? `${task.apply_count} 人申请` : `${task.publisher_name ?? '匿名'} 发布`}
        </span>
        <span className="font-semibold tabular-nums text-iris-700">
          {task.price_type === 'negotiable' ? '面议' : `${task.reward} ${task.reward_unit}`}
        </span>
      </div>
      {task.duration && (
        <div className="mt-2 text-xs text-ink-muted">时长 {task.duration}{task.deadline ? ` · 截止 ${task.deadline}` : ''}</div>
      )}
    </Link>
  )
}
