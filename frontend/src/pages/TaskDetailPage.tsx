import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Flag, PencilSimple, Star, Trash, XCircle } from '@phosphor-icons/react'
import { cardApi } from '../api/cards'
import { categoryApi } from '../api/categories'
import { taskApi } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import type { CardExchange, Category, Task } from '../types'
import { formatRelativeTime, getErrorMessage, statusLabel } from '../utils'

export default function TaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', reward: '' })
  const [reviewing, setReviewing] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [complaining, setComplaining] = useState(false)
  const [complaintReason, setComplaintReason] = useState('')
  const [complaintDetail, setComplaintDetail] = useState('')
  const [exchange, setExchange] = useState<CardExchange | null>(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [finalPrice, setFinalPrice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTask(await taskApi.get(taskId))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  const canExchange = !!user && !!task && (user.role === 'admin' || user.id === task.publisher_id || user.id === task.receiver_id)

  const loadExchange = useCallback(async () => {
    if (!canExchange) return
    try {
      setExchange(await cardApi.get(taskId))
    } catch {
      /* ignore */
    }
  }, [taskId, canExchange])

  useEffect(() => {
    if (!canExchange) return
    void loadExchange()
  }, [canExchange, loadExchange])

  const doExchange = async () => {
    if (!user) return requireLogin()
    setError('')
    try {
      setExchange(await cardApi.exchange(taskId))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const requireLogin = () => {
    navigate('/login', { state: { from: { pathname: `/tasks/${taskId}` } } })
  }

  const startEdit = () => {
    if (!task) return
    setForm({
      title: task.title,
      description: task.description,
      categoryId: task.category_id ? String(task.category_id) : '',
      reward: String(task.reward),
    })
    setEditing(true)
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await taskApi.update(taskId, {
        title: form.title,
        description: form.description,
        category_id: form.categoryId ? Number(form.categoryId) : null,
        reward: Number(form.reward) || 0,
      })
      setEditing(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const act = async (fn: () => Promise<unknown>) => {
    setError('')
    setNotice('')
    try {
      await fn()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const submitReview = async () => {
    if (!user) return requireLogin()
    setError('')
    try {
      await taskApi.review(taskId, { rating, content: reviewContent })
      setReviewing(false)
      setNotice('评价已提交')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const submitComplaint = async () => {
    if (!user) return requireLogin()
    setError('')
    try {
      await taskApi.complain(taskId, { reason: complaintReason, detail: complaintDetail })
      setComplaining(false)
      setNotice('投诉已提交，管理员会尽快处理')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const remove = async () => {
    if (!window.confirm('确定删除该任务吗？')) return
    setError('')
    try {
      await taskApi.remove(taskId)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <div className="py-20 text-center text-ink-muted">加载中…</div>
  if (error && !task) return <div className="py-10 text-danger">{error}</div>
  if (!task) return <div className="py-10 text-ink-muted">任务不存在</div>

  const isOwner = user?.id === task.publisher_id
  const canEdit = (task.status === 'pending' || task.status === 'open') && (user?.role === 'admin' || isOwner)
  const canDelete = user?.role === 'admin' || isOwner
  const showApply = task.status === 'open' && !isOwner && user?.role !== 'admin'
  const canApproveApplication = task.status === 'applied' && (user?.role === 'admin' || isOwner)
  const canRejectApplication = task.status === 'applied' && (user?.role === 'admin' || isOwner)
  const canComplete = task.status === 'in_progress' && (user?.role === 'admin' || isOwner || user?.id === task.receiver_id)
  const canCancel = (task.status === 'open' || task.status === 'in_progress') && (user?.role === 'admin' || isOwner)
  const canReview = task.status === 'completed' && (isOwner || user?.id === task.receiver_id)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl bg-white/95 p-7 shadow-soft">
        {editing ? (
          <form onSubmit={submitEdit} className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-bold text-ink">编辑任务</h2>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              标题
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              描述
              <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              分类
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none">
                <option value="">未分类</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              报酬（元）
              <input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
            </label>
            <div className="mt-2 flex gap-3">
              <button type="submit" className="rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600">保存</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-iris-200 px-5 py-2.5 text-sm font-semibold text-iris-700 hover:bg-iris-50">取消</button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold leading-snug text-ink">{task.title}</h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span>分类 <b className="font-semibold text-ink">{task.category_name ?? '未分类'}</b></span>
              <span>状态 <b className="font-semibold text-ink">{statusLabel[task.status]}</b></span>
              <span>发布者 <b className="font-semibold text-ink">{task.publisher_name ?? '匿名'}</b></span>
              <span>接单者 <b className="font-semibold text-ink">{task.receiver_name ?? '暂无'}</b></span>
              <span>发布于 <b className="font-semibold text-ink">{formatRelativeTime(task.created_at)}</b></span>
            </div>
            <p className="mt-4 text-xl font-bold tabular-nums text-iris-700">
              {task.price_type === 'negotiable'
                ? task.final_price
                  ? `已谈妥 ${task.final_price} ${task.reward_unit}`
                  : '面议'
                : `${task.reward} ${task.reward_unit}`}
            </p>
            {(task.duration || task.deadline) && (
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
                {task.duration && <span>工作时长 <b className="font-semibold text-ink">{task.duration}</b></span>}
                {task.deadline && <span>截止时间 <b className="font-semibold text-ink">{task.deadline}</b></span>}
              </div>
            )}
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-ink-soft">{task.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {showApply && (
                <button onClick={() => (user ? act(() => taskApi.apply(taskId, Number(offerPrice) || undefined)) : requireLogin())} className="flex items-center gap-1.5 rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600">
                  <CheckCircle size={16} /><span>申请接单</span>
                </button>
              )}
              {showApply && task.price_type === 'negotiable' && (
                <input
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="你的报价（元）"
                  className="w-40 rounded-xl border border-iris-100 px-3 py-2 text-sm text-ink outline-none focus:border-iris-400"
                />
              )}
              {canApproveApplication && (
                <>
                  <input
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    placeholder="最终价格（元）"
                    className="w-40 rounded-xl border border-iris-100 px-3 py-2 text-sm text-ink outline-none focus:border-iris-400"
                  />
                  <button onClick={() => act(() => taskApi.approveApplication(taskId, Number(finalPrice) || undefined))} className="flex items-center gap-1.5 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"><CheckCircle size={16} /><span>同意申请</span></button>
                </>
              )}
              {canRejectApplication && <button onClick={() => act(() => taskApi.rejectApplication(taskId))} className="flex items-center gap-1.5 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"><XCircle size={16} /><span>拒绝申请</span></button>}
              {canComplete && <button onClick={() => act(() => taskApi.complete(taskId))} className="flex items-center gap-1.5 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"><CheckCircle size={16} /><span>标记完成</span></button>}
              {canCancel && <button onClick={() => act(() => taskApi.cancel(taskId))} className="flex items-center gap-1.5 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"><XCircle size={16} /><span>取消任务</span></button>}
              {canEdit && <button onClick={startEdit} className="flex items-center gap-1.5 rounded-xl border border-iris-200 px-5 py-2.5 text-sm font-semibold text-iris-700 hover:bg-iris-50"><PencilSimple size={16} /><span>编辑</span></button>}
              {canDelete && <button onClick={remove} className="flex items-center gap-1.5 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"><Trash size={16} /><span>删除</span></button>}
              {canReview && <button onClick={() => setReviewing(!reviewing)} className="flex items-center gap-1.5 rounded-xl border border-iris-200 px-5 py-2.5 text-sm font-semibold text-iris-700 hover:bg-iris-50"><Star size={16} /><span>评价</span></button>}
              <button onClick={() => (user ? setComplaining(!complaining) : requireLogin())} className="flex items-center gap-1.5 rounded-xl border border-iris-200 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-iris-50"><Flag size={16} /><span>投诉</span></button>
            </div>

            {reviewing && (
              <div className="mt-5 rounded-2xl border border-iris-100 bg-iris-50/50 p-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} className="text-lg">
                      <Star size={22} weight={n <= rating ? 'fill' : 'regular'} className={n <= rating ? 'text-amber-500' : 'text-ink-muted'} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="写下你对这次合作的评价" className="mt-3 w-full rounded-xl border border-iris-100 px-4 py-2.5 text-sm text-ink outline-none" rows={3} />
                <button onClick={submitReview} className="mt-3 rounded-xl bg-iris-500 px-5 py-2 text-sm font-semibold text-white hover:bg-iris-600">提交评价</button>
              </div>
            )}

            {complaining && (
              <div className="mt-5 rounded-2xl border border-iris-100 bg-iris-50/50 p-4">
                <input value={complaintReason} onChange={(e) => setComplaintReason(e.target.value)} placeholder="投诉原因，例如：虚假信息" className="w-full rounded-xl border border-iris-100 px-4 py-2.5 text-sm text-ink outline-none" />
                <textarea value={complaintDetail} onChange={(e) => setComplaintDetail(e.target.value)} placeholder="补充说明具体情况" className="mt-3 w-full rounded-xl border border-iris-100 px-4 py-2.5 text-sm text-ink outline-none" rows={3} />
                <button onClick={submitComplaint} className="mt-3 rounded-xl bg-iris-500 px-5 py-2 text-sm font-semibold text-white hover:bg-iris-600">提交投诉</button>
              </div>
            )}

            {canExchange && (
              <div className="mt-6 border-t border-iris-100 pt-5">
                <h3 className="font-semibold text-ink">交换名片</h3>
                {exchange?.completed ? (
                  <div className="mt-3 rounded-2xl bg-iris-50 p-4">
                    <p className="text-sm text-ink-muted">对方：{exchange.peer_name}</p>
                    <p className="mt-2 text-sm">微信：<b className="text-ink">{exchange.peer_wechat || '未填写'}</b></p>
                    <p className="mt-1 text-sm">电话：<b className="text-ink">{exchange.peer_phone || '未填写'}</b></p>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-sm text-ink-muted">
                      {exchange?.i_agreed ? '你已同意交换，等待对方确认' : '双方都同意后即可查看对方微信和电话'}
                    </p>
                    <button
                      onClick={doExchange}
                      disabled={exchange?.i_agreed}
                      className="rounded-xl bg-iris-500 px-4 py-2 text-sm font-semibold text-white hover:bg-iris-600 disabled:opacity-50"
                    >
                      {exchange?.i_agreed ? '已同意交换' : '交换名片'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {notice && <p className="mt-4 text-sm text-success">{notice}</p>}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        <button onClick={() => navigate(-1)} className="mt-6 flex items-center gap-1.5 rounded-xl border border-iris-200 px-4 py-2 text-sm font-semibold text-iris-700 hover:bg-iris-50"><ArrowLeft size={16} /><span>返回</span></button>
      </div>
    </div>
  )
}
