import type { Role, TaskStatus } from './types'

export const roleLabel: Record<Role, string> = {
  admin: '管理员',
  publisher: '发布者',
  receiver: '接单者',
}

export const statusLabel: Record<TaskStatus, string> = {
  pending: '待审核',
  open: '待接单',
  applied: '待确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '未通过',
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response
    const detail = response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  if (error instanceof Error && error.message) return error.message
  return '请求失败，请稍后重试'
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}
