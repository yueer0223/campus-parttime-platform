import { useEffect, useState } from 'react'
import { userApi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import type { Role, User } from '../types'
import { getErrorMessage, roleLabel } from '../utils'

export default function AdminUsersPage() {
  const { user: current } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')

  const load = () => {
    userApi.list().then(setUsers).catch((err) => setError(getErrorMessage(err)))
  }

  useEffect(() => {
    load()
  }, [])

  const changeRole = async (id: number, role: Role) => {
    setError('')
    try {
      await userApi.changeRole(id, role)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <h1 className="font-display text-4xl font-bold text-ink">用户管理</h1>
        <p className="mt-2 text-ink-muted">查看平台用户并调整角色权限</p>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-3xl bg-white/95 shadow-soft">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-iris-50 text-left text-ink-muted">
              <th className="px-5 py-3.5 font-medium">ID</th>
              <th className="px-5 py-3.5 font-medium">用户名</th>
              <th className="px-5 py-3.5 font-medium">昵称</th>
              <th className="px-5 py-3.5 font-medium">角色</th>
              <th className="px-5 py-3.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-iris-50">
                <td className="px-5 py-3.5 text-ink-muted">{u.id}</td>
                <td className="px-5 py-3.5 text-ink">{u.username}</td>
                <td className="px-5 py-3.5 text-ink">{u.nickname ?? '-'}</td>
                <td className="px-5 py-3.5 text-ink">{roleLabel[u.role]}</td>
                <td className="px-5 py-3.5">
                  {current?.id !== u.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      className="rounded-lg border border-iris-100 px-3 py-1.5 text-sm text-ink outline-none"
                    >
                      <option value="admin">管理员</option>
                      <option value="publisher">发布者</option>
                      <option value="receiver">接单者</option>
                    </select>
                  ) : (
                    <span className="text-ink-muted">当前账号</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
