import { useEffect, useState } from 'react'
import { favoriteApi } from '../api/favorites'
import TaskCard from '../components/TaskCard'
import type { Task } from '../types'
import { getErrorMessage } from '../utils'

export default function FavoritesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    favoriteApi.list().then(setTasks).catch((e) => setError(getErrorMessage(e)))
  }, [])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7">
        <h1 className="font-display text-4xl font-bold text-ink">我的收藏</h1>
        <p className="mt-2 text-ink-muted">收藏感兴趣的兼职任务，方便随时回看</p>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {tasks.length === 0 ? (
        <div className="rounded-3xl bg-white/95 py-20 text-center text-ink-muted shadow-soft">还没有收藏任何任务</div>
      ) : (
        <div className="masonry">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}
    </div>
  )
}
