'use client'

import { useState } from 'react'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSlider = (name: keyof typeof form, value: number) => {
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
      '現場の業務で時間がかかっている部分は？',
      '属人化している作業は？',
      '使われていないツールやレポートは？'
    ],
    '価値仮説': [
      'ユーザーにとっての「嬉しい変化」は？',
      'それによりどんなメリットがある？'
    ],
    '市場仮説': [
      'この課題を抱えるのはどの業界・職種？',
      'どれくらいの規模の企業が対象？'
    ],
    '価格仮説': [
      'この価値にいくら払うイメージがあるか？',
      '費用対効果は明確か？'
    ],
    'チャネル仮説': [
      'ユーザーはどこでこの課題と出会っている？',
      'どうやってその情報を届ける？'
    ]
  }

  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-4 py-10">
      {/* 入力フォーム */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">新規事業向けの仮説を追加</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="仮説タイトル" name="title" value={form.title} onChange={handleChange} placeholder="例：経理業務が属人化している" />
          <Textarea label="前提（なぜそう考えるか）" name="assumption" value={form.assumption} onChange={handleChange} />
          <Textarea label="解決策（solution）" name="solution" value={form.solution} onChange={handleChange} />
          <Textarea label="期待される効果" name="expected_effect" value={form.expected_effect} onChange={handleChange} />

          <Select label="仮説の種類" name="type" value={form.type} onChange={handleChange}>
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

          <Slider label="影響度（どれだけ重要か）" name="impact" value={form.impact} onChange={handleSlider} />
          <Slider label="不確実性（どれだけあやふやか）" name="uncertainty" value={form.uncertainty} onChange={handleSlider} />
          <Slider label="確信度（どれくらい自信があるか）" name="confidence" value={form.confidence} onChange={handleSlider} />

          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
            仮説を作成
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>

      {/* ヒントボックス（見やすく改良） */}
      {showHints && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-700">入力のヒント</h2>
            <button onClick={() => setShowHints(false)} className="text-xs text-blue-600 hover:underline">閉じる</button>
          </div>
          <ul className="text-sm text-gray-700 space-y-3 list-disc list-inside">
            {typeHints[form.type].map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* コンポーネント群 */
function Input({ label, name, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded mt-1" />
    </div>
  )
}

function Textarea({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={3}
        className="w-full p-2 border border-gray-300 rounded mt-1" />
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

function Slider({ label, name, value, onChange }: { label: string, name: string, value: number, onChange: (name: any, value: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}：<span className="text-gray-900 font-semibold">{value}</span>
      </label>
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
