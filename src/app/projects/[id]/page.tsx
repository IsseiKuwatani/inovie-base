'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  MapPinned, FlaskConical, Plus, LayoutGrid, TrendingUp,
  BarChart3, FileText, ClipboardList, Loader2, Map as MapIcon
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500">読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 text-center">
          <h2 className="text-xl font-semibold mb-2">プロジェクトが見つかりません</h2>
          <p className="text-sm">プロジェクトが削除されたか、アクセス権がありません</p>
          <Link href="/projects" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const statusStats = hypotheses.reduce(
    (acc: Record<string, number>, h: any) => {
      acc[h.status] = (acc[h.status] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ヘッダー */}
      <header className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-3 hover:shadow-md transition-all duration-300">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{project.name}</h1>
        <p className="text-slate-600">{project.description || '（説明は未入力）'}</p>
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <CalendarDays size={14} />
          作成日: {new Date(project.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </header>

      {/* ステータス統計 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatusCard 
          label="未検証" 
          count={statusStats['未検証'] || 0} 
          icon={ClipboardList} 
          color="bg-slate-50 border-slate-200 text-slate-700"
          iconColor="text-slate-500" 
        />
        <StatusCard 
          label="検証中" 
          count={statusStats['検証中'] || 0} 
          icon={FlaskConical} 
          color="bg-amber-50 border-amber-200 text-amber-700"
          iconColor="text-amber-500" 
        />
        <StatusCard 
          label="成立" 
          count={statusStats['成立'] || 0} 
          icon={TrendingUp} 
          color="bg-emerald-50 border-emerald-200 text-emerald-700"
          iconColor="text-emerald-500" 
        />
        <StatusCard 
          label="否定" 
          count={statusStats['否定'] || 0} 
          icon={BarChart3} 
          color="bg-rose-50 border-rose-200 text-rose-700"
          iconColor="text-rose-500" 
        />
      </section>

      {/* アクション */}
      <section className="flex flex-wrap gap-3">
        <Link
          href={`/projects/${projectId}/hypotheses`}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-full hover:border-indigo-200 hover:text-indigo-700 transition-colors text-sm shadow-sm"
        >
          <LayoutGrid size={16} />
          仮説一覧へ
        </Link>
        <Link
          href={`/projects/${projectId}/hypotheses/map`}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-full hover:border-indigo-200 hover:text-indigo-700 transition-colors text-sm shadow-sm"
        >
          <MapPinned size={16} />
          優先マップで表示
        </Link>
        <Link
  href={`/projects/${projectId}/hypotheses/tree-map`}
  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-full hover:border-indigo-200 hover:text-indigo-700 transition-colors text-sm shadow-sm"
>
  <MapIcon size={16} />
  ツリーマップ
</Link>
        <Link
          href={`/projects/${projectId}/hypotheses/new`}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg hover:translate-y-[-1px] transition-all duration-300 text-sm shadow-sm"
        >
          <Plus size={16} />
          仮説を追加
        </Link>

        
      </section>

      {/* 最新の仮説一覧（3件だけ） */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={18} className="text-indigo-500" />
          最新の仮説
        </h2>
        
        {hypotheses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-700">仮説がありません</h3>
            <p className="mt-2 text-slate-500">「仮説を追加」ボタンから新しい仮説を作成しましょう</p>
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hypotheses.slice(0, 3).map((h) => (
              <li key={h.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group">
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{h.title}</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {h.type}
                  </span>
                  <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {h.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {new Date(h.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <Link
                  href={`/projects/${projectId}/hypotheses/${h.id}`}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mt-3 group-hover:translate-x-1 transition-transform duration-300"
                >
                  詳細を見る
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
        
        {hypotheses.length > 3 && (
          <div className="text-center mt-4">
            <Link 
              href={`/projects/${projectId}/hypotheses`}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              すべての仮説を見る ({hypotheses.length}件)
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

// CalendarDaysアイコンを追加（Lucide-Reactに含まれていない場合のための代替）
function CalendarDays({ size = 24, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}

function StatusCard({ label, count, icon: Icon, color, iconColor }: { label: string, count: number, icon: any, color: string, iconColor: string }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 ${color}`}>
      <div className="flex items-center gap-2 text-sm mb-2">
        <Icon size={18} className={iconColor} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold">{count}</div>
    </div>
  )
}
