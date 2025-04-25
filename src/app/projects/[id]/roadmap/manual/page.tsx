'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Plus, Trash, MoveUp, MoveDown, Search, Info, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

export default function ManualRoadmapPage() {
  const { id: projectId } = useParams()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [allHypotheses, setAllHypotheses] = useState<any[]>([])
  const [selectedHypotheses, setSelectedHypotheses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  
  // 選択ガイダンス
  const [showGuidance, setShowGuidance] = useState(true)
  
  // 詳細表示状態管理
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchHypotheses = async () => {
      if (!projectId) return
      setIsLoading(true)

      try {
        // 既存のロードマップ仮説を取得
        const { data: existingRoadmap, error: roadmapError } = await supabase
          .from('hypotheses')
          .select('id, title, assumption, type, roadmap_order')
          .eq('project_id', projectId)
          .eq('roadmap_tag', 'roadmap')
          .order('roadmap_order', { ascending: true })
        
        // 全仮説の取得
        const { data, error } = await supabase
          .from('hypotheses')
          .select('id, title, assumption, type, solution, expected_effect')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) throw error

        // 仮説タイプの抽出
        const types = [...new Set(data.map(h => h.type))]
        setAvailableTypes(types)

        // データの設定
        setAllHypotheses(data || [])
        
        // 既存のロードマップがあれば初期選択としてセット
        if (existingRoadmap && existingRoadmap.length > 0) {
          setSelectedHypotheses(existingRoadmap)
        }
      } catch (err) {
        console.error('仮説取得エラー:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHypotheses()
  }, [projectId])

  // 仮説をロードマップに追加
  const addToRoadmap = (hypothesis: any) => {
    if (selectedHypotheses.find((h) => h.id === hypothesis.id)) return
    setSelectedHypotheses([...selectedHypotheses, hypothesis])
    
    // 選択ガイダンスを非表示に
    if (showGuidance) setShowGuidance(false)
  }

  // ロードマップから仮説を削除
  const removeFromRoadmap = (id: string) => {
    setSelectedHypotheses(selectedHypotheses.filter((h) => h.id !== id))
  }

  // ロードマップ保存
  const saveRoadmap = async () => {
    if (!projectId || selectedHypotheses.length === 0) return
    setIsSaving(true)

    try {
      // 既存のロードマップタグをクリア
      await supabase
        .from('hypotheses')
        .update({ roadmap_tag: null, roadmap_order: null })
        .eq('project_id', projectId)
        .eq('roadmap_tag', 'roadmap')

      // 新しいロードマップを保存
      for (let i = 0; i < selectedHypotheses.length; i++) {
        const h = selectedHypotheses[i]
        await supabase
          .from('hypotheses')
          .update({ roadmap_tag: 'roadmap', roadmap_order: i + 1 })
          .eq('id', h.id)
      }

      // 保存成功メッセージを表示
      setShowSavedMessage(true)
      setTimeout(() => {
        router.push(`/projects/${projectId}/roadmap`)
      }, 1500)
    } catch (err) {
      console.error('保存エラー:', err)
      alert('ロードマップの保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 仮説の順序を上下に移動
  const moveHypothesis = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= selectedHypotheses.length) return

    const updatedHypotheses = [...selectedHypotheses]
    const temp = updatedHypotheses[index]
    updatedHypotheses[index] = updatedHypotheses[newIndex]
    updatedHypotheses[newIndex] = temp
    
    setSelectedHypotheses(updatedHypotheses)
  }

  // 詳細表示の切り替え
  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 検索とフィルタリング
  const filteredHypotheses = allHypotheses
    .filter(h => !selectedHypotheses.some(selected => selected.id === h.id)) // 既に選択済みの仮説を除外
    .filter(h => {
      // 検索クエリでフィルタリング
      const matchesSearch = searchQuery === '' || 
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.assumption && h.assumption.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // タイプでフィルタリング
      const matchesType = selectedType === null || h.type === selectedType
      
      return matchesSearch && matchesType
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-indigo-700 mb-2">マニュアルでロードマップを作成</h1>
      <p className="text-slate-600 mb-8">
        プロジェクトの仮説からロードマップに含める仮説を選び、検証の順序を設定します
      </p>

      {/* ===== ステップ1: ロードマップに含める仮説を選択 ===== */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
          ロードマップに含める仮説を選択
        </h2>

        {/* 検索・フィルターバー */}
        <div className="flex flex-wrap gap-3 items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="仮説を検索..."
              className="pl-10 pr-3 py-2 w-full border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">すべてのタイプ</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* 利用可能な仮説リスト */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-2">
          {filteredHypotheses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery || selectedType 
                ? '検索条件に一致する仮説が見つかりませんでした' 
                : 'すべての仮説が選択されています'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHypotheses.map((h) => (
                <div
                  key={h.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-start gap-2">
                        <h3 className="text-slate-800 font-medium">{h.title}</h3>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                          {h.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{h.assumption}</p>
                      
                      {/* 詳細情報（展開可能） */}
                      <button 
                        onClick={() => toggleItemExpanded(h.id)}
                        className="flex items-center text-xs text-indigo-600 mt-2 hover:text-indigo-800"
                      >
                        {expandedItems[h.id] ? '詳細を隠す' : '詳細を表示'}
                        {expandedItems[h.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedItems[h.id] && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm">
                          <div className="mb-2">
                            <h4 className="font-medium text-slate-700">解決策:</h4>
                            <p className="text-slate-600">{h.solution || '未設定'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-700">期待される効果:</h4>
                            <p className="text-slate-600">{h.expected_effect || '未設定'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors px-3 py-1.5 rounded-md"
                      onClick={() => addToRoadmap(h)}
                    >
                      <Plus className="w-4 h-4" /> ロードマップに追加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs text-slate-500">
          {filteredHypotheses.length} 件の仮説が表示されています
          {(searchQuery || selectedType) && ' (フィルター適用中)'}
        </div>
      </div>

      {/* ===== ステップ2: 仮説の順序を設定 ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
          検証の順序を設定
        </h2>

        {/* 選択ガイダンス */}
        {showGuidance && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">仮説をロードマップに追加してください</h3>
              <p className="text-sm text-amber-700">
                上のリストから「ロードマップに追加」ボタンをクリックして、検証したい仮説を選びましょう。
                追加した仮説はここに表示され、上下ボタンで順序を変更できます。
              </p>
            </div>
          </div>
        )}

        {/* 選択された仮説 */}
        {selectedHypotheses.length > 0 ? (
          <div className="space-y-3">
            {selectedHypotheses.map((h, index) => (
              <div
                key={h.id}
                className="border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm overflow-hidden group hover:shadow-md transition-all"
              >
                <div className="flex items-center p-2 bg-indigo-100 text-indigo-800 font-medium">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-2">
                    {index + 1}
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-600 mr-2" />
                  <div className="flex-grow">{index === selectedHypotheses.length - 1 ? 'ゴール' : 'ステップ'}</div>
                  <div className="flex space-x-1">
                    {index > 0 && (
                      <button
                        onClick={() => moveHypothesis(index, 'up')}
                        className="p-1 text-indigo-700 hover:bg-indigo-200 rounded"
                        title="上に移動"
                      >
                        <MoveUp size={16} />
                      </button>
                    )}
                    {index < selectedHypotheses.length - 1 && (
                      <button
                        onClick={() => moveHypothesis(index, 'down')}
                        className="p-1 text-indigo-700 hover:bg-indigo-200 rounded"
                        title="下に移動"
                      >
                        <MoveDown size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => removeFromRoadmap(h.id)}
                      className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                      title="削除"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-800">{h.title}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                      {h.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{h.assumption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
            <p className="text-slate-500">仮説が選択されていません</p>
            <p className="text-sm text-slate-400 mt-1">上のリストから仮説を追加してロードマップを作成してください</p>
          </div>
        )}
      </div>

      {/* ===== ステップ3: ロードマップの保存 ===== */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</div>
          ロードマップを保存
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="text-slate-600">
            {selectedHypotheses.length === 0 ? (
              '少なくとも1つの仮説を選択してください'
            ) : (
              `${selectedHypotheses.length}個の仮説を含むロードマップが作成されます`
            )}
          </div>
          
          <button
            onClick={saveRoadmap}
            disabled={selectedHypotheses.length === 0 || isSaving}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full 
              ${selectedHypotheses.length === 0 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'}
              transition-colors
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                ロードマップを保存して表示
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 保存成功メッセージ */}
      {showSavedMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-lg shadow-lg animate-fade-in">
          ロードマップが保存されました！ロードマップページに移動します...
        </div>
      )}
    </div>
  )
}
