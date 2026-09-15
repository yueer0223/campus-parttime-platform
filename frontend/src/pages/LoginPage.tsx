import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(from || (user.role === 'admin' ? '/admin/dashboard' : '/'), { replace: true })
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
          <h1 className="font-display text-3xl font-bold text-ink">欢迎回来</h1>
          <p className="mt-1 text-sm text-ink-muted">登录后发布或接取校园兼职任务</p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            用户名
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-iris-300 focus:bg-white" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            密码
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 text-ink outline-none transition focus:border-iris-300 focus:bg-white" />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-xl bg-iris-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-iris-600 disabled:opacity-55">
            {loading ? '登录中…' : '登录'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          还没有账号？<Link to="/register" className="font-semibold text-iris-700 hover:underline">去注册</Link>
        </p>
      </form>
    </div>
  )
}
