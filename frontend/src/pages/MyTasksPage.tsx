import { useEffect, useState } from 'react'
import { taskApi } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import type { Task } from '../types'
import { getErrorMessage } from '../utils'

export default function MyTasksPage() {
  const { user } = useAuth()
  const isReceiver = user?.role === 'receiver'
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = isReceiver ? await taskApi.mineAccepted() : await taskApi.minePublished()
      setTasks(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [isReceiver])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <h1 className="font-display text-4xl font-bold text-ink">
          {isReceiver ? '我接取的任务' : '我发布的任务'}
        </h1>
        <p className="mt-2 text-ink-muted">
          {isReceiver ? '查看已接取的兼职与进行状态' : '管理自己发布的兼职任务'}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="py-20 text-center text-ink-muted">正在加载任务…</div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center text-ink-muted">暂无记录</div>
      ) : (
        <div className="masonry">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
