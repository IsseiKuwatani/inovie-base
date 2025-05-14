'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, BarChart, FileText, FlaskConical, HelpCircle, Loader2, Map, PenTool } from 'lucide-react'

export default function NewReportPage() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [projectInfo, setProjectInfo] = useState<{ name: string, description: string } | null>(null)
  const [error, setError] = useState('')
  
  const reportTypes = [
    { 
      id: 'hypothesis_validation', 
      name: '仮説検証レポート',
      description: '仮説の検証結果をまとめたレポートです。検証された仮説、得られた学び、今後の方向性などを含めます。',
      icon: <FlaskConical className="w-10 h-10 text-indigo-500" />
    },
    { 
      id: 'progress', 
      name: '進捗レポート',
      description: '定期的なプロジェクト進捗をまとめたレポートです。達成した目標、現在の課題、次のステップなどを含めます。',
      icon: <BarChart className="w-10 h-10 text-emerald-500" />
    },
    { 
      id: 'roadmap', 
      name: 'ロードマップレポート',
      description: '仮説ロードマップの進行状況をまとめたレポートです。検証済みステップ、今後のステップ、全体の進捗などを含めます。',
      icon: <Map className="w-10 h-10 text-amber-500" />
    },
    { 
      id: 'final', 
      name: '最終報告書',
      description: 'プロジェクト全体の結果をまとめた最終報告書です。検証結果、得られた洞察、市場機会、推奨アクションなどを含めます。',
      icon: <FileText className="w-10 h-10 text-violet-500" />
    }
  ]

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', projectId)
          .single()
          
        if (error) throw new Error('プロジェクト情報の取得に失敗しました')
        setProjectInfo(data)
      } catch (err: any) {
        console.error('データ取得エラー:', err)
        setError(err.message)
      }
    }
    
    if (projectId) {
      fetchProjectInfo()
    }
  }, [projectId])

  const createReport = async (reportType: string) => {
    if (!projectId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // レポートのタイトルを生成（プロジェクト名 + レポートタイプ + 日付）
      const reportTypeName = reportTypes.find(t => t.id === reportType)?.name || reportType
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const title = `${projectInfo?.name || 'プロジェクト'} ${reportTypeName} (${today})`
      
      // レポートの雛形JSONを作成
      const defaultContent = {
        sections: [
          {
            type: 'header',
            content: {
              title: title,
              subtitle: `作成日: ${today}`,
              projectName: projectInfo?.name || '',
            }
          },
          {
            type: 'text',
            content: {
              title: 'レポート概要',
              text: 'ここにレポートの概要を入力してください。'
            }
          }
        ]
      }
      
      // レポートをデータベースに登録
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            project_id: projectId,
            title: title,
            report_type: reportType,
            status: 'draft',
            content: defaultContent
          }
        ])
        .select('id')
        .single()
        
      if (error) throw new Error('レポートの作成に失敗しました')
      
      // レポート編集ページへリダイレクト
      router.push(`/projects/${projectId}/reports/${data.id}/edit`)
      
    } catch (err: any) {
      console.error('レポート作成エラー:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href={`/projects/${projectId}/reports`}
        className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>レポート一覧に戻る</span>
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">新規レポート作成</h1>
      <p className="text-slate-500 mb-8">
        作成したいレポートのタイプを選択してください
      </p>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer"
            onClick={() => !isLoading && createReport(type.id)}
          >
            <div className="flex gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                {type.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{type.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{type.description}</p>
                <button
                  disabled={isLoading}
                  className="text-indigo-600 font-medium text-sm flex items-center gap-1 hover:text-indigo-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>作成中...</span>
                    </>
                  ) : (
                    <>
                      <PenTool size={16} />
                      <span>このタイプで作成</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-4 mt-8 text-amber-700 text-sm">
        <HelpCircle className="flex-shrink-0" size={18} />
        <div>
          <p className="font-medium mb-1">レポートの作成について</p>
          <p>
            選択したレポートタイプに基づいて、プロジェクトのデータを自動的に取得し、レポートの雛形を生成します。
            編集画面でさらに詳細な内容を追加・編集することができます。
          </p>
        </div>
      </div>
    </div>
  )
}