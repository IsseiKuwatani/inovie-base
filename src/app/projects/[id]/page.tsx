'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { MapPinned } from 'lucide-react'

export default function ProjectDetailPage() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [hypotheses, setHypotheses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single()
      const { data: hypothesisData } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setProject(projectData)
      setHypotheses(hypothesisData || [])
      setLoading(false)
    }

    fetchData()
  }, [projectId])

  if (loading) return <p className="text-gray-500">読み込み中...</p>
  if (!project) return <p className="text-red-500">プロジェクトが見つかりません</p>

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600 mt-1">{project.description}</p>
      </header>

      <div className="flex justify-between items-center mt-6">
        <h2 className="text-xl font-semibold text-gray-800">仮説一覧</h2>
        <div className="flex gap-3">
          <Link
            href={`/projects/${projectId}/hypotheses/map`}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <MapPinned size={16} />
            マップで表示
          </Link>
          <Link
            href={`/projects/${projectId}/hypotheses/new`}
            className="text-sm px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-700"
          >
            ＋ 仮説を追加
          </Link>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hypotheses.map((h) => (
          <li key={h.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">{h.title}</h3>
            <p className="text-sm text-gray-600"><strong>前提:</strong> {h.assumption || '―'}</p>
            <p className="text-sm text-gray-600"><strong>期待効果:</strong> {h.expected_effect || '―'}</p>
            <p className="text-sm text-gray-500"><strong>ステータス:</strong> {h.status}</p>
            <Link
              href={`/projects/${projectId}/hypotheses/${h.id}`}
              className="text-blue-600 text-sm hover:underline"
            >
              ▶ 詳細を見る
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
