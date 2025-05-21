'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Clock, FileEdit, CheckCircle, XCircle, 
  PenLine, Lightbulb, ClipboardCheck, LayoutGrid,
  AlertCircle, RefreshCcw,User 
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
  userName?: string 
  userId?: string   
}

// ユーザープロファイル型の定義
type UserProfile = {
  id: string
  display_name: string | null
  email: string | null
}
// ユーザープロファイル情報の取得
const fetchUserProfiles = async (userIds: string[]) => {
  if (!userIds.length) return {}
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)
    
    if (error) {
      console.error('Error fetching user profiles:', error)
      return {}
    }
    
    const profiles: Record<string, UserProfile> = {}
    data?.forEach(profile => {
      profiles[profile.id] = profile
    })
    
    return profiles
  } catch (err) {
    console.error('Error in user profile fetch:', err)
    return {}
  }
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
    const userIdsToFetch = new Set<string>() // ユーザーIDを収集するためのセット
    
    // 1. プロジェクト情報とプロジェクト作成者の取得
    try {
      const { data: projectCheck, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .single()
      
      if (projectError) {
        console.error('Project not found:', projectError.message)
        setError(`プロジェクトが見つかりません: ${projectError.message}`)
        setLoading(false)
        return
      }
      
      // プロジェクト作成者のIDを収集
      if (projectCheck?.user_id) {
        userIdsToFetch.add(projectCheck.user_id)
      }
    } catch (err) {
      console.error('Error in project fetch:', err)
    }
    
    // 2. 仮説データの取得と仮説作成者情報の収集
    try {
      const { data: hypotheses, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('id, title, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (hypothesesError) {
        console.error(`Hypothesis fetch error: ${hypothesesError.message}`, hypothesesError)
      } else if (hypotheses && hypotheses.length > 0) {
        hypothesesList = hypotheses
        console.log(`Found ${hypotheses.length} hypotheses`)
        
        // 各仮説の最初のバージョンから作成者を取得
        for (const h of hypotheses) {
          if (!h.id) continue
          
          try {
            const { data: versionData, error: versionError } = await supabase
              .from('hypothesis_versions')
              .select('updated_by')
              .eq('hypothesis_id', h.id)
              .order('version_number', { ascending: true })
              .limit(1)
            
            if (!versionError && versionData && versionData.length > 0 && versionData[0].updated_by) {
              userIdsToFetch.add(versionData[0].updated_by)
              
              // 仮説作成イベント
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
                url: `/projects/${projectId}/hypotheses/${h.id}`,
                userId: versionData[0].updated_by
              })
            } else {
              // ユーザー情報がなくても仮説イベントは追加
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
            }
          } catch (err) {
            console.error(`Error fetching hypothesis version for ${h.id}:`, err)
            // エラー発生時も仮説イベントは追加
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
          }
        }
      }
    } catch (err) {
      console.error('Error in hypotheses fetch:', err)
    }
    
    // 3. キャンバスデータの取得
    try {
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
        
        // キャンバス更新イベント
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
    
    // 4. 仮説があれば検証データを取得
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
          const { data: validations, error: validationsError } = await supabase
            .from('validations')
            .select('id, hypothesis_id, method, result, created_at')
            .in('hypothesis_id', hypothesisIds)
            .order('created_at', { ascending: false })
          
          if (validationsError) {
            console.error('Validations fetch error:', validationsError.message)
          } else if (validations && validations.length > 0) {
            console.log(`Found ${validations.length} validations`)
            
            // 各検証に関連するユーザー情報を取得
            for (const v of validations) {
              if (!v.id || !v.created_at || !v.hypothesis_id) continue
              
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
              
              // 検証に基づく仮説バージョンを検索して作成者を取得
              try {
                const { data: versionData, error: versionError } = await supabase
                  .from('hypothesis_versions')
                  .select('updated_by')
                  .eq('based_on_validation_id', v.id)
                  .limit(1)
                
                let userId = null
                
                if (!versionError && versionData && versionData.length > 0 && versionData[0].updated_by) {
                  userId = versionData[0].updated_by
                  userIdsToFetch.add(userId)
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
                  url: `/projects/${projectId}/hypotheses/${v.hypothesis_id}/validations/${v.id}`,
                  userId
                })
              } catch (err) {
                console.error(`Error fetching validation creator for ${v.id}:`, err)
                
                // エラー発生時もイベントは追加
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
              }
            }
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
    
    // 5. ユーザー情報を一括取得して各イベントに適用
    if (userIdsToFetch.size > 0) {
      const userIds = Array.from(userIdsToFetch)
      const profiles = await fetchUserProfiles(userIds)
      
      // ユーザー名を各イベントに追加
      allEvents.forEach(event => {
        if (event.userId && profiles[event.userId]) {
          event.userName = profiles[event.userId].display_name || profiles[event.userId].email || '不明なユーザー'
        }
      })
    }
    
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
                {/* ユーザー名を表示（存在する場合） */}
                {event.userName && (
                  <span className="flex items-center gap-1 ml-2">
                    <span className="text-slate-400">by</span>
                    <span className="flex items-center gap-0.5">
                      <User size={12} className="text-slate-400" />
                      <span className="text-slate-600">{event.userName}</span>
                    </span>
                  </span>
                )}
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
