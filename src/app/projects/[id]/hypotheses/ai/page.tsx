'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Check, Filter, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AiHypothesisPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [count, setCount] = useState(3) // 生成する仮説の数
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]) // 複数選択用の配列
  const [filterType, setFilterType] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<string>('') // 保存状態のメッセージ
  const [generationMode, setGenerationMode] = useState('balanced') // 生成モード
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false) // 詳細設定表示

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResults([])
    setSelectedIndices([]) // 選択をリセット
    setSavingStatus('')
    setLoading(true)

    try {
      const res = await fetch('/api/hypotheses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, project_id: projectId, count, mode: generationMode })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成に失敗しました')
      setResults(Array.isArray(data) ? data : [data])
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const normalizeScore = (val: any) => {
    const num = Number(val)
    if (isNaN(num)) return 3
    return Math.min(5, Math.max(1, Math.round(num)))
  }

  const normalizeHypothesis = (h: any) => ({
    title: h.title ?? h['タイトル'],
    assumption: h.premise ?? h['前提'],
    solution: h.solution ?? h['解決策'],
    expected_effect: h.expected_effect ?? h['期待される効果'],
    type: h.type ?? h['仮説タイプ'],
    status: h.status ?? h['ステータス'] ?? '未検証',
    impact: normalizeScore(h.impact ?? h['影響度']),
    uncertainty: normalizeScore(h.uncertainty ?? h['不確実性']),
    confidence: normalizeScore(h.confidence ?? h['確信度']),
  })

  // 仮説の選択・選択解除を切り替える
  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  // 全選択・全解除を切り替える
  const toggleSelectAll = () => {
    if (selectedIndices.length === filteredResults.length) {
      // すべて選択されている場合は全解除
      setSelectedIndices([])
    } else {
      // 一部または未選択の場合は全選択
      setSelectedIndices(filteredResults.map((_, i) => i))
    }
  }

  // 単一仮説を登録
  const handleApplySingle = async (index: number) => {
    if (!projectId) {
      setError('プロジェクトIDが取得できません')
      return
    }

    try {
      setLoading(true)
      const hypothesis = normalizeHypothesis(results[index])
      const { data, error } = await supabase
        .from('hypotheses')
        .insert([{ ...hypothesis, project_id: projectId }])
        .select()
        .single()

      if (error) throw error

      router.push(`/projects/${projectId}/hypotheses/${data.id}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || '仮説の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 複数仮説を一括登録
  const handleApplyMultiple = async () => {
    if (!projectId || selectedIndices.length === 0) {
      setError('プロジェクトIDが取得できないか、仮説が選択されていません')
      return
    }

    try {
      setLoading(true)
      setSavingStatus('登録中...')
      
      // 選択された仮説を正規化して配列に格納
      const hypothesesToInsert = selectedIndices.map(index => {
        const hypothesis = normalizeHypothesis(results[index])
        return { ...hypothesis, project_id: projectId }
      })
      
      // 一括挿入
      const { data, error } = await supabase
        .from('hypotheses')
        .insert(hypothesesToInsert)
        .select()

      if (error) throw error

      setSavingStatus(`${data.length}件の仮説を登録しました！`)
      
      // 登録完了後、選択をクリア
      setSelectedIndices([])
      
      // 少し待ってからプロジェクトページに戻る
      setTimeout(() => {
        router.push(`/projects/${projectId}/hypotheses`)
      }, 1500)
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || '仮説の保存に失敗しました')
      setSavingStatus('')
    } finally {
      setLoading(false)
    }
  }

  // 表示用の仮説タイプリスト
  const hypothesisTypes = ['課題仮説', '価値仮説', '市場仮説', '価格仮説', 'チャネル仮説']
  
  // フィルタリング機能
  const filteredResults = filterType 
    ? results.filter(h => (h.type === filterType))
    : results

  // スコア表示関数
  const renderScoreStars = (score: number, label: string) => (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500">{label}:</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`text-sm ${i <= score ? 'text-amber-500' : 'text-slate-300'}`}>★</span>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-indigo-700">AIと一緒に仮説を作る</h1>

      <div className="p-4 bg-indigo-50 border border-indigo-200 text-sm text-indigo-800 rounded-md">
        <p className="font-medium mb-1">プロジェクト情報も自動的にAIに渡されます</p>
        <p>
          このフォームに入力された内容に加えて、現在のプロジェクトに登録されている情報（プロジェクト名、概要など）もAIが仮説生成の参考に自動で利用します。
        </p>
        <p className="mt-1">そのため、少ない入力でも仮説の精度が高まる設計になっています。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          プロジェクトの背景や、仮説にしたいテーマ・気になること
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={6}
          required
          className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder={`例：
- 共働き家庭向けの健康習慣アプリを構想中
- 平日の睡眠・食事・運動に課題がありそう
- 30代の子育て世代をターゲットにしたい
- 月額制アプリを想定しているが価格に不安あり`}
        />

        {/* 詳細設定の開閉ボタン */}
        <button
          type="button"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-indigo-600 text-sm flex items-center gap-1 hover:text-indigo-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          詳細設定 {showAdvancedOptions ? '（閉じる）' : '（開く）'}
        </button>

        {/* 詳細設定パネル */}
        {showAdvancedOptions && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                仮説生成モード
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setGenerationMode('balanced')}
                  className={`cursor-pointer border rounded-lg p-3 ${
                    generationMode === 'balanced' 
                      ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100' 
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="font-medium text-slate-800 mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    バランス型
                  </div>
                  <p className="text-xs text-slate-600">影響度と不確実性のバランスが取れた仮説を生成します</p>
                </div>
                
                <div
                  onClick={() => setGenerationMode('high-impact')}
                  className={`cursor-pointer border rounded-lg p-3 ${
                    generationMode === 'high-impact' 
                      ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-100' 
                      : 'border-slate-200 hover:border-rose-200'
                  }`}
                >
                  <div className="font-medium text-slate-800 mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    高インパクト優先
                  </div>
                  <p className="text-xs text-slate-600">成功時の影響が大きい仮説を優先的に生成します</p>
                </div>
                
                <div
                  onClick={() => setGenerationMode('strategic')}
                  className={`cursor-pointer border rounded-lg p-3 ${
                    generationMode === 'strategic' 
                      ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-100' 
                      : 'border-slate-200 hover:border-amber-200'
                  }`}
                >
                  <div className="font-medium text-slate-800 mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    戦略的仮説ツリー
                  </div>
                  <p className="text-xs text-slate-600">仮説ツリーの基幹となる根本的な仮説を生成します</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                生成する仮説の数
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="border border-slate-300 rounded-lg p-2 text-sm w-full md:w-1/3"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}件</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-all flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              生成中...
            </>
          ) : (
            '仮説を生成する'
          )}
        </button>
      </form>

      {error && (
        <div className="text-sm text-rose-600 border border-rose-200 bg-rose-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {savingStatus && (
        <div className="text-sm text-emerald-600 border border-emerald-200 bg-emerald-50 p-3 rounded-lg">
          {savingStatus}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">生成された仮説 ({results.length}件)</h2>
            
            <div className="flex flex-wrap items-center gap-4">
              {results.length > 1 && (
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-500" />
                  <select
                    value={filterType || ''}
                    onChange={(e) => setFilterType(e.target.value || null)}
                    className="border border-slate-300 rounded p-1 text-sm"
                  >
                    <option value="">すべてのタイプ</option>
                    {hypothesisTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {filteredResults.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-indigo-600 text-sm border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50"
                >
                  {selectedIndices.length === filteredResults.length ? 'すべて解除' : 'すべて選択'}
                </button>
              )}
              
              {selectedIndices.length > 0 && (
                <button
                  onClick={handleApplyMultiple}
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded-full hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm"
                  disabled={loading}
                >
                  <Save size={16} />
                  選択した{selectedIndices.length}件を登録
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredResults.map((result, index) => {
              const isSelected = selectedIndices.includes(index);
              
              const isHighValue = normalizeScore(result.impact) >= 4 && normalizeScore(result.uncertainty) >= 4;
              const isStrategic = result.tree_level === '基幹';
              
              return (
                <div 
                  key={index}
                  className={`bg-white border rounded-lg p-5 shadow-sm transition-all ${
                    isSelected 
                      ? 'border-indigo-400 ring-2 ring-indigo-100' 
                      : 'border-slate-200 hover:border-indigo-200'
                  } ${
                    isHighValue 
                      ? 'bg-gradient-to-br from-white to-amber-50' 
                      : isStrategic 
                        ? 'bg-gradient-to-br from-white to-violet-50' 
                        : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelection(index)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? <Check size={16} /> : ''}
                      </button>
                      <h3 className="text-lg font-medium text-slate-800">{result.title}</h3>
                    </div>
                    {isHighValue && (
                      <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        高価値
                      </span>
                    )}
                    {isStrategic && (
                      <span className="px-2 py-1 text-xs rounded-full bg-violet-100 text-violet-700 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                        </svg>
                        基幹仮説
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 font-medium">
                      {result.type}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">前提</h4>
                      <p className="text-sm text-slate-600">{result.premise}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">解決策</h4>
                      <p className="text-sm text-slate-600">{result.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">期待される効果</h4>
                      <p className="text-sm text-slate-600">{result.expected_effect}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-4 mb-2">
                      {renderScoreStars(normalizeScore(result.impact), '影響度')}
                      {renderScoreStars(normalizeScore(result.uncertainty), '不確実性')}
                      {renderScoreStars(normalizeScore(result.confidence), '確信度')}
                    </div>
                    
                    {/* インパクト×不確実性のマトリックス表示 */}
                    {isHighValue && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800">
                        この仮説は<strong>高インパクト×高不確実性</strong>の組み合わせで、検証価値が高いと考えられます
                      </div>
                    )}
                    
                    {isStrategic && (
                      <div className="bg-violet-50 border border-violet-100 rounded-lg p-2 text-xs text-violet-800">
                        この仮説は<strong>基幹的な位置づけ</strong>で、複数の派生仮説の検証につながる可能性があります
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSelection(index)}
                      className={`flex-1 px-3 py-2 rounded-full transition-all flex items-center justify-center gap-2 ${
                        isSelected 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <X size={16} />
                          選択解除
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          選択する
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleApplySingle(index)}
                      className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-full hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      この仮説のみ登録
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
