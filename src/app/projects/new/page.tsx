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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!name.trim()) {
      setError('プロジェクト名を入力してください')
      return
    }

    setLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user

    if (!user) {
      setError('ログイン情報が取得できませんでした')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('projects').insert([
      {
        name,
        status,
        description,
        user_id: user.id,
      },
    ])

    if (insertError) {
      setError('プロジェクトの作成に失敗しました')
      console.error(insertError)
    } else {
      setSuccess(true)
      router.push('/projects')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">プロジェクト名<span className="text-red-500 ml-1">*</span></label>
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
          <label className="block text-sm font-medium text-gray-700">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="プロジェクトの目的や背景、補足情報などを入力できます。"
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
