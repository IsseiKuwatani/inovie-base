'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function HypothesisDetailPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()
  const [hypothesis, setHypothesis] = useState<any>(null)
  const [validations, setValidations] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: hypothesisData, error: hError } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()

      const { data: validationsData, error: vError } = await supabase
        .from('validations')
        .select('*')
        .eq('hypothesis_id', hypothesisId)
        .order('created_at', { ascending: false })

      if (hError || vError) {
        console.error('読み込みエラー:', hError || vError)
        setError('データの取得に失敗しました')
      } else {
        setHypothesis(hypothesisData)
        setValidations(validationsData)
      }
    }

    fetchData()
  }, [hypothesisId])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!hypothesis) return <p className="text-gray-500">読み込み中...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{hypothesis.title}</h1>

      <div className="space-y-3 text-sm text-gray-800">
        <p><strong>種類:</strong> {hypothesis.type}</p>
        <p><strong>ステータス:</strong> {hypothesis.status}</p>
        <p><strong>前提:</strong> {hypothesis.assumption || '（記載なし）'}</p>
        <p><strong>解決策:</strong> {hypothesis.solution || '（記載なし）'}</p>
        <p><strong>期待される効果:</strong> {hypothesis.expected_effect || '（記載なし）'}</p>
      </div>

      <div>
        <Link
          href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/new`}
          className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          ＋ 検証を追加
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">検証履歴</h2>
        {validations.length === 0 ? (
          <p className="text-sm text-gray-500">まだ検証は登録されていません。</p>
        ) : (
          validations.map((v) => (
            <div key={v.id} className="border p-4 rounded-md bg-white shadow-sm space-y-2">
              <p className="text-sm text-gray-700"><strong>手段:</strong> {v.method}</p>
              <p className="text-sm text-gray-700"><strong>内容:</strong> {v.description}</p>
              <p className="text-sm text-gray-700"><strong>結果:</strong> {v.result}</p>
              <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleString()}</p>
              <div className="flex gap-4 text-sm mt-2">
                <button
                  onClick={() => router.push(`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${v.id}/edit`)}
                  className="text-blue-600 hover:underline"
                >
                  編集
                </button>
                <button
                  onClick={async () => {
                    if (confirm('この検証を削除しますか？')) {
                      await supabase.from('validations').delete().eq('id', v.id)
                      setValidations((prev) => prev.filter((item) => item.id !== v.id))
                    }
                  }}
                  className="text-red-600 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
