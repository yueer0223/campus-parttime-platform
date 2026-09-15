import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { complaintApi } from '../api/complaints'
import { taskApi } from '../api/tasks'
import type { Complaint, Task } from '../types'
import { getErrorMessage } from '../utils'

export default function AdminReviewPage() {
  const [tab, setTab] = useState<'tasks' | 'complaints'>('tasks')
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [error, setError] = useState('')

  const loadTasks = async () => {
    try {
      setPendingTasks(await taskApi.pending())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const loadComplaints = async () => {
    try {
      setComplaints(await complaintApi.list())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void loadTasks()
    void loadComplaints()
  }, [])

  const approve = async (id: number) => {
    await taskApi.approve(id).catch((e) => setError(getErrorMessage(e)))
    await loadTasks()
  }

  const reject = async (id: number) => {
    await taskApi.reject(id).catch((e) => setError(getErrorMessage(e)))
    await loadTasks()
  }

  const handleComplaint = async (id: number, status: string) => {
    await complaintApi.handle(id, { status }).catch((e) => setError(getErrorMessage(e)))
    await loadComplaints()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="font-display text-4xl font-bold text-ink">审核管理</h1>
        <div className="ml-auto flex gap-1 rounded-xl bg-iris-50 p-1">
          <button onClick={() => setTab('tasks')} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === 'tasks' ? 'bg-white text-iris-700 shadow-sm' : 'text-ink-muted'}`}>待审核任务</button>
          <button onClick={() => setTab('complaints')} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === 'complaints' ? 'bg-white text-iris-700 shadow-sm' : 'text-ink-muted'}`}>投诉处理</button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {tab === 'tasks' ? (
        <div className="flex flex-col gap-3">
          {pendingTasks.length === 0 ? (
            <div className="rounded-3xl bg-white/95 py-16 text-center text-ink-muted shadow-soft">暂无待审核任务</div>
          ) : (
            pendingTasks.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4 rounded-3xl bg-white/95 p-5 shadow-soft">
                <div>
                  <h3 className="font-semibold text-ink">{t.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{t.description}</p>
                  <p className="mt-2 text-xs text-ink-muted">{t.category_name ?? '未分类'} · {t.reward} {t.reward_unit}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => approve(t.id)} className="flex items-center gap-1 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><CheckCircle size={16} />通过</button>
                  <button onClick={() => reject(t.id)} className="flex items-center gap-1 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><XCircle size={16} />拒绝</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {complaints.length === 0 ? (
            <div className="rounded-3xl bg-white/95 py-16 text-center text-ink-muted shadow-soft">暂无投诉</div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="rounded-3xl bg-white/95 p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-ink">{c.reason}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.status === 'pending' ? 'bg-iris-100 text-iris-700' : c.status === 'resolved' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'pending' ? '待处理' : c.status === 'resolved' ? '已处理' : '已驳回'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">任务：{c.task_title ?? c.task_id}</p>
                <p className="mt-1 text-sm text-ink-soft">{c.detail}</p>
                {c.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleComplaint(c.id, 'resolved')} className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90">标记已处理</button>
                    <button onClick={() => handleComplaint(c.id, 'dismissed')} className="rounded-xl border border-iris-200 px-4 py-2 text-sm font-semibold text-iris-700 hover:bg-iris-50">驳回</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
