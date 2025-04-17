'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Calendar, GitBranch, GitCommit, TrendingUp, Award, AlertCircle, Loader2, History } from 'lucide-react'

export default function HypothesisEvolutionPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [hypothesis, setHypothesis] = useState<any>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 現在の仮説情報を取得
        const { data: currentHypothesis, error: hypError } = await supabase
          .from('hypotheses')
          .select('*')
          .eq('id', hypothesisId)
          .single()
        
        if (hypError) throw hypError
        setHypothesis(currentHypothesis)
        
        // 履歴データを取得
        const { data: versionsData, error: verError } = await supabase
          .from('hypothesis_versions')
          .select(`
            *,
            user_profile:updated_by(name),
            validation:based_on_validation_id(
              id, method, learnings, confidence_level, created_at
            )
          `)
          .eq('hypothesis_id', hypothesisId)
          .order('version_number', { ascending: true })
        
        if (verError) throw verError
        
        // 検証データを取得
        const { data: validationsData, error: valError } = await supabase
          .from('validations')
          .select('*')
          .eq('hypothesis_id', hypothesisId)
          .order('created_at', { ascending: true })
        
        if (valError) throw valError
        
        // タイムラインデータを作成
        let timeline = []
        
        // 作成イベント
        timeline.push({
          type: 'creation',
          date: currentHypothesis.created_at,
          data: currentHypothesis
        })
        
        // バージョン更新イベント
        versionsData?.forEach(version => {
          timeline.push({
            type: 'version',
            date: version.updated_at,
            data: version
          })
        })
        
        // 検証イベント
        validationsData?.forEach(validation => {
          timeline.push({
            type: 'validation',
            date: validation.created_at,
            data: validation
          })
        })
        
        // 日付でソート
        timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setTimelineData(timeline)
      } catch (err: any) {
        setError('データの取得に失敗しました: ' + err.message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [hypothesisId, projectId])
  
  // 信頼度の変化をグラフ化するためのデータ生成
  const getConfidenceData = () => {
    let data = []
    let currentConfidence = hypothesis?.confidence || 3
    
    data.push({ date: hypothesis?.created_at, value: currentConfidence })
    
    timelineData.forEach(item => {
      if (item.type === 'version' && item.data.confidence) {
        currentConfidence = item.data.confidence
        data.push({ date: item.data.updated_at, value: currentConfidence })
      }
      if (item.type === 'validation' && item.data.confidence_level) {
        // 検証により信頼度に影響を与えた可能性
        data.push({ date: item.data.created_at, value: item.data.confidence_level })
      }
    })
    
    return data
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }
  return ( <div className="max-w-5xl mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-6">
      <Link
        href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
        className="text-slate-600 hover:text-indigo-600 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>仮説詳細に戻る</span>
      </Link>
      
      <Link
        href={`/projects/${projectId}/hypotheses/${hypothesisId}/history`}
        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
      >
        <History size={16} />
        <span>バージョン履歴を見る</span>
      </Link>
    </div>
    
    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">
      仮説の進化タイムライン
    </h1>
    
    {error && (
      <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
        <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
        <p>{error}</p>
      </div>
    )}
    
    {/* 概要ダッシュボード */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">基本情報</h3>
        <p className="text-slate-500 text-sm mb-3">仮説の基本データ</p>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-slate-500">タイトル</span>
            <p className="font-medium">{hypothesis?.title}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">タイプ</span>
            <p>{hypothesis?.type}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">作成日</span>
            <p>{new Date(hypothesis?.created_at).toLocaleDateString('ja-JP')}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">進捗状況</h3>
        <p className="text-slate-500 text-sm mb-3">仮説の検証と修正の状況</p>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-slate-500">現在のステータス</span>
            <p className="font-medium">{hypothesis?.status || '未検証'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">バージョン数</span>
            <p>{timelineData.filter(item => item.type === 'version').length}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">検証回数</span>
            <p>{timelineData.filter(item => item.type === 'validation').length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">評価指標</h3>
        <p className="text-slate-500 text-sm mb-3">最新の評価情報</p>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-slate-500">影響度</span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
              <div 
                className="bg-indigo-600 h-2 rounded-full" 
                style={{ width: `${(hypothesis?.impact / 5) * 100}%` }} 
              />
            </div>
            <span className="text-xs text-right block mt-1">{hypothesis?.impact}/5</span>
          </div>
          <div>
            <span className="text-xs text-slate-500">不確実性</span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
              <div 
                className="bg-amber-500 h-2 rounded-full" 
                style={{ width: `${(hypothesis?.uncertainty / 5) * 100}%` }} 
              />
            </div>
            <span className="text-xs text-right block mt-1">{hypothesis?.uncertainty}/5</span>
          </div>
          <div>
            <span className="text-xs text-slate-500">確信度</span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
              <div 
                className="bg-emerald-500 h-2 rounded-full" 
                style={{ width: `${(hypothesis?.confidence / 5) * 100}%` }} 
              />
            </div>
            <span className="text-xs text-right block mt-1">{hypothesis?.confidence}/5</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* 信頼度変化グラフ */}
    <div className="mb-8 bg-white p-6 border rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">確信度の変化</h3>
      <div className="h-64 relative">
        {/* 簡易グラフ表現 - 実際はChart.jsやRechartsなどのライブラリを使用すると良い */}
        <div className="absolute inset-0 flex items-end">
          {getConfidenceData().map((point, index) => {
            // 各ポイントの確信度を表示
            const height = `${(point.value / 5) * 100}%`;
            let barColor = 'bg-slate-400';
            
            if (point.value >= 4) {
              barColor = 'bg-emerald-500';
            } else if (point.value >= 3) {
              barColor = 'bg-amber-500';
            } else {
              barColor = 'bg-slate-400';
            }
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center"
              >
                <div className="w-full h-full flex items-end justify-center">
                  <div 
                    className={`w-4/5 ${barColor} rounded-t-md`}
                    style={{ height }}
                  >
                    <div className="text-xs text-white text-center pt-1">
                      {point.value}
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-slate-500 transform -rotate-45 origin-top-left h-6 overflow-hidden">
                  {new Date(point.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Y軸ラベル */}
        <div className="absolute left-0 inset-y-0 w-10 flex flex-col justify-between px-2">
          <span className="text-xs text-slate-500">5</span>
          <span className="text-xs text-slate-500">4</span>
          <span className="text-xs text-slate-500">3</span>
          <span className="text-xs text-slate-500">2</span>
          <span className="text-xs text-slate-500">1</span>
        </div>
      </div>
    </div>
    
    {/* タイムライン */}
    <div className="relative border-l-2 border-indigo-200 pl-6 ml-6 space-y-10 py-4">
      {timelineData.map((item, index) => (
        <div key={index} className="relative">
          {/* タイムラインの丸いマーカー */}
          <div className="absolute -left-[34px] bg-white">
            {item.type === 'creation' && (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-500">
                <GitCommit size={12} className="text-green-700" />
              </div>
            )}
            {item.type === 'version' && (
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-500">
                <GitBranch size={12} className="text-indigo-700" />
              </div>
            )}
            {item.type === 'validation' && (
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center border-2 border-amber-500">
                <Award size={12} className="text-amber-700" />
              </div>
            )}
          </div>
          
          {/* タイムラインコンテンツ */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {/* ヘッダー */}
            <div className={`px-4 py-3 flex justify-between items-center
              ${item.type === 'creation' ? 'bg-green-50 border-b border-green-200' : ''}
              ${item.type === 'version' ? 'bg-indigo-50 border-b border-indigo-200' : ''}
              ${item.type === 'validation' ? 'bg-amber-50 border-b border-amber-200' : ''}
            `}>
              <div className="flex items-center gap-2">
                {item.type === 'creation' && <span className="font-medium text-green-800">仮説作成</span>}
                {item.type === 'version' && <span className="font-medium text-indigo-800">バージョン {item.data.version_number}</span>}
                {item.type === 'validation' && <span className="font-medium text-amber-800">検証: {item.data.method}</span>}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className={`
                  ${item.type === 'creation' ? 'text-green-600' : ''}
                  ${item.type === 'version' ? 'text-indigo-600' : ''}
                  ${item.type === 'validation' ? 'text-amber-600' : ''}
                `} />
                <span className={`
                  ${item.type === 'creation' ? 'text-green-600' : ''}
                  ${item.type === 'version' ? 'text-indigo-600' : ''}
                  ${item.type === 'validation' ? 'text-amber-600' : ''}
                `}>
                  {new Date(item.date).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
            
            {/* コンテンツ */}
            <div className="p-4">
              {item.type === 'creation' && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">{item.data.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">仮説が作成されました</p>
                  <div className="text-xs text-slate-500">
                    <div className="mt-2">
                      <span className="font-medium">タイプ:</span> {item.data.type}
                    </div>
                    {item.data.assumption && (
                      <div className="mt-1">
                        <span className="font-medium">前提:</span> {item.data.assumption.substring(0, 100)}
                        {item.data.assumption.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {item.type === 'version' && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">{item.data.title}</h4>
                  
                  {item.data.reason && (
                    <div className="mb-3 text-sm bg-slate-50 p-3 rounded-md border border-slate-200">
                      <span className="font-medium">修正理由:</span> {item.data.reason}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center border rounded-md p-2">
                      <div className="text-xs text-slate-500">影響度</div>
                      <div className="font-medium">{item.data.impact}</div>
                    </div>
                    <div className="text-center border rounded-md p-2">
                      <div className="text-xs text-slate-500">不確実性</div>
                      <div className="font-medium">{item.data.uncertainty}</div>
                    </div>
                    {item.data.confidence && (
                      <div className="text-center border rounded-md p-2">
                        <div className="text-xs text-slate-500">確信度</div>
                        <div className="font-medium">{item.data.confidence}</div>
                      </div>
                    )}
                  </div>
                  
                  {item.data.validation && (
                    <div className="text-xs text-indigo-600 mt-2">
                      <Link 
                        href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${item.data.based_on_validation_id}`}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <span>関連する検証: {item.data.validation.method}</span>
                        <ArrowLeft size={12} className="transform rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              {item.type === 'validation' && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">{item.data.method}</h4>
                  
                  {item.data.description && (
                    <p className="text-sm text-slate-600 mb-3">
                      {item.data.description.length > 150 
                        ? item.data.description.substring(0, 150) + '...' 
                        : item.data.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mb-3">
                    {item.data.confidence_level && (
                      <div className="text-xs bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                        信頼度: {item.data.confidence_level}/5
                      </div>
                    )}
                    {item.data.validation_type && (
                      <div className="text-xs bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
                        検証タイプ: {item.data.validation_type}
                      </div>
                    )}
                  </div>
                  
                  {item.data.learnings && (
                    <div className="text-sm border-t pt-2 mt-2">
                      <span className="font-medium text-amber-800">学び:</span>{' '}
                      <span className="text-slate-700">
                        {item.data.learnings.substring(0, 100)}
                        {item.data.learnings.length > 100 && '...'}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-amber-600 mt-3">
                    <Link 
                      href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${item.data.id}`}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>検証の詳細を見る</span>
                      <ArrowLeft size={12} className="transform rotate-180" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
}