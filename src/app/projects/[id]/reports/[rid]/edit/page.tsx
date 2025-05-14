'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  PenSquare,
  BarChart2,
  Image as ImageIcon,
  Table,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle
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
}

export default function EditReportPage() {
  const { id: projectId, rid: reportId } = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')

  // セクションのタイプオプション
  const sectionTypes = [
    { id: 'text', name: 'テキスト', icon: <PenSquare size={16} /> },
    { id: 'chart', name: 'グラフ/データ', icon: <BarChart2 size={16} /> },
    { id: 'image', name: '画像', icon: <ImageIcon size={16} /> },
    { id: 'table', name: 'テーブル', icon: <Table size={16} /> }
  ]

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true)
      setError('')

      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (error) throw new Error('レポートの取得に失敗しました')
        
        setReport(data)
        setTitle(data.title)
        
        // コンテンツがまだない場合は初期化
        if (!data.content) {
          setReport({
            ...data,
            content: { sections: [] }
          })
        }
        
        // セクションIDを追加（既存のものがなければ）
        if (data.content && data.content.sections) {
          const sectionsWithIds = data.content.sections.map((section: ReportSection) => {
            if (!section.id) {
              return { ...section, id: crypto.randomUUID() }
            }
            return section
          })
          setReport({
            ...data,
            content: { ...data.content, sections: sectionsWithIds }
          })
        }
        
      } catch (err: any) {
        console.error('データ取得エラー:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  // レポートを保存
  const saveReport = async () => {
    if (!report) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          title, 
          content: report.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
      
      if (error) throw new Error('レポートの保存に失敗しました')
      
      setSaveStatus('saved')
      
      // 数秒後に保存状態をリセット
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
      
    } catch (err: any) {
      console.error('保存エラー:', err)
      setError(err.message)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // レポートを公開
  const publishReport = async () => {
    if (!report) return
    if (!confirm('このレポートを公開しますか？公開後も編集は可能です。')) return
    
    setIsSaving(true)
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
      
      if (error) throw new Error('レポートの公開に失敗しました')
      
      // レポート表示ページに移動
      router.push(`/projects/${projectId}/reports/${reportId}`)
      
    } catch (err: any) {
      console.error('公開エラー:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // 新しいセクションを追加
  const addSection = (type: string) => {
    if (!report) return

    const newSection: ReportSection = {
      id: crypto.randomUUID(),
      type,
      content: {}
    }

    // セクションタイプに応じた初期コンテンツを設定
    switch (type) {
      case 'text':
        newSection.content = {
          title: 'セクションタイトル',
          text: 'ここにテキストを入力してください。'
        }
        break
      case 'chart':
        newSection.content = {
          chartType: 'bar',
          title: 'グラフタイトル',
          description: 'グラフの説明',
          data: {}
        }
        break
      case 'image':
        newSection.content = {
          url: '',
          caption: '画像キャプション',
          alt: '画像の説明'
        }
        break
      case 'table':
        newSection.content = {
          title: 'テーブルタイトル',
          headers: ['項目1', '項目2', '項目3'],
          rows: [
            ['データ1', 'データ2', 'データ3'],
            ['データ4', 'データ5', 'データ6']
          ]
        }
        break
    }

    // 新しいセクションを追加
    setReport({
      ...report,
      content: {
        ...report.content,
        sections: [...report.content.sections, newSection]
      }
    })
  }

  // セクションを削除
  const removeSection = (sectionId: string) => {
    if (!report) return
    if (!confirm('このセクションを削除しますか？この操作は元に戻せません。')) return

    setReport({
      ...report,
      content: {
        ...report.content,
        sections: report.content.sections.filter(s => s.id !== sectionId)
      }
    })
  }

  // セクションコンテンツを更新
  const updateSectionContent = (sectionId: string, content: any) => {
    if (!report) return

    setReport({
      ...report,
      content: {
        ...report.content,
        sections: report.content.sections.map(section => 
          section.id === sectionId ? { ...section, content } : section
        )
      }
    })
  }

  // セクションを描画
  const renderSection = (section: ReportSection) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, title: e.target.value })}
                placeholder="セクションタイトル"
                className="text-lg font-semibold border-none focus:ring-0 focus:outline-none w-full"
              />
              <button
                onClick={() => removeSection(section.id!)}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <textarea
              value={section.content.text || ''}
              onChange={(e) => updateSectionContent(section.id!, { ...section.content, text: e.target.value })}
              placeholder="ここにテキストを入力してください。"
              rows={5}
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all resize-y"
            />
          </div>
        )
        
      case 'image':
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-slate-700">画像</span>
              <button
                onClick={() => removeSection(section.id!)}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">画像URL</label>
              <input
                type="text"
                value={section.content.url || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
              />
            </div>
            {section.content.url && (
              <div className="mb-3">
                <img 
                  src={section.content.url} 
                  alt={section.content.alt || 'レポート画像'} 
                  className="max-h-64 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=画像プレビュー'
                  }}
                />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">キャプション</label>
              <input
                type="text"
                value={section.content.caption || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, caption: e.target.value })}
                placeholder="画像の説明を入力"
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
              />
            </div>
          </div>
        )
        
      case 'chart':
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, title: e.target.value })}
                placeholder="グラフタイトル"
                className="text-lg font-semibold border-none focus:ring-0 focus:outline-none w-full"
              />
              <button
                onClick={() => removeSection(section.id!)}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">グラフタイプ</label>
              <select
                value={section.content.chartType || 'bar'}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, chartType: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
              >
                <option value="bar">棒グラフ</option>
                <option value="line">折れ線グラフ</option>
                <option value="pie">円グラフ</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">グラフの説明</label>
              <textarea
                value={section.content.description || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, description: e.target.value })}
                placeholder="グラフの説明を入力"
                rows={3}
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all resize-y"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-4">
              <p className="text-sm text-slate-600">グラフデータ入力機能は今後追加予定です。</p>
            </div>
          </div>
        )
        
      case 'table':
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateSectionContent(section.id!, { ...section.content, title: e.target.value })}
                placeholder="テーブルタイトル"
                className="text-lg font-semibold border-none focus:ring-0 focus:outline-none w-full"
              />
              <button
                onClick={() => removeSection(section.id!)}
                className="p-1 text-slate-400 hover:text-rose-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {section.content.headers?.map((header: string, index: number) => (
                      <th key={index} className="border border-slate-200 p-2 bg-slate-50">
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => {
                            const newHeaders = [...section.content.headers];
                            newHeaders[index] = e.target.value;
                            updateSectionContent(section.id!, { ...section.content, headers: newHeaders })
                          }}
                          className="w-full border-none focus:ring-0 focus:outline-none bg-transparent"
                        />
                      </th>
                    ))}
                    <th className="border border-slate-200 p-2 bg-slate-50 w-10">
                      <button
                        onClick={() => {
                          const newHeaders = [...(section.content.headers || []), '新しい列'];
                          const newRows = section.content.rows?.map((row: string[]) => [...row, '']) || [];
                          updateSectionContent(section.id!, { ...section.content, headers: newHeaders, rows: newRows })
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-800"
                      >
                        <Plus size={14} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.content.rows?.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-slate-200 p-2">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...section.content.rows];
                              newRows[rowIndex][cellIndex] = e.target.value;
                              updateSectionContent(section.id!, { ...section.content, rows: newRows })
                            }}
                            className="w-full border-none focus:ring-0 focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="border border-slate-200 p-2 w-10">
                        <button
                          onClick={() => {
                            const newRows = [...section.content.rows];
                            newRows.splice(rowIndex, 1);
                            updateSectionContent(section.id!, { ...section.content, rows: newRows })
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => {
                  const newRow = Array(section.content.headers?.length || 0).fill('');
                  const newRows = [...(section.content.rows || []), newRow];
                  updateSectionContent(section.id!, { ...section.content, rows: newRows })
                }}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>行を追加</span>
              </button>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
            <p className="text-sm text-slate-600">不明なセクションタイプです。</p>
            <button
              onClick={() => removeSection(section.id!)}
              className="p-1 text-slate-400 hover:text-rose-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href={`/projects/${projectId}/reports`}
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>レポート一覧に戻る</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-emerald-600 text-sm flex items-center gap-1">
              <CheckCircle size={14} />
              保存しました
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-rose-600 text-sm flex items-center gap-1">
              <AlertTriangle size={14} />
              保存エラー
            </span>
          )}
          
          <button
            onClick={saveReport}
            disabled={isSaving}
            className="text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <Save size={16} />
            <span>下書き保存</span>
          </button>
          
          <Link
            href={`/projects/${projectId}/reports/${reportId}`}
            className="text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1"
          >
            <Eye size={16} />
            <span>プレビュー</span>
          </Link>
          
          <button
            onClick={publishReport}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1.5 rounded-full hover:shadow-md transition-all duration-300 flex items-center gap-1"
          >
            レポートを公開
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-rose-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="レポートタイトル"
          className="text-3xl font-bold w-full border-none focus:ring-0 focus:outline-none bg-transparent"
        />
      </div>

      {/* レポートセクション */}
      {report?.content.sections.map((section) => (
        <div key={section.id} className="mb-6">
          {renderSection(section)}
        </div>
      ))}

      {/* 新規セクション追加 */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
        <p className="text-sm font-medium text-slate-700 mb-3">新しいセクションを追加</p>
        <div className="flex flex-wrap gap-2">
          {sectionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => addSection(type.id)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded hover:border-indigo-200 hover:text-indigo-600 transition-colors"
            >
              {type.icon}
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}