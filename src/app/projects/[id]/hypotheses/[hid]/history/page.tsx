'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, GitCommit, FileText, ExternalLink, AlertCircle, Clock, Loader2 } from 'lucide-react'

type HypothesisVersion = {
  id: string;
  version_number: number;
  title: string;
  type: string;
  assumption?: string;
  solution?: string;
  expected_effect?: string;
  impact: number;
  uncertainty: number;
  confidence?: number;
  reason?: string;
  updated_at: string;
  based_on_validation_id?: string;
  updated_by?: string;
  user_profile?: {
    display_name?: string;
  };
  validation?: {
    method?: string;
    learnings?: string;
  };
}

export default function HypothesisHistoryPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const [versions, setVersions] = useState<HypothesisVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentVersion, setCurrentVersion] = useState<HypothesisVersion | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        // 現在の仮説データを取得
        const { data: currentHypothesis, error: currentError } = await supabase
          .from('hypotheses')
          .select('id, title, type, assumption, solution, expected_effect, impact, uncertainty, confidence')
          .eq('id', hypothesisId)
          .single()
        
        if (currentError) throw currentError

        // 履歴データを取得（ユーザープロフィールと検証データも一緒に）
        const { data: historyData, error: historyError } = await supabase
          .from('hypothesis_versions')
          .select(`
            *,
            user_profile:updated_by(display_name),
            validation:based_on_validation_id(method, learnings)
          `)
          .eq('hypothesis_id', hypothesisId)
          .order('version_number', { ascending: false })
        
        if (historyError) throw historyError

        // 現在のバージョンを最新のデータで作成
        setCurrentVersion({
          id: currentHypothesis.id,
          version_number: (historyData[0]?.version_number || 0) + 1,
          title: currentHypothesis.title,
          type: currentHypothesis.type,
          assumption: currentHypothesis.assumption,
          solution: currentHypothesis.solution,
          expected_effect: currentHypothesis.expected_effect,
          impact: currentHypothesis.impact,
          uncertainty: currentHypothesis.uncertainty,
          confidence: currentHypothesis.confidence,
          updated_at: new Date().toISOString(),
          reason: '現在のバージョン'
        })

        setVersions(historyData || [])
      } catch (err: any) {
        console.error('履歴データ取得エラー:', err)
        setError('履歴データの取得に失敗しました: ' + (err.message || ''))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hypothesisId])

  // スコアに応じた色を取得
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-indigo-600 bg-indigo-50';
    if (score >= 3) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500">履歴データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>仮説詳細に戻る</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">仮説の修正履歴</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-8">
        {/* 現在のバージョン */}
        {currentVersion && (
          <div className="border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GitCommit size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-indigo-700">現在のバージョン (v{currentVersion.version_number})</h3>
              </div>
              <div className="text-sm text-indigo-600">最新</div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{currentVersion.title}</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">仮説タイプ</h4>
                    <p className="text-slate-800">{currentVersion.type}</p>
                  </div>
                  
                  {currentVersion.assumption && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">前提</h4>
                      <p className="text-slate-800 whitespace-pre-line">{currentVersion.assumption}</p>
                    </div>
                  )}
                  
                  {currentVersion.solution && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">解決策</h4>
                      <p className="text-slate-800 whitespace-pre-line">{currentVersion.solution}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {currentVersion.expected_effect && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">期待される効果</h4>
                      <p className="text-slate-800 whitespace-pre-line">{currentVersion.expected_effect}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center p-2 rounded-lg border">
                      <div className="text-sm font-medium text-slate-500 mb-1">影響度</div>
                      <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(currentVersion.impact)}`}>
                        {currentVersion.impact}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 rounded-lg border">
                      <div className="text-sm font-medium text-slate-500 mb-1">不確実性</div>
                      <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(currentVersion.uncertainty)}`}>
                        {currentVersion.uncertainty}
                      </div>
                    </div>
                    
                    {currentVersion.confidence && (
                      <div className="flex flex-col items-center p-2 rounded-lg border">
                        <div className="text-sm font-medium text-slate-500 mb-1">確信度</div>
                        <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(currentVersion.confidence)}`}>
                          {currentVersion.confidence}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 過去のバージョン履歴 */}
        {versions.length > 0 ? (
          versions.map((version) => (
            <div key={version.id} className="border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b px-6 py-4 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <GitCommit size={18} className="text-slate-600" />
                  <h3 className="font-semibold text-slate-700">バージョン {version.version_number}</h3>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(version.updated_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(version.updated_at).toLocaleTimeString('ja-JP')}</span>
                  </div>
                  
                  {version.user_profile?.display_name && (
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{version.user_profile.display_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{version.title}</h3>
                
                {/* 修正理由 */}
                {version.reason && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-700 mb-1">修正理由</h4>
                    <p className="text-amber-800 whitespace-pre-line">{version.reason}</p>
                  </div>
                )}
                
                {/* 検証ログへのリンク */}
                {version.based_on_validation_id && version.validation && (
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-indigo-700">参照された検証ログ</h4>
                      <Link
                        href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${version.based_on_validation_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <FileText size={12} />
                        <span>検証ログを見る</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                    
                    <div className="text-sm mb-1">
                      <span className="font-medium text-indigo-800">検証方法:</span>{' '}
                      <span className="text-indigo-700">{version.validation.method}</span>
                    </div>
                    
                    {version.validation.learnings && (
                      <div className="text-sm">
                        <span className="font-medium text-indigo-800">学び:</span>{' '}
                        <span className="text-indigo-700">{version.validation.learnings.length > 100 
                          ? version.validation.learnings.substring(0, 100) + '...' 
                          : version.validation.learnings}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">仮説タイプ</h4>
                      <p className="text-slate-800">{version.type}</p>
                    </div>
                    
                    {version.assumption && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">前提</h4>
                        <p className="text-slate-800 whitespace-pre-line">{version.assumption}</p>
                      </div>
                    )}
                    
                    {version.solution && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">解決策</h4>
                        <p className="text-slate-800 whitespace-pre-line">{version.solution}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {version.expected_effect && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">期待される効果</h4>
                        <p className="text-slate-800 whitespace-pre-line">{version.expected_effect}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="flex flex-col items-center p-2 rounded-lg border">
                        <div className="text-sm font-medium text-slate-500 mb-1">影響度</div>
                        <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(version.impact)}`}>
                          {version.impact}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center p-2 rounded-lg border">
                        <div className="text-sm font-medium text-slate-500 mb-1">不確実性</div>
                        <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(version.uncertainty)}`}>
                          {version.uncertainty}
                        </div>
                      </div>
                      
                      {version.confidence && (
                        <div className="flex flex-col items-center p-2 rounded-lg border">
                          <div className="text-sm font-medium text-slate-500 mb-1">確信度</div>
                          <div className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${getScoreColor(version.confidence)}`}>
                            {version.confidence}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 border rounded-xl bg-slate-50">
            <p className="text-slate-600">この仮説の修正履歴はまだありません。</p>
            <p className="text-sm text-slate-500 mt-1">仮説を更新すると、ここに履歴が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  )
}
