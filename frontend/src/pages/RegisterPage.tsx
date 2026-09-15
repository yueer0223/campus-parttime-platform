import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'publisher' | 'receiver'>('receiver')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ username, password, role, nickname: nickname || undefined })
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-soft-scene flex min-h-screen items-center justify-center px-5 py-10">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-md rounded-3xl p-8 shadow-diffuse">
        <div className="mb-7 text-center">
          <div className="mb-3 inline-flex items-center gap-2.5 font-display text-xl font-bold text-iris-700">
            <span className="h-3 w-3 rounded bg-gradient-to-br from-iris-400 to-iris-600" />
            校园兼职信息网
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">创建账号</h1>
          <p className="mt-1 text-sm text-ink-muted">开始你的校园兼职之旅</p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            用户名
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-iris-300 focus:bg-white" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            密码
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-iris-300 focus:bg-white" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            昵称
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-iris-300 focus:bg-white" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            身份
            <select value={role} onChange={(e) => setRole(e.target.value as 'publisher' | 'receiver')} className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none">
              <option value="receiver">接单者</option>
              <option value="publisher">发布者</option>
            </select>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-xl bg-iris-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-iris-600 disabled:opacity-55">
            {loading ? '注册中…' : '注册'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          已有账号？<Link to="/login" className="font-semibold text-iris-700 hover:underline">去登录</Link>
        </p>
      </form>
    </div>
  )
}
