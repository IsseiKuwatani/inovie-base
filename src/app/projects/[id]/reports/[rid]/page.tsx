'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Download,
  Share2,
  Clock,
  Calendar,
  User,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react'

// レポートのタイプ定義
type ReportSection = {
  type: string;
  content: any;
  id?: string;
}

type Report = {
  id: string;
  title: string;
  report_type: string;
  status: string;
  content: {
    sections: ReportSection[];
  };
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
}

export default function ViewReportPage() {
  const { id: projectId, rid: reportId } = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [authorName, setAuthorName] = useState<string | null>(null)
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')

      try {
        // レポートデータを取得
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (reportError) throw new Error('レポートの取得に失敗しました')
        setReport(reportData)

        // プロジェクト情報を取得
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', projectId)
          .single()

        if (projectError) throw new Error('プロジェクト情報の取得に失敗しました')
        setProjectInfo(projectData)

        // 著者情報を取得（ある場合）
        if (reportData.created_by) {
          const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', reportData.created_by)
            .single()

          if (!userError && userData) {
            setAuthorName(userData.display_name)
          }
        }
      } catch (err: any) {
        console.error('データ取得エラー:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (reportId && projectId) {
      fetchData()
    }
  }, [reportId, projectId])

  // 日付のフォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })
  }

  // 印刷/PDFエクスポート
  const printReport = () => {
    window.print()
  }

  // セクションを描画
  const renderSection = (section: ReportSection) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="mb-8">
            {section.content.title && (
              <h2 className="text-xl font-semibold text-slate-800 mb-3">{section.content.title}</h2>
            )}
            <div className="text-slate-700 whitespace-pre-line">
              {section.content.text || ''}
            </div>
          </div>
        )
        
      case 'image':
        return (
          <div className="mb-8">
            {section.content.url && (
              <div className="mb-2">
                <img 
                  src={section.content.url} 
                  alt={section.content.alt || '画像'} 
                  className="max-w-full mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/600x400?text=画像が読み込めません'
                  }}
                />
              </div>
            )}
            {section.content.caption && (
              <p className="text-sm text-center text-slate-500">{section.content.caption}</p>
            )}
          </div>
        )
        
      case 'chart':
        return (
          <div className="mb-8">
            {section.content.title && (
              <h2 className="text-xl font-semibold text-slate-800 mb-3">{section.content.title}</h2>
            )}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-slate-500">
                {section.content.chartType === 'bar' && '棒グラフ'}
                {section.content.chartType === 'line' && '折れ線グラフ'}
                {section.content.chartType === 'pie' && '円グラフ'}
                {!section.content.chartType && 'グラフ'} 
                画像がここに表示されます
              </p>
            </div>
            {section.content.description && (
              <p className="text-sm text-slate-600 mt-2">{section.content.description}</p>
            )}
          </div>
        )
        
      case 'table':
        return (
          <div className="mb-8">
            {section.content.title && (
              <h2 className="text-xl font-semibold text-slate-800 mb-3">{section.content.title}</h2>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {section.content.headers?.map((header: string, index: number) => (
                      <th key={index} className="border border-slate-200 p-2 bg-slate-50 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.content.rows?.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-slate-200 p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
          <FileText className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-rose-800 mb-2">レポートが見つかりません</h2>
          <p className="text-rose-700 mb-4">
            このレポートは削除されたか、アクセス権がありません。
          </p>
          <Link
            href={`/projects/${projectId}/reports`}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-center"
          >
            <ChevronLeft size={16} />
            <span>レポート一覧に戻る</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link
          href={`/projects/${projectId}/reports`}
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>レポート一覧に戻る</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/reports/${reportId}/edit`}
            className="text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <Edit3 size={16} />
            <span>編集</span>
          </Link>
          
          <button
            onClick={printReport}
            className="text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <Printer size={16} />
            <span>印刷/PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-rose-700 print:hidden">
          {error}
        </div>
      )}

      {/* レポートメタ情報 */}
      <div className="mb-8 pb-6 border-b border-slate-200 print:mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
            {report.report_type in reportTypeLabels 
              ? reportTypeLabels[report.report_type as keyof typeof reportTypeLabels]
              : report.report_type
            }
          </span>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>作成: {formatDate(report.created_at)}</span>
          </div>
          {report.published_at && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>公開: {formatDate(report.published_at)}</span>
            </div>
          )}
          {authorName && (
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{authorName}</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{report.title}</h1>
        {projectInfo && (
          <p className="text-slate-600 mt-2">
            プロジェクト: {projectInfo.name}
          </p>
        )}
      </div>

      {/* レポートコンテンツ */}
      <div className="report-content">
        {report.content?.sections?.map((section) => (
          <div key={section.id || section.type} className="mb-6">
            {renderSection(section)}
          </div>
        ))}
        
        {(!report.content || !report.content.sections || report.content.sections.length === 0) && (
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-8 text-center">
            <p className="text-slate-500">このレポートにはまだコンテンツがありません。</p>
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div className="mt-16 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
        <p>このレポートは {formatDate(report.updated_at)} に最終更新されました。</p>
        {projectInfo && <p className="mt-1">{projectInfo.name}</p>}
      </div>
      
      {/* モバイル用ナビゲーション（画面下部） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between md:hidden print:hidden">
        <Link
          href={`/projects/${projectId}/reports`}
          className="text-slate-700 flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          <span>一覧</span>
        </Link>
        
        <Link
          href={`/projects/${projectId}/reports/${reportId}/edit`}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full"
        >
          <Edit3 size={16} />
        </Link>
        
        <button
          onClick={printReport}
          className="text-slate-700 flex items-center gap-1"
        >
          <Printer size={16} />
          <span>印刷</span>
        </button>
      </div>
    </div>
  )
}