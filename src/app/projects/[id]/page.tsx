'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Plus, LayoutGrid, MapPinned,
  FlaskConical, BadgeCheck, Ban, ListChecks
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

  const total = hypotheses.length

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* ヘッダー */}
      <div className="bg-gray-900 text-white rounded-xl p-6 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm mt-1">{project.description || '（説明は未入力）'}</p>
          <p className="text-xs mt-1 opacity-80">作成日: {new Date(project.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href={`/projects/${projectId}/hypotheses/new`} className="flex items-center gap-2 px-4 py-2 rounded bg-white text-indigo-700 hover:bg-gray-100 text-sm font-medium">
            <Plus size={16} /> 仮説を追加
          </Link>
          <Link href={`/projects/${projectId}/hypotheses/map`} className="flex items-center gap-2 px-4 py-2 rounded bg-white text-indigo-700 hover:bg-gray-100 text-sm font-medium">
            <MapPinned size={16} /> マップ表示
          </Link>
          <Link href={`/projects/${projectId}/hypotheses`} className="flex items-center gap-2 px-4 py-2 rounded bg-white text-indigo-700 hover:bg-gray-100 text-sm font-medium">
            <LayoutGrid size={16} /> 一覧へ
          </Link>
        </div>
      </div>

      {/* ステータス概要 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">仮説ステータス</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard label="未検証" icon={ListChecks} count={statusStats['未検証'] || 0} color="bg-slate-100 text-slate-700" />
          <StatusCard label="検証中" icon={FlaskConical} count={statusStats['検証中'] || 0} color="bg-sky-100 text-sky-700" />
          <StatusCard label="成立" icon={BadgeCheck} count={statusStats['成立'] || 0} color="bg-emerald-100 text-emerald-700" />
          <StatusCard label="否定" icon={Ban} count={statusStats['否定'] || 0} color="bg-rose-100 text-rose-700" />
        </div>
      </section>

      {/* 最新の仮説3件 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">最新の仮説</h2>
        <ul className="grid md:grid-cols-2 gap-6">
          {hypotheses.slice(0, 3).map((h) => (
            <li key={h.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow transition">
              <h3 className="text-base font-semibold text-gray-900">{h.title}</h3>
              <p className="text-sm text-gray-600 mt-1">種類: {h.type} / ステータス: {h.status}</p>
              <p className="text-xs text-gray-400 mt-1">登録日: {new Date(h.created_at).toLocaleDateString()}</p>
              <Link href={`/projects/${projectId}/hypotheses/${h.id}`} className="inline-block text-sm text-indigo-600 hover:underline mt-2">
                ▶ 詳細を見る
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function StatusCard({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string
  count: number
  icon: any
  color: string
}) {
  return (
    <div className={`p-4 rounded-lg shadow-sm flex flex-col items-start gap-2 ${color}`}>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={18} />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  )
}
