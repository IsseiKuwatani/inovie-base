'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ProjectCreatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('検証中')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ✅ ログイン中ユーザーの情報を取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const user = sessionData?.session?.user

    if (!user) {
      alert('ログインが必要です')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('projects').insert([
      {
        name,
        status,
        description,
        user_id: user.id // ✅ ← ここ！
      }
    ])

    setLoading(false)

    if (error) {
      alert('登録に失敗しました')
      console.error(error)
    } else {
      router.push('/projects')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold">新規プロジェクト作成</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">プロジェクト名</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mt-1"
          >
            <option>検証中</option>
            <option>仮説整理中</option>
            <option>完了</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700"
        >
          {loading ? '登録中...' : 'プロジェクトを作成'}
        </button>
      </form>
    </div>
  )
}

