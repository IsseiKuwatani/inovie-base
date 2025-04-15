'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Pencil,
  ArrowLeft,
  FlaskConical,
  Calendar,
  Grid3x3,
  Trash2,
  Edit2
} from 'lucide-react'

export default function HypothesisDetailPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()
  const [hypothesis, setHypothesis] = useState<any>(null)
  const [validations, setValidations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHypothesis = async () => {
      const { data } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()
      setHypothesis(data)
    }

    const fetchValidations = async () => {
      const { data } = await supabase
        .from('validations')
        .select('*')
        .eq('hypothesis_id', hypothesisId)
        .order('created_at', { ascending: false })
      setValidations(data || [])
    }

    Promise.all([fetchHypothesis(), fetchValidations()]).finally(() =>
      setLoading(false)
    )
  }, [hypothesisId])

  const handleDelete = async (validationId: string) => {
    const confirm = window.confirm('この検証を削除してもよろしいですか？')
    if (!confirm) return

    const { error } = await supabase
      .from('validations')
      .delete()
      .eq('id', validationId)

    if (!error) {
      setValidations((prev) => prev.filter((v) => v.id !== validationId))
    }
  }

  const statusColorMap: Record<string, string> = {
    未検証: 'bg-gray-400',
    検証中: 'bg-blue-500',
    成立: 'bg-green-600',
    否定: 'bg-red-500',
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>
  if (!hypothesis) return <p className="text-red-500">仮説が見つかりません</p>

  const statusColor = statusColorMap[hypothesis.status] || 'bg-gray-300'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* ヘッダー */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={16} />
            一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{hypothesis.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-white text-xs px-2 py-1 rounded ${statusColor}`}>
              {hypothesis.status}
            </span>
            <span className="text-xs text-gray-500 border px-2 py-1 rounded">
              {hypothesis.type}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/hypotheses/${hypothesisId}/edit`}
            className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-500"
          >
            <Pencil size={16} />
            編集
          </Link>
          <Link
            href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/new`}
            className="flex items-center gap-1 text-sm bg-gray-100 text-gray-800 px-3 py-2 rounded hover:bg-gray-200"
          >
            <FlaskConical size={16} />
            検証を追加
          </Link>
        </div>
      </div>

      {/* 詳細表示 */}
      <div className="grid md:grid-cols-2 gap-6">
        <DetailBlock label="前提" value={hypothesis.assumption} />
        <DetailBlock label="解決策" value={hypothesis.solution} />
        <DetailBlock label="期待される効果" value={hypothesis.expected_effect} />
        <div className="flex flex-col space-y-1">
          <p className="text-xs text-gray-500">影響度(縦軸) × 不確実性(横軸)</p>
          <MiniMap impact={hypothesis.impact} uncertainty={hypothesis.uncertainty} />
        </div>
      </div>

      {/* 検証履歴 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <FlaskConical size={18} />
          検証履歴
        </h2>

        {validations.length === 0 ? (
  <p className="text-sm text-gray-500">まだ検証は登録されていません。</p>
) : (
  <ul className="space-y-4">
    {validations.map((v) => (
      <li key={v.id} className="bg-white border rounded-lg shadow-sm p-4 relative group">
        <div className="flex justify-between items-start">
          {/* 左：検証情報 */}
          <div className="space-y-2 w-full">
            <p className="text-sm text-gray-800">
              <Calendar size={14} className="inline-block mr-1" />
              {new Date(v.created_at).toLocaleString()}
            </p>

            <div>
              <p className="text-xs text-gray-500">検証手段</p>
              <p className="text-sm text-gray-900">{v.method || '（未入力）'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">検証内容</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{v.description || '（未入力）'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">結果・気づき</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{v.result || '（未入力）'}</p>
            </div>
          </div>

          {/* 右：操作アイコン */}
          <div className="flex gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <Link
               href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${v.id}/edit`}
              className="text-blue-600 hover:text-blue-800"
              title="編集"
            >
              <Edit2 size={16} />
            </Link>
            <button
              onClick={() => handleDelete(v.id)}
              className="text-red-500 hover:text-red-700"
              title="削除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </li>
    ))}
  </ul>
)}

      </div>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
        {value || '―'}
      </div>
    </div>
  )
}

function MiniMap({ impact, uncertainty }: { impact: number; uncertainty: number }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex">
        <div className="flex flex-col justify-center mr-2 text-xs text-gray-500 space-y-1">
          {[5, 4, 3, 2, 1].map((i) => (
            <div key={`impact-${i}`} className="h-4 flex items-center justify-end w-6">
              {i}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1 bg-gray-100 p-2 rounded border">
          {[5, 4, 3, 2, 1].map((i) =>
            [1, 2, 3, 4, 5].map((u) => {
              const active = i === impact && u === uncertainty
              return (
                <div
                  key={`${i}-${u}`}
                  className={`h-4 w-4 rounded-sm ${active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  title={`影響度 ${i} / 不確実性 ${u}`}
                />
              )
            })
          )}
        </div>
      </div>
      <div className="flex justify-center mt-2 ml-8 gap-2 text-xs text-gray-500">
        {[1, 2, 3, 4, 5].map((u) => (
          <div key={`uncertainty-${u}`} className="w-4 text-center">
            {u}
          </div>
        ))}
      </div>
    </div>
  )
}
