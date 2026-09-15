import { useEffect, useState } from 'react'
import { userApi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import type { MyStats } from '../types'
import { getErrorMessage, roleLabel } from '../utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [wechat, setWechat] = useState(user?.wechat ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stats, setStats] = useState<MyStats | null>(null)

  useEffect(() => {
    userApi.myStats().then(setStats).catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const saveProfile = async () => {
    setError('')
    setNotice('')
    try {
      const updated = await userApi.updateProfile({
        nickname: nickname || undefined,
        phone: phone || undefined,
        wechat: wechat || undefined,
      })
      localStorage.setItem('user', JSON.stringify(updated))
      setNotice('资料已更新')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const changePassword = async () => {
    setError('')
    setNotice('')
    try {
      await userApi.changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setNotice('密码已修改')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-ink">个人资料</h1>
        <p className="mt-2 text-ink-muted">当前账号：{user?.username} · {user ? roleLabel[user.role] : ''}</p>
      </div>

      <div className="mb-6 rounded-3xl bg-gradient-to-br from-iris-100 via-cream-50 to-iris-50 p-6 shadow-soft">
        <p className="text-sm text-ink-muted">{today}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <b className="text-3xl font-bold tabular-nums text-iris-700">¥{stats?.earnings ?? 0}</b>
            <span className="text-sm text-ink-muted">累积收入</span>
          </div>
          <div className="flex flex-col gap-1">
            <b className="text-3xl font-bold tabular-nums text-ink">{stats?.completed_count ?? 0}</b>
            <span className="text-sm text-ink-muted">完成单数</span>
          </div>
          <div className="flex flex-col gap-1">
            <b className="text-3xl font-bold tabular-nums text-ink">{stats?.published_count ?? 0}</b>
            <span className="text-sm text-ink-muted">发布任务</span>
          </div>
          <div className="flex flex-col gap-1">
            <b className="text-3xl font-bold tabular-nums text-ink">{stats?.avg_rating ?? '-'}</b>
            <span className="text-sm text-ink-muted">平均评分</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-3xl bg-white/95 p-7 shadow-soft">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            昵称
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            手机号
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            微信号
            <input value={wechat} onChange={(e) => setWechat(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
          </label>
          <button onClick={saveProfile} className="rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600">保存资料</button>
        </div>

        <div className="border-t border-iris-50 pt-6">
          <h2 className="font-semibold text-ink">修改密码</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              原密码
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              新密码
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl border border-iris-100 px-4 py-2.5 text-ink outline-none focus:border-iris-400" />
            </label>
            <button onClick={changePassword} className="rounded-xl bg-iris-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-iris-600">修改密码</button>
          </div>
        </div>

        {notice && <p className="text-sm text-success">{notice}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  )
}
