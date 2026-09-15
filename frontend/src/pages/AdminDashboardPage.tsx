import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '../api/stats'
import type { DashboardStats, TaskStatus } from '../types'
import { getErrorMessage, statusLabel } from '../utils'

const statusColor: Record<string, string> = {
  open: '#7c5fd8',
  in_progress: '#3b7bc9',
  completed: '#2f9e6e',
  cancelled: '#9aa0ae',
}

const titleStyle = { color: '#2a2636', fontSize: 15, fontWeight: 600 }
const axisLineStyle = { color: '#dcd3f5' }
const splitLineStyle = { color: '#ede9fa' }
const axisLabelStyle = { color: '#8a85a0' }

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    statsApi.dashboard().then(setStats).catch((err) => setError(getErrorMessage(err)))
  }, [])

  if (error) return <div className="py-10 text-danger">{error}</div>
  if (!stats) return <div className="py-20 text-center text-ink-muted">正在加载看板数据…</div>

  const statusOption: any = {
    title: { text: '任务状态分布', left: 'center', textStyle: titleStyle },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
        label: { color: '#5b5670' },
        data: stats.status_distribution.map((s) => ({
          name: statusLabel[s.status as TaskStatus] ?? s.status,
          value: s.count,
          itemStyle: { color: statusColor[s.status] ?? '#7c5fd8' },
        })),
      },
    ],
  }

  const categoryOption: any = {
    title: { text: '任务分类分布', left: 'center', textStyle: titleStyle },
    tooltip: { trigger: 'axis' },
    grid: { left: 44, right: 20, top: 54, bottom: 30 },
    xAxis: {
      type: 'category',
      data: stats.category_distribution.map((c) => c.name),
      axisLine: { lineStyle: axisLineStyle },
      axisLabel: { color: '#8a85a0', interval: 0, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: splitLineStyle },
      axisLabel: axisLabelStyle,
    },
    series: [
      {
        type: 'bar',
        barWidth: '45%',
        itemStyle: { color: '#7c5fd8', borderRadius: [6, 6, 0, 0] },
        data: stats.category_distribution.map((c) => c.count),
      },
    ],
  }

  const trendOption: any = {
    title: { text: '近 14 天发布趋势', left: 'center', textStyle: titleStyle },
    tooltip: { trigger: 'axis' },
    grid: { left: 44, right: 20, top: 54, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.daily_trend.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: axisLineStyle },
      axisLabel: { color: '#8a85a0' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: splitLineStyle },
      axisLabel: axisLabelStyle,
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7c5fd8', width: 2.5 },
        itemStyle: { color: '#7c5fd8' },
        areaStyle: { color: 'rgba(124, 95, 216, 0.12)' },
        data: stats.daily_trend.map((d) => d.count),
      },
    ],
  }

  const metrics = [
    { label: '总任务', value: stats.total_tasks },
    { label: '总用户', value: stats.total_users },
    { label: '待接单', value: stats.open_tasks },
    { label: '进行中', value: stats.in_progress_tasks },
    { label: '已完成', value: stats.completed_tasks },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7">
        <h1 className="font-display text-4xl font-bold text-ink">数据看板</h1>
        <p className="mt-2 text-ink-muted">平台任务与用户的整体运行概况</p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-3xl bg-white/95 p-2 shadow-soft sm:grid-cols-5">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col gap-1 px-5 py-4 ${i > 0 ? 'border-l border-iris-50' : ''} ${i >= 2 ? 'max-sm:border-l-0 max-sm:border-t max-sm:border-iris-50' : ''}`}
          >
            <b className="text-3xl font-bold tabular-nums text-iris-700">{m.value}</b>
            <span className="text-sm text-ink-muted">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/95 p-4 shadow-soft">
          <ReactECharts option={statusOption} style={{ height: 320 }} />
        </div>
        <div className="rounded-3xl bg-white/95 p-4 shadow-soft">
          <ReactECharts option={categoryOption} style={{ height: 320 }} />
        </div>
        <div className="rounded-3xl bg-white/95 p-4 shadow-soft lg:col-span-2">
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        </div>
      </div>
    </div>
  )
}
