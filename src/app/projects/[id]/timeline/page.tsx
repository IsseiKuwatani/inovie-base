'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ProjectTimeline from '@/components/ProjectTimeline'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export default function TimelinePage() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
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
          <Clock size={20} className="text-indigo-500" />
          プロジェクトタイムライン
        </h1>
        <p className="text-slate-600">
          「{project?.name || 'プロジェクト'}」の活動履歴を時系列で表示しています
        </p>
      </div>
      
      <div className="space-y-6">
        {/* フルサイズのタイムライン表示 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ProjectTimeline projectId={projectId as string} fullPage={true} />
        </div>
      </div>
    </div>
  )
}