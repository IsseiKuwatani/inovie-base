'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditHypothesisPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
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
    confidence: 3, // ✅ 追加
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHypothesis = async () => {
      const { data, error } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()
  
      if (error) {
        setError('データ取得に失敗しました')
      } else if (data) {
        setForm({
          title: data.title ?? '',
          assumption: data.assumption ?? '',
          solution: data.solution ?? '',
          expected_effect: data.expected_effect ?? '',
          type: data.type ?? '課題仮説',
          status: data.status ?? '未検証',
          impact: data.impact ?? 3,
          uncertainty: data.uncertainty ?? 3,
          confidence: data.confidence ?? 3, // ← null対策
        })
      }
  
      setLoading(false)
    }
  
    fetchHypothesis()
  }, [hypothesisId])
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: 'impact' | 'uncertainty' | 'confidence', value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase
      .from('hypotheses')
      .update(form)
      .eq('id', hypothesisId)

    if (error) {
      setError('更新に失敗しました')
    } else {
      router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
    }
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6 bg-white rounded shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">仮説を編集</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="仮説タイトル" name="title" value={form.title} onChange={handleChange} />
        <Textarea label="前提（なぜそう考えるか）" name="assumption" value={form.assumption} onChange={handleChange} />
        <Textarea label="解決策（solution）" name="solution" value={form.solution} onChange={handleChange} />
        <Textarea label="期待される効果" name="expected_effect" value={form.expected_effect} onChange={handleChange} />

        <Select label="仮説タイプ" name="type" value={form.type} onChange={handleChange}>
          <option value="課題仮説">課題仮説</option>
          <option value="価値仮説">価値仮説</option>
          <option value="市場仮説">市場仮説</option>
          <option value="価格仮説">価格仮説</option>
          <option value="チャネル仮説">チャネル仮説</option>
        </Select>

        <Select label="ステータス" name="status" value={form.status} onChange={handleChange}>
          <option value="未検証">未検証</option>
          <option value="検証中">検証中</option>
          <option value="成立">成立</option>
          <option value="否定">否定</option>
        </Select>

        <Slider label="影響度" name="impact" value={form.impact} onChange={handleSliderChange} />
        <Slider label="不確実性" name="uncertainty" value={form.uncertainty} onChange={handleSliderChange} />
        <Slider label="確信度" name="confidence" value={form.confidence} onChange={handleSliderChange} />

        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-500 transition"
        >
          保存する
        </button>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  )
}

/* UI Components */
function Input({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-indigo-500"
      />
    </div>
  )
}

function Textarea({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-indigo-500"
        rows={3}
      />
    </div>
  )
}

function Select({ label, name, value, onChange, children }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded mt-1 bg-white focus:ring-indigo-500"
      >
        {children}
      </select>
    </div>
  )
}

function Slider({
  label,
  name,
  value,
  onChange,
}: {
  label: string
  name: 'impact' | 'uncertainty' | 'confidence'
  value: number
  onChange: (name: 'impact' | 'uncertainty' | 'confidence', value: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}：<span className="font-semibold text-indigo-600">{value}</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="w-full appearance-none h-2 rounded bg-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
