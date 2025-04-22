'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  BarChart3, PieChart, TrendingUp, AlertTriangle, 
  Check, Clock, XCircle, ArrowUpRight, RefreshCcw 
} from 'lucide-react'

type ProjectStats = {
  hypothesesTotal: number
  hypothesisStatuses: Record<string, number>
  validationsTotal: number
  validationResults: Record<string, number>
  avgConfidence: number | null
  avgImpact: number | null
  avgUncertainty: number | null
  lastUpdated: string | null
}

type KpiMetric = {
  id: string
  name: string
  current_value: number
  target_value: number | null
  unit: string | null
  status: string
}

export default function ProjectAnalyticsDashboard({ projectId }: { projectId: string }) {
  const [stats, setStats] = useState<ProjectStats>({
    hypothesesTotal: 0,
    hypothesisStatuses: {},
    validationsTotal: 0,
    validationResults: {},
    avgConfidence: null,
    avgImpact: null,
    avgUncertainty: null,
    lastUpdated: null
  })
  const [kpis, setKpis] = useState<KpiMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // データ取得
  const fetchAnalyticsData = async () => {
    if (!projectId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // 仮説データの取得
      const { data: hypotheses, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('id, title, status, impact, uncertainty, confidence, created_at')
        .eq('project_id', projectId)
      
      if (hypothesesError) {
        throw new Error(`仮説データの取得に失敗しました: ${hypothesesError.message}`)
      }
      
      const hypothesisStatuses: Record<string, number> = {}
      let totalImpact = 0
      let totalUncertainty = 0
      let totalConfidence = 0
      let confidenceCount = 0
      let lastUpdated: string | null = null
      
      // 仮説ステータスの集計と平均値の計算
      hypotheses?.forEach(h => {
        // ステータス集計
        const status = h.status || '未検証'
        hypothesisStatuses[status] = (hypothesisStatuses[status] || 0) + 1
        
        // 数値データの集計
        if (typeof h.impact === 'number') {
          totalImpact += h.impact
        }
        
        if (typeof h.uncertainty === 'number') {
          totalUncertainty += h.uncertainty
        }
        
        if (typeof h.confidence === 'number') {
          totalConfidence += h.confidence
          confidenceCount++
        }
      })
      
      // 検証データの取得
      const { data: validations, error: validationsError } = await supabase
        .from('validations')
        .select('id, result, hypothesis_id')
      
      if (validationsError) {
        throw new Error(`検証データの取得に失敗しました: ${validationsError.message}`)
      }
      
      // 仮説IDのセットを作成
      const hypothesisIds = new Set(hypotheses?.map(h => h.id) || [])
      
      // プロジェクトに関連する検証のみをフィルタリング
      const projectValidations = validations?.filter(v => 
        v.hypothesis_id && hypothesisIds.has(v.hypothesis_id)
      ) || []
      
      // 検証結果の集計
      const validationResults: Record<string, number> = {}
      projectValidations.forEach(v => {
        const result = v.result || '未完了'
        validationResults[result] = (validationResults[result] || 0) + 1
      })
      
      // KPI指標の取得
      const { data: kpiMetrics, error: kpiError } = await supabase
        .from('kpi_metrics')
        .select('id, name, current_value, target_value, unit, status')
        .eq('project_id', projectId)
        .eq('status', 'active')
      
      if (kpiError) {
        console.error('KPI指標の取得に失敗しました:', kpiError)
        // KPIエラーは致命的ではないので続行
      }
      
      // 平均値の計算
      const hypothesesCount = hypotheses?.length || 0
      const avgImpact = hypothesesCount > 0 ? totalImpact / hypothesesCount : null
      const avgUncertainty = hypothesesCount > 0 ? totalUncertainty / hypothesesCount : null
      const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : null
      
      // データを状態に設定
      setStats({
        hypothesesTotal: hypothesesCount,
        hypothesisStatuses,
        validationsTotal: projectValidations.length,
        validationResults,
        avgConfidence,
        avgImpact,
        avgUncertainty,
        lastUpdated
      })
      
      setKpis(kpiMetrics || [])
      
    } catch (error) {
      console.error('分析データの取得エラー:', error)
      setError(error instanceof Error ? error.message : '分析データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }
  
  // 初回レンダリングとプロジェクトID変更時にデータ取得
  useEffect(() => {
    fetchAnalyticsData()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 仮説ステータスの優先順位と色設定
  const statusConfig = {
    '未検証': { color: 'bg-slate-200', textColor: 'text-slate-700', icon: <Clock size={14} /> },
    '検証中': { color: 'bg-amber-200', textColor: 'text-amber-700', icon: <AlertTriangle size={14} /> },
    '成立': { color: 'bg-emerald-200', textColor: 'text-emerald-700', icon: <Check size={14} /> },
    '否定': { color: 'bg-rose-200', textColor: 'text-rose-700', icon: <XCircle size={14} /> }
  }
  
  // KPI進捗率の計算
  const getKpiProgress = (current: number, target: number | null) => {
    if (!target || target === 0) return 0
    const progress = (current / target) * 100
    return Math.min(progress, 100) // 100%を超えないように
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-indigo-600" />
          プロジェクト分析
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-slate-100 rounded-lg"></div>
            <div className="h-24 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" />
            プロジェクト分析
          </h3>
          <button 
            onClick={fetchAnalyticsData}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RefreshCcw size={12} />
            再試行
          </button>
        </div>
        <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm">
          <p>データ取得エラー: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600" />
          プロジェクト分析
        </h3>
        <button 
          onClick={fetchAnalyticsData}
          className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <RefreshCcw size={12} />
          更新
        </button>
      </div>
      
      {/* 仮説ステータスグラフ */}
      <div className="mb-5">
        <h4 className="text-xs font-medium text-slate-600 mb-2">仮説ステータス分布</h4>
        <div className="flex gap-2 mb-3">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div 
              key={status} 
              className={`h-2 rounded-full ${config.color}`}
              style={{ 
                width: `${stats.hypothesisStatuses[status] ? 
                  (stats.hypothesisStatuses[status] / stats.hypothesesTotal) * 100 : 0}%` 
              }}
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2 text-xs">
              <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
              <span className="text-slate-600">{status}</span>
              <span className={`ml-auto font-medium ${config.textColor}`}>
                {stats.hypothesisStatuses[status] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 検証進捗と結果 */}
      <div className="mb-5">
        <h4 className="text-xs font-medium text-slate-600 mb-2 flex justify-between">
          <span>検証実施率</span>
          <span>{stats.validationsTotal} / {stats.hypothesesTotal}</span>
        </h4>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-indigo-600 rounded-full" 
            style={{ 
              width: `${stats.hypothesesTotal ? 
                Math.min((stats.validationsTotal / stats.hypothesesTotal) * 100, 100) : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* KPI表示 */}
      {kpis.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-medium text-slate-600 mb-2">主要指標</h4>
          <div className="space-y-2">
            {kpis.map(kpi => (
              <div key={kpi.id} className="bg-slate-50 p-2 rounded-lg">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-medium text-slate-700">{kpi.name}</span>
                  <span className="text-slate-600">
                    {kpi.current_value}{kpi.unit || ''} 
                    {kpi.target_value ? ` / ${kpi.target_value}${kpi.unit || ''}` : ''}
                  </span>
                </div>
                {kpi.target_value && (
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        getKpiProgress(kpi.current_value, kpi.target_value) >= 100
                          ? 'bg-emerald-500'
                          : getKpiProgress(kpi.current_value, kpi.target_value) >= 70
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                      }`}
                      style={{ width: `${getKpiProgress(kpi.current_value, kpi.target_value)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 仮説品質指標 */}
      {(stats.avgImpact !== null || stats.avgConfidence !== null || stats.avgUncertainty !== null) && (
        <div className="mb-5">
          <h4 className="text-xs font-medium text-slate-600 mb-2">仮説品質指標（平均値）</h4>
          <div className="grid grid-cols-3 gap-2">
            {stats.avgImpact !== null && (
              <div className="bg-indigo-50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">インパクト</div>
                <div className="text-xl font-bold text-indigo-600">{stats.avgImpact.toFixed(1)}</div>
              </div>
            )}
            {stats.avgUncertainty !== null && (
              <div className="bg-amber-50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">不確実性</div>
                <div className="text-xl font-bold text-amber-600">{stats.avgUncertainty.toFixed(1)}</div>
              </div>
            )}
            {stats.avgConfidence !== null && (
              <div className="bg-emerald-50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">信頼度</div>
                <div className="text-xl font-bold text-emerald-600">{stats.avgConfidence.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 最終更新日 */}
      {stats.lastUpdated && (
        <div className="text-center text-xs text-slate-400 mt-4">
          最終更新: {new Date(stats.lastUpdated).toLocaleDateString('ja-JP', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
        </div>
      )}
      
      {/* 詳細ダッシュボードへのリンク - 将来的に実装する場合 */}
      <div className="mt-3 text-center">
        <a 
          href={`/projects/${projectId}/analytics`}
          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-1"
        >
          <span>詳細分析を表示</span>
          <ArrowUpRight size={12} />
        </a>
      </div>
    </div>
  )
}
