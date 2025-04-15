'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewHypothesisPage() {
  const { id: projectId } = useParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [assumption, setAssumption] = useState('')
  const [solution, setSolution] = useState('')
  const [expectedEffect, setExpectedEffect] = useState('')
  const [type, setType] = useState('課題仮説')
  const [status, setStatus] = useState('未検証')
  const [impact, setImpact] = useState(3)
  const [uncertainty, setUncertainty] = useState(3)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error: insertError } = await supabase.from('hypotheses').insert([
      {
        project_id: projectId,
        title,
        assumption,
        solution,
        expected_effect: expectedEffect,
        type,
        status,
        impact,
        uncertainty,
      },
    ])

    if (insertError) {
      setError('仮説の作成に失敗しました')
      return
    }

    router.push(`/projects/${projectId}/hypotheses`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">仮説を追加</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* タイトル */}
        <div>
          <label className="block text-sm font-medium text-gray-700">仮説タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="例：業務管理が属人化している"
          />
        </div>

        {/* 前提 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">前提（なぜそう考えるか）</label>
          <textarea
            value={assumption}
            onChange={(e) => setAssumption(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={2}
          />
        </div>

        {/* 解決策 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">解決策の仮説</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={2}
          />
        </div>

        {/* 期待される効果 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">期待される効果</label>
          <textarea
            value={expectedEffect}
            onChange={(e) => setExpectedEffect(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={2}
          />
        </div>

        {/* 種類・ステータス */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">仮説の種類</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="課題仮説">課題仮説</option>
              <option value="価値仮説">価値仮説</option>
              <option value="市場仮説">市場仮説</option>
              <option value="価格仮説">価格仮説</option>
              <option value="チャネル仮説">チャネル仮説</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="未検証">未検証</option>
              <option value="検証中">検証中</option>
              <option value="成立">成立</option>
              <option value="否定">否定</option>
            </select>
          </div>
        </div>

        {/* スライダー2つ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">影響度</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500">現在の影響度: {impact}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">不確実性</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={uncertainty}
              onChange={(e) => setUncertainty(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500">現在の不確実性: {uncertainty}</p>
          </div>
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          仮説を作成
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  )
}
