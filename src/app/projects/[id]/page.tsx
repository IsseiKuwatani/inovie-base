'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  MapPinned, FlaskConical, Plus, LayoutGrid, TrendingUp,
  BarChart3, FileText, ClipboardList
} from 'lucide-react'

export default function ProjectDashboard() {
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

  const statusStats = hypotheses.reduce(
    (acc: Record<string, number>, h: any) => {
      acc[h.status] = (acc[h.status] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* ヘッダー */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600">{project.description || '（説明は未入力）'}</p>
        <p className="text-sm text-gray-400">作成日: {new Date(project.created_at).toLocaleDateString()}</p>
      </header>

      {/* ステータス統計 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatusCard label="未検証" count={statusStats['未検証'] || 0} icon={ClipboardList} />
        <StatusCard label="検証中" count={statusStats['検証中'] || 0} icon={FlaskConical} />
        <StatusCard label="成立" count={statusStats['成立'] || 0} icon={TrendingUp} />
        <StatusCard label="否定" count={statusStats['否定'] || 0} icon={BarChart3} />
      </section>

      {/* アクション */}
      <section className="flex flex-wrap gap-4">
        <Link
          href={`/projects/${projectId}/hypotheses`}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
        >
          <LayoutGrid size={16} />
          仮説一覧へ
        </Link>
        <Link
          href={`/projects/${projectId}/hypotheses/map`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm"
        >
          <MapPinned size={16} />
          マップで表示
        </Link>
        <Link
          href={`/projects/${projectId}/hypotheses/new`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm"
        >
          <Plus size={16} />
          仮説を追加
        </Link>
      </section>

      {/* 最新の仮説一覧（3件だけ） */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} />
          最新の仮説
        </h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {hypotheses.slice(0, 3).map((h) => (
            <li key={h.id} className="border rounded-xl p-4 bg-white shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{h.title}</h3>
              <p className="text-sm text-gray-600 mt-1">種類: {h.type} / ステータス: {h.status}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at).toLocaleDateString()}</p>
              <Link
                href={`/projects/${projectId}/hypotheses/${h.id}`}
                className="text-indigo-600 text-sm hover:underline mt-2 inline-block"
              >
                ▶ 詳細を見る
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function StatusCard({ label, count, icon: Icon }: { label: string, count: number, icon: any }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:shadow transition">
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
        <Icon size={16} />
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
    </div>
  )
}
