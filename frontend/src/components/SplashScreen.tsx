import { useEffect, useState } from 'react'

const QUOTES = [
  { en: 'Every flower blooms in its own time', zh: '每一朵花，都有自己的花期' },
  { en: 'Small steps every day', zh: '每天进步一点点' },
  { en: 'Your effort will bloom', zh: '你的努力终会开花' },
  { en: 'A new day, a fresh start', zh: '新的一天，全新的开始' },
]

export default function SplashScreen() {
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2400)
    const t2 = setTimeout(() => setDone(true), 2950)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (done) return null

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img src="/bloom.jpg" className="absolute inset-0 h-full w-full object-cover" alt="" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <h1 className="splash-title font-display text-4xl font-bold text-iris-700 md:text-5xl">
          校园兼职信息网
        </h1>
        <p className="splash-fade mt-8 font-display text-xl text-ink-soft">{quote.en}</p>
        <p className="splash-fade mt-3 text-sm tracking-[0.2em] text-ink-muted">{quote.zh}</p>
      </div>
    </div>
  )
}
