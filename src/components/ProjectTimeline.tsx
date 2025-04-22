'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Clock, FileEdit, CheckCircle, XCircle, 
  PenLine, Lightbulb, ClipboardCheck, LayoutGrid,
  AlertCircle, RefreshCcw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

type TimelineEvent = {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'hypothesis_created' | 'hypothesis_updated' | 'validation_created' | 'status_changed' | 'canvas_updated' | 'general'
  icon: React.ReactNode
  color: string
  entityId?: string
  entityType?: string
  url?: string
}

export default function ProjectTimeline({ projectId, fullPage = false }: { projectId: string, fullPage?: boolean }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(fullPage ? 20 : 5)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // ローディングタイムアウト検出
  useEffect(() => {
    // 10秒以上ローディングが続いたら警告を表示
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true)
      }
    }, 10000)
    
    return () => clearTimeout(timeoutId)
  }, [loading])

  // 共通の関数でイベントの表示用日付文字列を生成
  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja })
    } catch (e) {
      return '日時不明'
    }
  }

  // データ再取得関数
  const refreshData = () => {
    setLoading(true)
    setLoadingTimeout(false)
    setError(null)
    fetchProjectTimeline()
  }

  // イベントの取得
  const fetchProjectTimeline = async () => {
    if (!projectId) {
      console.error('No projectId provided')
      setError('プロジェクトIDが指定されていません')
      setLoading(false)
      return
    }
    
    console.log(`Fetching timeline data for project: ${projectId}`)
    
    const allEvents: TimelineEvent[] = []
    let hypothesesList: any[] = []
    
    // 1. まず仮説データを取得
    try {
      console.log(`Fetching hypotheses for project: ${projectId}`)
      
      // プロジェクトが存在するか確認
      const { data: projectCheck, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single()
      
      if (projectError) {
        console.error('Project not found:', projectError.message)
        setError(`プロジェクトが見つかりません: ${projectError.message}`)
        setLoading(false)
        return
      }
      
      // 仮説データ取得
      const { data: hypotheses, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('id, title, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (hypothesesError) {
        console.error(`Hypothesis fetch error: ${hypothesesError.message}`, hypothesesError)
        // エラーは記録するが処理は続行
      } else if (hypotheses && hypotheses.length > 0) {
        hypothesesList = hypotheses
        console.log(`Found ${hypotheses.length} hypotheses`)
        
        // 仮説作成イベント
        hypotheses.forEach(h => {
          if (!h.id || !h.created_at) return // nullチェック
          
          allEvents.push({
            id: `hypothesis_created_${h.id}`,
            title: '仮説が作成されました',
            description: h.title || '(タイトルなし)',
            timestamp: h.created_at,
            type: 'hypothesis_created',
            icon: <Lightbulb size={16} />,
            color: 'bg-indigo-600',
            entityId: h.id,
            entityType: 'hypothesis',
            url: `/projects/${projectId}/hypotheses/${h.id}`
          })
        })
      } else {
        console.log('No hypotheses found for this project')
      }
    } catch (err) {
      console.error('Error in hypotheses fetch:', err)
      // エラーは記録するが処理は続行
    }
    
    // 2. キャンバスデータを取得
    try {
      console.log('Fetching canvas data')
      const { data: canvas, error: canvasError } = await supabase
        .from('canvas')
        .select('id, updated_at')
        .eq('project_id', projectId)
        .single()
      
      if (canvasError) {
        if (canvasError.code !== 'PGRST116') { // PGRST116 は「結果が見つからない」エラー
          console.error('Canvas fetch error:', canvasError.message)
        }
      } else if (canvas && canvas.id && canvas.updated_at) {
        console.log('Canvas found')
        
        allEvents.push({
          id: `canvas_updated_${canvas.id}`,
          title: 'リーンキャンバスが更新されました',
          description: 'プロジェクトのビジネスモデルキャンバスが更新されました',
          timestamp: canvas.updated_at,
          type: 'canvas_updated',
          icon: <LayoutGrid size={16} />,
          color: 'bg-violet-600',
          entityId: canvas.id,
          entityType: 'canvas',
          url: `/projects/${projectId}/canvas`
        })
      }
    } catch (err) {
      console.error('Error in canvas fetch:', err)
    }
    
    // 3. 仮説があればさらに詳細データ取得
    if (hypothesesList.length > 0) {
      const hypothesisIds = hypothesesList.map(h => h.id).filter(Boolean)
      
      if (hypothesisIds.length > 0) {
        // 仮説のマッピングを作成
        const hypothesesMap: Record<string, any> = {}
        hypothesesList.forEach(h => {
          if (h.id) hypothesesMap[h.id] = h
        })
        
        // 検証データ取得
        try {
          console.log('Fetching validations')
          const { data: validations, error: validationsError } = await supabase
            .from('validations')
            .select('id, hypothesis_id, method, result, created_at')
            .in('hypothesis_id', hypothesisIds)
            .order('created_at', { ascending: false })
          
          if (validationsError) {
            console.error('Validations fetch error:', validationsError.message)
          } else if (validations && validations.length > 0) {
            console.log(`Found ${validations.length} validations`)
            
            validations.forEach(v => {
              if (!v.id || !v.created_at || !v.hypothesis_id) return
              
              const hypothesisTitle = hypothesesMap[v.hypothesis_id]?.title || '不明な仮説'
              
              let resultIcon = <ClipboardCheck size={16} />
              let resultColor = 'bg-blue-600'
              
              // 結果に基づいてアイコンと色を変更
              if (v.result?.toLowerCase().includes('成立')) {
                resultIcon = <CheckCircle size={16} />
                resultColor = 'bg-emerald-600'
              } else if (v.result?.toLowerCase().includes('否定')) {
                resultIcon = <XCircle size={16} />
                resultColor = 'bg-rose-600'
              }
              
              allEvents.push({
                id: `validation_created_${v.id}`,
                title: '検証が実施されました',
                description: `「${hypothesisTitle}」に対する${v.method || '検証'}`,
                timestamp: v.created_at,
                type: 'validation_created',
                icon: resultIcon,
                color: resultColor,
                entityId: v.hypothesis_id,
                entityType: 'validation',
                url: `/projects/${projectId}/hypotheses/${v.hypothesis_id}/validations/${v.id}`
              })
            })
          }
        } catch (err) {
          console.error('Error in validations fetch:', err)
        }
      }
    }

    // すべてのイベントを日付でソート (新しい順)
    allEvents.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    console.log(`Timeline processing complete. ${allEvents.length} events found.`)
    setEvents(allEvents)
    setLoading(false)
  }

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchProjectTimeline()
  }, [projectId, fullPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // さらに表示する
  const loadMore = () => {
    setVisibleCount(prev => prev + (fullPage ? 10 : 5))
  }

  // ローディング表示
  if (loading) {
    return (
      <div className={fullPage ? "" : "bg-white rounded-xl p-4 border border-slate-200 mb-4"}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            プロジェクトタイムライン
          </h3>
          
          {loadingTimeout && (
            <button 
              onClick={refreshData}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCcw size={12} />
              再読込
            </button>
          )}
        </div>
        
        {loadingTimeout ? (
          <div className="text-center py-4 text-amber-600 text-sm bg-amber-50 rounded-lg">
            <p>データの読み込みに時間がかかっています</p>
            <p className="text-xs mt-1">再読込ボタンをクリックするか、しばらく待ってみてください</p>
          </div>
        ) : (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // エラー表示
  if (error) {
    return (
      <div className={fullPage ? "" : "bg-white rounded-xl p-4 border border-slate-200 mb-4"}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            プロジェクトタイムライン
          </h3>
          
          <button 
            onClick={refreshData}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RefreshCcw size={12} />
            再試行
          </button>
        </div>
        
        <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // データ表示
  return (
    <div className={fullPage ? "" : "bg-white rounded-xl p-4 border border-slate-200 mb-4"}>
      <div className="flex justify-between items-center mb-3">
        {!fullPage && (
          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            プロジェクトタイムライン
          </h3>
        )}
        
        <button 
          onClick={refreshData}
          className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <RefreshCcw size={12} />
          更新
        </button>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">プロジェクトのアクティビティがまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.slice(0, visibleCount).map((event, index) => (
            <div key={event.id} className={`relative pl-5 pb-3 ${
              index < visibleCount - 1 && index < events.length - 1 ? 'border-l border-indigo-200' : ''
            }`}>
              {/* タイムライン接続点 - 修正 */}
              <div className={`absolute left-[-6px] top-0 w-3 h-3 rounded-full ${event.color} ring-2 ring-white`}></div>
              
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>{getTimeAgo(event.timestamp)}</span>
                </div>
                
                {/* イベント内容表示 - 修正 */}
                <div className="flex gap-3">
                  {/* アイコン表示 - 修正 */}
                  <div className={`
                    flex-shrink-0 
                    flex items-center justify-center 
                    w-8 h-8 
                    rounded-full 
                    ${event.color}
                    text-white
                    shadow-sm
                  `}>
                    {event.icon}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                    
                    {event.url && (
                      <a 
                        href={event.url} 
                        className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors mt-1.5 inline-block"
                      >
                        詳細を見る
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {events.length > visibleCount && (
        <button 
          onClick={loadMore}
          className="w-full mt-2 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors border-t border-slate-100 pt-2"
        >
          さらに表示する
        </button>
      )}
      
      {!fullPage && events.length > 0 && (
        <div className="mt-3 text-center">
          <a 
            href={`/projects/${projectId}/timeline`}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            タイムラインの詳細を表示
          </a>
        </div>
      )}
    </div>
  )
}
