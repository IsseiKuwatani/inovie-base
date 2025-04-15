'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewHypothesisPage() {
  const { id: projectId } = useParams()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    assumption: '',
    solution: '',
    expected_effect: '',
    type: '課題仮説',
    status: '未検証',
    impact: 3,
    uncertainty: 3,
    confidence: 3,
  })

  const [error, setError] = useState('')
  const [showHints, setShowHints] = useState(true)

  const hintRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const hint = hintRef.current
    if (!hint) return

    const onMouseDown = (e: MouseEvent) => {
      const startX = e.clientX
      const startY = e.clientY
      const rect = hint.getBoundingClientRect()
      const offsetX = startX - rect.left
      const offsetY = startY - rect.top

      const onMouseMove = (e: MouseEvent) => {
        hint.style.left = `${e.clientX - offsetX}px`
        hint.style.top = `${e.clientY - offsetY}px`
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    hint.querySelector('.drag-header')?.addEventListener('mousedown', onMouseDown)
    return () => {
      hint.querySelector('.drag-header')?.removeEventListener('mousedown', onMouseDown)
    }
  }, [showHints])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSlider = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error: insertError } = await supabase.from('hypotheses').insert([{ ...form, project_id: projectId }])
    if (insertError) {
      setError('仮説の作成に失敗しました')
      return
    }
    router.push(`/projects/${projectId}`)
  }

  const typeHints: Record<string, string[]> = {
    '課題仮説': [
      'どんな現場課題に基づいているか？',
      'ユーザーは本当に困っているか？'
    ],
    '価値仮説': [
      '提供する解決策はユーザーに刺さるか？',
      'どんな変化を生むか？'
    ],
    '市場仮説': [
      'その課題を抱える人はどれくらい？',
      '具体的なターゲットは誰？'
    ],
    '価格仮説': [
      'この価値に対して払ってもらえる金額は？',
      '比較対象とのバランスは？'
    ],
    'チャネル仮説': [
      'どう届ける？認知から獲得までの流れは？',
      '適したチャネルは？'
    ]
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-10 ${!showHints ? 'md:col-span-2' : ''}`}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新規事業向けの仮説を追加</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="仮説タイトル" name="title" value={form.title} onChange={handleChange} />
        <Textarea label="前提（なぜそう考えるか）" name="assumption" value={form.assumption} onChange={handleChange} />
        <Textarea label="解決策（solution）" name="solution" value={form.solution} onChange={handleChange} />
        <Textarea label="期待される効果" name="expected_effect" value={form.expected_effect} onChange={handleChange} />

        <Select label="仮説タイプ" name="type" value={form.type} onChange={handleChange}>
          {Object.keys(typeHints).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Select label="ステータス" name="status" value={form.status} onChange={handleChange}>
          <option value="未検証">未検証</option>
          <option value="検証中">検証中</option>
          <option value="成立">成立</option>
          <option value="否定">否定</option>
        </Select>

        <Slider label="影響度" name="impact" value={form.impact} onChange={handleSlider} />
        <Slider label="不確実性" name="uncertainty" value={form.uncertainty} onChange={handleSlider} />
        <Slider label="確信度" name="confidence" value={form.confidence} onChange={handleSlider} />

        <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700">
          仮説を作成
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {!showHints && (
        <button onClick={() => setShowHints(true)} className="fixed bottom-5 right-5 bg-indigo-600 text-white px-3 py-1 text-sm rounded shadow-md">
          💡 ヒントを見る
        </button>
      )}

      {/* フローティングヒント */}
      {showHints && (
        <div
          ref={hintRef}
          className="fixed bottom-6 right-6 w-72 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 cursor-default"
          style={{ minWidth: '280px' }}
        >
          <div className="drag-header flex justify-between items-center cursor-move mb-2">
            <h2 className="text-sm font-bold text-gray-700">💡 {form.type} のヒント</h2>
            <button onClick={() => setShowHints(false)} className="text-xs text-blue-600 hover:underline">閉じる</button>
          </div>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-2">
            {typeHints[form.type].map((hint, i) => <li key={i}>{hint}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

/* UI Components */
function Input({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input name={name} value={value} onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1" />
    </div>
  )
}

function Textarea({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea name={name} value={value} onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1" rows={3} />
    </div>
  )
}

function Select({ label, name, value, onChange, children }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1">
        {children}
      </select>
    </div>
  )
}

function Slider({ label, name, value, onChange }: { label: string, name: string, value: number, onChange: (name: string, value: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}：<span className="text-gray-900 font-semibold">{value}</span></label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="w-full mt-1 accent-gray-900"
      />
    </div>
  )
}
