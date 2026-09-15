import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { categoryApi } from '../api/categories'
import { taskApi } from '../api/tasks'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import type { Category, Task, TaskStatus } from '../types'
import { getErrorMessage } from '../utils'

const PAGE_SIZE = 6

const statusOptions: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '待接单' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 rounded bg-white/60" />
        <div className="h-5 w-14 rounded-full bg-white/60" />
      </div>
      <div className="mt-4 h-4 w-full rounded bg-white/50" />
      <div className="mt-2 h-4 w-4/5 rounded bg-white/50" />
      <div className="mt-5 h-4 w-1/3 rounded bg-white/60" />
    </div>
  )
}

export default function TaskListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [sort, setSort] = useState<'latest' | 'reward_desc'>('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const keywordRef = useRef('')

  keywordRef.current = keyword

  const buildParams = (p: number) => ({
    page: p,
    page_size: PAGE_SIZE,
    keyword: keywordRef.current.trim() || undefined,
    status: status || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    sort,
  })

  const loadFirst = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await taskApi.list(buildParams(1))
      setTasks(data.items)
      setPage(1)
      setHasMore(data.has_more)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, categoryId, sort])

  const loadMore = useCallback(async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const data = await taskApi.list(buildParams(next))
      setTasks((prev) => [...prev, ...data.items])
      setPage(next)
      setHasMore(data.has_more)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingMore, hasMore, page, status, categoryId, sort])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    void loadFirst()
  }, [loadFirst])

  return (
    <div className="bg-soft-scene -mx-5 -my-8 min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="font-display text-4xl font-bold text-ink">任务大厅</h1>
          <p className="mt-2 text-ink-muted">发现校园里的兼职机会，按分类或状态快速筛选</p>
        </div>

        <div className="glass-card mb-7 flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <input
            placeholder="搜索任务标题或描述"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadFirst()}
            className="h-11 min-w-[220px] flex-1 rounded-xl border border-white/60 bg-white/70 px-4 text-sm text-ink outline-none transition focus:border-iris-300 focus:bg-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
            className="h-11 rounded-xl border border-white/60 bg-white/70 px-3 text-sm text-ink outline-none"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 rounded-xl border border-white/60 bg-white/70 px-3 text-sm text-ink outline-none"
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'latest' | 'reward_desc')}
            className="h-11 rounded-xl border border-white/60 bg-white/70 px-3 text-sm text-ink outline-none"
          >
            <option value="latest">最新发布</option>
            <option value="reward_desc">报酬最高</option>
          </select>
          <button
            onClick={loadFirst}
            className="flex h-11 items-center gap-1.5 rounded-xl bg-iris-500 px-5 text-sm font-semibold text-white transition hover:bg-iris-600"
          >
            <MagnifyingGlass size={16} />
            <span>搜索</span>
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        {loading ? (
          <div className="masonry">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center text-ink-muted">暂无符合条件的任务</div>
        ) : (
          <>
            <div className="masonry">
              {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  className="rounded-xl border border-iris-200 bg-white/80 px-6 py-2.5 text-sm font-semibold text-iris-700 transition hover:bg-iris-50"
                >
                  {loadingMore ? '加载中…' : '展开更多'}
                </button>
                {!user && <p className="mt-2 text-xs text-ink-muted">展开更多需要登录</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
