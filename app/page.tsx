'use client'
import { useState, useEffect } from 'react'
import { remaining, canUse, recordUse, FREE_LIMIT } from '@/lib/freemium'

const MODES = [
  { id: 'student', label: '🎓 Студент' },
  { id: 'business', label: '💼 Бизнес' },
  { id: 'blog', label: '✍️ Блог' },
]

const UPGRADE_URL = process.env.NEXT_PUBLIC_STRIPE_URL || '#'

export default function Home() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState('student')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => { setLeft(remaining()) }, [])

  async function run() {
    if (!text.trim()) return
    if (!canUse()) { setError('limit'); return }
    setLoading(true); setError(''); setResult('')

    const res = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Ошибка'); setLoading(false); return }
    recordUse()
    setLeft(remaining())
    setResult(data.result)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪄</span>
          <span className="font-bold text-xl">HumanizeRU</span>
        </div>
        {left !== null && (
          <span className="text-zinc-400 text-sm">
            Осталось: <span className="text-emerald-400 font-semibold">{left}</span>/{FREE_LIMIT} бесплатно
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Сделай AI-текст<br /><span className="text-emerald-400">человеческим</span>
        </h1>
        <p className="text-zinc-400 text-lg">
          Перепиши текст из ChatGPT так, чтобы он прошёл проверку на AI-детекторах.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex gap-2">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                  mode === m.id ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}>{m.label}</button>
            ))}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400 text-sm">Исходный текст</span>
              <span className={`text-xs ${text.length > 7500 ? 'text-red-400' : 'text-zinc-500'}`}>{text.length}/8000</span>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} maxLength={8000}
              placeholder="Вставьте текст, написанный ИИ..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 resize-none" />
          </div>

          <button onClick={run} disabled={loading || !text.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">⟳</span> Обрабатываю...</> : 'Очеловечить →'}
          </button>

          {error === 'limit' ? (
            <div className="bg-zinc-800 rounded-xl p-5 text-center">
              <p className="font-semibold mb-2">Бесплатные попытки закончились</p>
              <p className="text-zinc-400 text-sm mb-4">Перейдите на Pro для безлимитного доступа — $19/мес</p>
              <a href={UPGRADE_URL} className="inline-block bg-emerald-600 hover:bg-emerald-700 font-semibold px-6 py-3 rounded-xl transition">Перейти на Pro →</a>
            </div>
          ) : error ? <p className="text-red-400 text-sm">{error}</p> : null}

          {result && (
            <div className="bg-zinc-800 rounded-xl p-5">
              <div className="flex justify-between mb-3">
                <span className="text-zinc-400 text-sm">Результат</span>
                <button onClick={() => navigator.clipboard.writeText(result)} className="text-emerald-400 text-sm hover:text-emerald-300">Копировать</button>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
