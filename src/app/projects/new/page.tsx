'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('未着手')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!name.trim()) {
      setError('プロジェクト名を入力してください')
      return
    }

    setLoading(true)

    try {
      const session = await supabase.auth.getSession()
      const token = session?.data.session?.access_token

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          status,
          description,
          autoGenerateHypotheses: autoGenerate
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'プロジェクトの作成に失敗しました')
      } else {
        setSuccess(true)
        router.push('/projects')
      }
    } catch (err) {
      console.error('API呼び出しエラー:', err)
      setError('予期せぬエラーが発生しました')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">プロジェクト名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="例：新サービスαの検証"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="未着手">未着手</option>
            <option value="進行中">進行中</option>
            <option value="完了">完了</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="プロジェクトの目的や背景を入力"
          />
        </div>

        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-3 shadow-sm">
          <label htmlFor="autoGenerate" className="flex flex-col cursor-pointer">
            <span className="text-sm font-medium text-gray-800">仮説を自動生成</span>
            <span className="text-xs text-gray-500">AIが初期仮説を自動で追加します（任意）</span>
          </label>
          <input
            id="autoGenerate"
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
        >
          {loading ? '作成中...' : '作成する'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">プロジェクトを作成しました！</p>}
    </div>
  )
}
