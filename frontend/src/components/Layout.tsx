import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChartBar,
  ClipboardText,
  House,
  List,
  PlusCircle,
  SignOut,
  UserCircle,
  Users,
} from '@phosphor-icons/react'
import { notificationApi } from '../api/notifications'
import { useAuth } from '../context/AuthContext'
import type { Notification } from '../types'
import { formatRelativeTime, roleLabel } from '../utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-iris-100 text-iris-700'
      : 'text-ink-soft hover:bg-iris-50 hover:text-iris-700'
  }`

const bottomTabClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${
    isActive ? 'text-iris-700' : 'text-ink-muted'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    notificationApi.unreadCount().then((d) => setUnread(d.count)).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/api/ws?token=${token}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'card_exchange_request') {
          setToast(`${data.from_name} 请求与你交换名片`)
        } else if (data.type === 'card_exchange_completed') {
          setToast(`名片交换成功，可查看「${data.task_title}」的联系方式`)
        }
      } catch {
        /* ignore */
      }
    }
    return () => ws.close()
  }, [user])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const toggleNotif = async () => {
    if (notifOpen) {
      setNotifOpen(false)
      return
    }
    try {
      setNotifications(await notificationApi.list())
      setNotifOpen(true)
    } catch {
      /* ignore */
    }
  }

  const markAllRead = async () => {
    await notificationApi.readAll().catch(() => {})
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const navItems = [
    { to: '/', label: '任务大厅', icon: <House size={18} />, end: true, show: true },
    {
      to: '/tasks/new',
      label: '发布任务',
      icon: <PlusCircle size={18} />,
      show: user?.role === 'publisher' || user?.role === 'admin',
    },
    { to: '/mine', label: '我的任务', icon: <ClipboardText size={18} />, show: !!user },
    { to: '/admin/dashboard', label: '数据看板', icon: <ChartBar size={18} />, show: user?.role === 'admin' },
    { to: '/admin/review', label: '审核管理', icon: <Users size={18} />, show: user?.role === 'admin' },
  ].filter((item) => item.show)

  return (
    <div className="min-h-screen">
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-sm text-white shadow-diffuse">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-iris-100 bg-white px-4 py-3 md:h-16 md:px-6">
        <Link to="/" className="order-1 flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold text-iris-700">
          <span className="h-3 w-3 rounded bg-gradient-to-br from-iris-400 to-iris-600 shadow-sm" />
          校园兼职信息网
        </Link>

        <nav className="order-2 hidden flex-1 items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="order-3 ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={toggleNotif}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-iris-50 hover:text-iris-700"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-iris-100 bg-white p-2 shadow-diffuse">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-semibold text-ink">通知</span>
                      <button onClick={markAllRead} className="text-xs font-medium text-iris-700 hover:underline">全部已读</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-ink-muted">暂无通知</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`rounded-xl px-3 py-2.5 ${n.is_read ? '' : 'bg-iris-50'}`}>
                            <p className="text-sm leading-snug text-ink">{n.content}</p>
                            <p className="mt-0.5 text-xs text-ink-muted">{formatRelativeTime(n.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="hidden text-sm text-ink-muted md:inline">
                {user.nickname || user.username} · {roleLabel[user.role]}
              </span>
              <NavLink to="/profile" className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-iris-50 hover:text-iris-700 md:flex" title="个人资料">
                <UserCircle size={20} />
              </NavLink>
              <button
                onClick={handleLogout}
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-iris-50 hover:text-iris-700 md:flex"
                title="退出"
              >
                <SignOut size={20} />
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-iris-50 hover:text-iris-700 md:hidden"
                title="菜单"
              >
                <List size={24} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-iris-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-iris-600"
            >
              登录 / 注册
            </Link>
          )}
        </div>

      </header>

      {menuOpen && user && (
        <>
          <div className="fixed inset-0 z-30 bg-black/25 md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed inset-x-0 top-16 z-40 flex flex-col gap-1 border-b border-iris-100 bg-white px-4 py-3 shadow-diffuse md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
            <NavLink to="/profile" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              <UserCircle size={18} />
              <span>个人资料</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-iris-50 hover:text-iris-700"
            >
              <SignOut size={18} />
              <span>退出</span>
            </button>
          </div>
        </>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-iris-100 bg-white md:hidden">
        <NavLink to="/" end className={bottomTabClass}>
          <House size={22} />
          <span>大厅</span>
        </NavLink>
        <NavLink to="/tasks/new" className={bottomTabClass}>
          <PlusCircle size={22} />
          <span>发布</span>
        </NavLink>
        <NavLink to="/notifications" className={bottomTabClass}>
          <Bell size={22} />
          <span>通知</span>
        </NavLink>
        <NavLink to="/mine" className={bottomTabClass}>
          <ClipboardText size={22} />
          <span>我的</span>
        </NavLink>
      </nav>

      <footer className="hidden border-t border-iris-100 bg-white/60 px-5 py-8 text-center text-sm text-ink-muted md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2">
          <Link to="/about" className="hover:text-iris-700">关于我们</Link>
          <Link to="/terms" className="hover:text-iris-700">用户协议</Link>
          <Link to="/privacy" className="hover:text-iris-700">隐私政策</Link>
          <Link to="/developer" className="hover:text-iris-700">开发者信息处理</Link>
        </div>
        <p className="mt-3">校园兼职信息网 · 仅用于课程实践演示</p>
      </footer>
    </div>
  )
}
