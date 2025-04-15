'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { MapPinned, ListTree } from 'lucide-react'

export default function ProjectDashboardPage() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [hypotheses, setHypotheses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single()
      const { data: hypothesisData } = await supabase
        .from('hypotheses')
        .select('id, status, created_at')
        .eq('project_id', projectId)

      setProject(projectData)
      setHypotheses(hypothesisData || [])
      setLoading(false)
    }

    fetchData()
  }, [projectId])

  if (loading) return <p className="text-gray-500">読み込み中...</p>
  if (!project) return <p className="text-red-500">プロジェクトが見つかりません</p>

  const hypothesisCount = hypotheses.length
  const lastUpdated = hypotheses.length > 0
    ? new Date(Math.max(...hypotheses.map(h => new Date(h.created_at).getTime()))).toLocaleDateString()
    : '―'

  const statusCount = (status: string) =>
    hypotheses.filter((h) => h.status === status).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600">{project.description || '（説明なし）'}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-600">仮説の統計</h2>
          <ul className="text-sm text-gray-800 space-y-1">
            <li>🧪 総仮説数：<strong>{hypothesisCount}</strong></li>
            <li>🕒 最終更新日：<strong>{lastUpdated}</strong></li>
            <li>📌 ステータス内訳：</li>
            <ul className="ml-4 space-y-1 text-gray-700">
              <li>・未検証：{statusCount('未検証')} 件</li>
              <li>・検証中：{statusCount('検証中')} 件</li>
              <li>・成立：{statusCount('成立')} 件</li>
              <li>・否定：{statusCount('否定')} 件</li>
            </ul>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-600">次のアクション</h2>
          <div className="flex flex-col gap-3">
            <Link
              href={`/projects/${projectId}/hypotheses`}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm bg-gray-900 text-white hover:bg-gray-700"
            >
              <ListTree size={16} />
              仮説一覧を見る
            </Link>
            <Link
              href={`/projects/${projectId}/hypotheses/map`}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-500"
            >
              <MapPinned size={16} />
              仮説マップで確認
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
