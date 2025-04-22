'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, BarChart3, PieChart, TrendingUp, ChevronRight } from 'lucide-react'
import ProjectAnalyticsDashboard from '@/components/ProjectAnalyticsDashboard'

export default function AnalyticsPage() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description')
          .eq('id', projectId)
          .single()
          
        if (error) {
          console.error('Failed to fetch project:', error)
        } else {
          setProject(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (projectId) {
      fetchProject()
    }
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          プロジェクトに戻る
        </Link>
        

        
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <BarChart3 size={24} className="text-indigo-600" />
          プロジェクト分析ダッシュボード
        </h1>
        <p className="text-slate-600">
          「{project?.name || 'プロジェクト'}」のデータ分析と進捗状況の可視化
        </p>
      </div>
      
      {/* プロジェクト分析ダッシュボードの大きなバージョン */}
      <div className="space-y-6">
        {/* コアダッシュボード */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ProjectAnalyticsDashboard projectId={projectId as string} />
        </div>
        
        {/* 詳細な分析グラフ（通常はここにもっと詳しいグラフを追加） */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            進捗トレンド分析
          </h2>
          
          <div className="p-10 flex justify-center items-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">詳細なトレンドグラフは開発中です</p>
          </div>
        </div>
        
        {/* 仮説品質分析 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-600" />
            仮説品質分析
          </h2>
          
          <div className="p-10 flex justify-center items-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">詳細な品質分析グラフは開発中です</p>
          </div>
        </div>
      </div>
    </div>
  )
}