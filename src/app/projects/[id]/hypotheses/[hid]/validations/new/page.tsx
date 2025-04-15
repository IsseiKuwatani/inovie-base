'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewValidationPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()

  const [method, setMethod] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error: insertError } = await supabase.from('validations').insert([
      {
        hypothesis_id: hypothesisId,
        method,
        description,
        result,
      },
    ])

    if (insertError) {
      console.error('検証作成エラー:', insertError.message)
      setError('検証の作成に失敗しました')
      return
    }

    router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">検証を追加</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">検証手段</label>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="例：LP経由でアンケート配信"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">検証内容</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="何をどう検証したか、など"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">結果・気づき</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="反応、数値、所感など"
          />
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          検証を登録
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  )
}
