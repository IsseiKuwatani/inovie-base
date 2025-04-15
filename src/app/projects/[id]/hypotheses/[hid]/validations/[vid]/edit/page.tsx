'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditValidationPage() {
  const { id: projectId, hid: hypothesisId, vid: validationId } = useParams()
  const router = useRouter()

  const [method, setMethod] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchValidation = async () => {
      const { data, error } = await supabase
        .from('validations')
        .select('*')
        .eq('id', validationId)
        .single()

      if (error) {
        console.error('読み込みエラー:', error.message)
        setError('検証データの取得に失敗しました')
      } else {
        setMethod(data.method)
        setDescription(data.description || '')
        setResult(data.result || '')
      }

      setLoading(false)
    }

    fetchValidation()
  }, [validationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error: updateError } = await supabase
      .from('validations')
      .update({
        method,
        description,
        result,
      })
      .eq('id', validationId)

    if (updateError) {
      console.error('更新エラー:', updateError.message)
      setError('検証の更新に失敗しました')
      return
    }

    router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">検証を編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">検証手段</label>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">検証内容</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">結果・気づき</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          保存する
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  )
}
