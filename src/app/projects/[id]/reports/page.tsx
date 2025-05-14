'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  FilePlus, 
  FileText, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Edit3, 
  Eye, 
  Trash2,
  Loader2
} from 'lucide-react'

type Report = {
  id: string;
  title: string;
  report_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export default function ProjectReportsPage() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [projectInfo, setProjectInfo] = useState<{ name: string, description: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // レポートタイプの表示名
  const reportTypeLabels = {
    'hypothesis_validation': '仮説検証レポート',
    'progress': '進捗レポート',
    'roadmap': 'ロードマップレポート',
    'final': '最終報告書'
  }

  // レポートステータスの表示スタイル
  const statusStyles = {
    'draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'published': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'archived': 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')

      try {
        // プロジェクト情報を取得
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', projectId)
          .single()

        if (projectError) throw new Error('プロジェクト情報の取得に失敗しました')
        setProjectInfo(project)

        // レポート一覧を取得
        const { data: reportsList, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (reportsError) throw new Error('レポート一覧の取得に失敗しました')
        setReports(reportsList || [])

      } catch (err: any) {
        console.error('データ取得エラー:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const deleteReport = async (reportId: string) => {
    if (!confirm('このレポートを削除してもよろしいですか？この操作は元に戻せません。')) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
      
      if (error) throw new Error('レポートの削除に失敗しました')
      
      // 成功したら一覧を更新
      setReports(reports.filter(report => report.id !== reportId))
    } catch (err: any) {
      console.error('削除エラー:', err)
      alert(`エラー: ${err.message}`)
    }
  }

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">プロジェクトレポート</h1>
          {projectInfo && (
            <p className="text-slate-500">
              {projectInfo.name} のレポート一覧
            </p>
          )}
        </div>
        <Link
          href={`/projects/${projectId}/reports/new`}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-md transition-all duration-300 flex items-center gap-2"
        >
          <FilePlus size={16} />
          <span>新規レポート</span>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-rose-700">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="mb-4">
            <FileText className="mx-auto h-16 w-16 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">レポートがまだありません</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            プロジェクトの進捗や仮説検証の結果をレポートとして保存・共有できます。
            「新規レポート」ボタンから作成を開始しましょう。
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-1">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="border-b border-slate-100 last:border-b-0 p-5 hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {report.title}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[report.status as keyof typeof statusStyles]}`}>
                      {report.status === 'draft' ? '下書き' : report.status === 'published' ? '公開中' : 'アーカイブ'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                      {report.report_type in reportTypeLabels 
                        ? reportTypeLabels[report.report_type as keyof typeof reportTypeLabels]
                        : report.report_type
                      }
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                    {report.published_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>公開: {formatDate(report.published_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${projectId}/reports/${report.id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="レポートを表示"
                  >
                    <Eye size={18} />
                  </Link>
                  <Link
                    href={`/projects/${projectId}/reports/${report.id}/edit`}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="レポートを編集"
                  >
                    <Edit3 size={18} />
                  </Link>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title="レポートを削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <Link
                href={`/projects/${projectId}/reports/${report.id}`}
                className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <span>レポートを見る</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}