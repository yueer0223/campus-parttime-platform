import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaperPlaneTilt, Sparkle } from '@phosphor-icons/react'
import { categoryApi } from '../api/categories'
import { polishApi } from '../api/polish'
import { taskApi } from '../api/tasks'
import type { Category } from '../types'
import { getErrorMessage } from '../utils'

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [reward, setReward] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'negotiable'>('fixed')
  const [duration, setDuration] = useState('')
  const [deadline, setDeadline] = useState('')
  const [polishing, setPolishing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [polishNote, setPolishNote] = useState('')

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  const handlePolish = async () => {
    if (!description.trim()) {
      setError('请先填写需求描述')
      return
    }
    setPolishing(true)
    setError('')
    setPolishNote('')
    try {
      const res = await polishApi.polish(description)
      setDescription(res.polished_text)
      setPolishNote(`已由 ${res.provider} 润色完成`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPolishing(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await taskApi.create({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        reward: priceType === 'fixed' ? Number(reward) || 0 : 0,
        reward_unit: '元',
        price_type: priceType,
        duration: duration || undefined,
        deadline: deadline || undefined,
      })
      navigate('/mine')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-ink">发布兼职任务</h1>
        <p className="mt-2 text-ink-muted">填写任务信息，可用 AI 一键润色需求描述</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-3xl bg-white/95 p-7 shadow-soft">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          标题
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：周末商场促销员" className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          需求描述
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="描述工作内容、时间、地点与要求" className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
        </label>
        <button type="button" onClick={handlePolish} disabled={polishing} className="flex items-center justify-center gap-1.5 rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600 disabled:opacity-55">
          <Sparkle size={16} />
          <span>{polishing ? '润色中…' : 'AI 一键润色需求'}</span>
        </button>
        {polishNote && <p className="text-sm text-ink-muted">{polishNote}</p>}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          分类
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none">
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          价格方式
          <select value={priceType} onChange={(e) => setPriceType(e.target.value as 'fixed' | 'negotiable')} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none">
            <option value="fixed">明码标价</option>
            <option value="negotiable">面议（可谈）</option>
          </select>
        </label>
        {priceType === 'fixed' ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            报酬（元）
            <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} min="0" step="0.01" className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
          </label>
        ) : (
          <p className="rounded-xl bg-iris-50 px-4 py-2.5 text-sm text-iris-700">价格面议，接单者申请时可报价，双方谈妥后确定。</p>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          工作时长
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="例如：2-3 小时" className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          截止时间
          <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="例如：3 天内完成" className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="flex items-center justify-center gap-1.5 rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600 disabled:opacity-55">
          <PaperPlaneTilt size={16} />
          <span>{submitting ? '发布中…' : '发布任务'}</span>
        </button>
      </form>
    </div>
  )
}
