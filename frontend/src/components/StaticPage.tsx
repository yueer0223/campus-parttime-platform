import type { ReactNode } from 'react'

export default function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-ink">{title}</h1>
      <div className="mt-6 space-y-4 rounded-3xl bg-white/95 p-7 text-sm leading-relaxed text-ink-soft shadow-soft">
        {children}
      </div>
    </div>
  )
}
