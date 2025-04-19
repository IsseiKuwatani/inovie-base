'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import React from 'react'
import { 
  X, Map as MapIcon, AlertTriangle, CheckCircle, XCircle, 
  HelpCircle, ArrowUpRight, ChevronDown, ChevronUp, 
  Link as LinkIcon, ArrowLeft, ExternalLink
} from 'lucide-react'

type Hypothesis = {
  id: string
  title: string
  assumption: string
  expected_effect: string
  impact: number
  uncertainty: number
  type: string
  status: string
  created_at: string
}

type HypothesisLink = {
  id: string
  from_id: string
  to_id: string
  label: string | null
}

type HypothesisNode = {
  id: string
  data: Hypothesis
  children: {
    id: string
    linkId: string
    label: string | null
  }[]
  parents: {
    id: string
    linkId: string
    label: string | null
  }[]
}

export default function HypothesisTreeMap() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [links, setLinks] = useState<HypothesisLink[]>([])
  const [selected, setSelected] = useState<Hypothesis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [treeData, setTreeData] = useState<Record<string, HypothesisNode>>({})
  const [rootNodes, setRootNodes] = useState<string[]>([])
  const detailsRef = React.useRef<HTMLDivElement>(null)

  // プロジェクト情報を取得する
  useEffect(() => {
    const fetchProjectInfo = async () => {
      const { data } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()
      
      if (data) {
        setProjectName(data.name)
      }
    }
    
    fetchProjectInfo()
  }, [projectId])

  // 仮説とリンクを取得する
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      
      // 仮説データを取得
      const { data: hypothesesData } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)
      
      if (hypothesesData && hypothesesData.length > 0) {
        setHypotheses(hypothesesData)
        
        // 仮説リンクデータを取得
        const { data: linksData } = await supabase
          .from('hypothesis_links')
          .select('*')
          .or(
            `from_id.in.(${hypothesesData.map(h => `"${h.id}"`).join(',')}),` +
            `to_id.in.(${hypothesesData.map(h => `"${h.id}"`).join(',')})`
          )
        
        setLinks(linksData || [])
      } else {
        setHypotheses([])
        setLinks([])
      }
      
      setIsLoading(false)
    }

    fetchData()
  }, [projectId])

  // 階層構造データを構築する
  useEffect(() => {
    if (hypotheses.length > 0) {
      // 仮説ノードマップの作成
      const nodesMap: Record<string, HypothesisNode> = {}
      
      // 全仮説をノードとして初期化
      hypotheses.forEach(h => {
        nodesMap[h.id] = {
          id: h.id,
          data: h,
          children: [],
          parents: []
        }
      })
      
      // リンク情報に基づいて親子関係を構築
      links.forEach(link => {
        if (nodesMap[link.from_id] && nodesMap[link.to_id]) {
          // fromはchildrenに追加
          nodesMap[link.from_id].children.push({
            id: link.to_id,
            linkId: link.id,
            label: link.label
          })
          
          // toはparentsに追加
          nodesMap[link.to_id].parents.push({
            id: link.from_id,
            linkId: link.id,
            label: link.label
          })
        }
      })
      
      // ルートノード（親を持たない仮説）を特定
      const roots = Object.values(nodesMap)
        .filter(node => node.parents.length === 0)
        .map(node => node.id)
      
      setTreeData(nodesMap)
      setRootNodes(roots)
    }
  }, [hypotheses, links])

  // 選択された仮説の詳細表示のスクロール処理
  useEffect(() => {
    if (selected) {
      setShowDetails(true)
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      setShowDetails(false)
    }
  }, [selected])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '未検証': return 'bg-slate-500 hover:bg-slate-600'
      case '検証中': return 'bg-amber-500 hover:bg-amber-600'
      case '成立': return 'bg-emerald-500 hover:bg-emerald-600'
      case '否定': return 'bg-rose-500 hover:bg-rose-600'
      default: return 'bg-slate-300 hover:bg-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '未検証': return <HelpCircle size={14} />
      case '検証中': return <AlertTriangle size={14} />
      case '成立': return <CheckCircle size={14} />
      case '否定': return <XCircle size={14} />
      default: return <HelpCircle size={14} />
    }
  }
  
  // 仮説のフェーズを状態から推測する関数
  const getPhase = (status: string) => {
    switch (status) {
      case '未検証': return 'マップ'
      case '検証中': return 'ループ'
      case '成立': return 'リープ'
      case '否定': return 'ループ'
      default: return 'マップ'
    }
  }
  
  // フェーズに基づく色を取得する関数
  const getPhaseColors = (phase: string) => {
    switch (phase) {
      case 'マップ': return {
        border: 'border-slate-300',
        bg: 'bg-slate-50',
        text: 'text-slate-700'
      }
      case 'ループ': return {
        border: 'border-indigo-300',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700'
      }
      case 'リープ': return {
        border: 'border-cyan-300',
        bg: 'bg-cyan-50',
        text: 'text-cyan-700'
      }
      default: return {
        border: 'border-slate-300',
        bg: 'bg-slate-50',
        text: 'text-slate-700'
      }
    }
  }
  
  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // ツリーの再帰的なレンダリング
  const renderTree = (nodeId: string, level: number = 0, path: string[] = []) => {
    const node = treeData[nodeId]
    if (!node) return null
    
    // ループを防ぐためのパス検証
    if (path.includes(nodeId)) {
      return (
        <div className="ml-8 mt-2 px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-amber-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>循環参照が検出されました</span>
          </div>
        </div>
      )
    }
    
    const phase = getPhase(node.data.status)
    const colors = getPhaseColors(phase)
    const newPath = [...path, nodeId]
    
    return (
      <div key={nodeId} className="mb-4">
        <div 
          className={`border-2 ${colors.border} rounded-lg p-4 ${colors.bg} hover:shadow-md transition-all cursor-pointer`}
          style={{ marginLeft: `${level * 36}px` }}
          onClick={() => setSelected(selected?.id === nodeId ? null : node.data)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className={`font-medium ${colors.text} text-lg`}>{node.data.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${getStatusColor(node.data.status)} text-white`}>
                  {node.data.status}
                </span>
                <span className={`px-2 py-1 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}>
                  {phase}
                </span>
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {node.data.type}
                </span>
                {node.parents.length > 0 && (
                  <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                    <LinkIcon size={12} />
                    親: {node.parents.length}件
                  </span>
                )}
                {node.children.length > 0 && (
                  <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                    <LinkIcon size={12} />
                    子: {node.children.length}件
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                作成日: {formatDate(node.data.created_at)}
              </div>
            </div>
            <Link
              href={`/projects/${projectId}/hypotheses/${nodeId}`}
              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
        
        {/* 子ノードの表示（存在する場合のみ） */}
        {node.children.length > 0 && (
          <div className="ml-8 mt-2 pl-4 border-l-2 border-indigo-100">
            {node.children.map(child => (
              <div key={child.id} className="relative">
                {child.label && (
                  <div className="absolute -left-4 -top-2 inline-block px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded">
                    {child.label}
                  </div>
                )}
                {renderTree(child.id, level + 1, newPath)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* プロジェクト&ナビゲーション */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft size={16} />
              <span>{projectName ? projectName : 'プロジェクト'}</span>
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectId}/hypotheses`} className="hover:text-indigo-600">
              仮説一覧
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-medium">ツリーマップ</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <MapIcon className="text-indigo-500" size={28} />
            仮説ツリーマップ
          </h1>
          <p className="text-slate-600 mt-2">
            仮説の関連性を可視化し、マップ・ループ・リープの流れを表現します。それぞれの仮説をクリックすると詳細が表示されます。
          </p>
        </div>

        <div className="flex justify-end">
          <Link
            href={`/projects/${projectId}/hypotheses/new`}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>仮説を追加</span>
          </Link>
        </div>
      </div>

      {/* フェーズ説明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          <h3 className="font-medium text-lg text-slate-700 mb-2">1. マップ</h3>
          <p className="text-sm text-slate-600">仮説の全体像をざっくりと描くフェーズ。未検証の仮説がこのフェーズに含まれます。</p>
        </div>
        <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
          <h3 className="font-medium text-lg text-indigo-700 mb-2">2. ループ</h3>
          <p className="text-sm text-indigo-600">仮説生成と検証のループを回すフェーズ。検証中や否定された仮説がこのフェーズに含まれます。</p>
        </div>
        <div className="border border-cyan-200 rounded-xl p-4 bg-cyan-50">
          <h3 className="font-medium text-lg text-cyan-700 mb-2">3. リープ</h3>
          <p className="text-sm text-cyan-600">リスクを取って仮説を選び行動して実現するフェーズ。成立した仮説がこのフェーズに含まれます。</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : hypotheses.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <MapIcon className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-medium text-slate-700">マップ表示する仮説がありません</h3>
          <p className="mt-2 text-slate-500">仮説を追加すると、このマップに自動的に表示されます</p>
          <Link
            href={`/projects/${projectId}/hypotheses/new`}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg transition-all duration-300 text-sm"
          >
            仮説を追加する
          </Link>
        </div>
      ) : links.length === 0 ? (
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h3 className="mt-4 text-xl font-medium text-amber-700">仮説間の関連付けがありません</h3>
            <p className="mt-2 text-amber-600 max-w-lg mx-auto">
              仮説間の関連付けがまだ設定されていません。「仮説一覧」画面の「仮説間の関連付け」ボタンから関連付けを追加してください。
            </p>
            <Link
              href={`/projects/${projectId}/hypotheses`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all duration-300 text-sm"
            >
              仮説一覧へ戻る
            </Link>
          </div>
          
          {/* リンクがない場合はフラットリスト表示 */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">すべての仮説</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hypotheses.map(h => {
                const phase = getPhase(h.status)
                const colors = getPhaseColors(phase)
                
                return (
                  <div 
                    key={h.id}
                    className={`border ${colors.border} rounded-lg p-4 ${colors.bg} hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => setSelected(selected?.id === h.id ? null : h)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-medium ${colors.text}`}>{h.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${getStatusColor(h.status)} text-white`}>
                            {h.status}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                            {h.type}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/projects/${projectId}/hypotheses/${h.id}`}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] pb-4">
              {/* ツリー表示 */}
              {rootNodes.length > 0 ? (
                <div>
                  {rootNodes.map(nodeId => renderTree(nodeId))}
                </div>
              ) : (
                <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
                  <h3 className="mt-4 text-xl font-medium text-amber-700">ツリー構造を構築できません</h3>
                  <p className="mt-2 text-amber-600 max-w-lg mx-auto">
                    仮説間の関連付けはありますが、ツリーのルートとなる仮説（親を持たない仮説）が見つかりません。
                    循環参照がある可能性があります。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 詳細表示パネル */}
      <div ref={detailsRef} className="mt-10">
        {selected && (
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-slideDown">
            {/* ヘッダー部分 */}
            <div 
              className="p-4 sm:p-6 flex justify-between items-center cursor-pointer border-b border-slate-100"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-medium ${getStatusColor(selected.status)}`}>
                  {getStatusIcon(selected.status)}
                  <span>{selected.status}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(!showDetails);
                  }}
                >
                  {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <button
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* コンテンツ部分 */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showDetails ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 sm:p-6 pt-4">
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {selected.type}
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                      優先度: {selected.impact * selected.uncertainty}
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
                      フェーズ: {getPhase(selected.status)}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-xl space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">前提</h3>
                      <p className="text-sm text-slate-600">{selected.assumption || '設定されていません'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">期待される効果</h3>
                      <p className="text-sm text-slate-600">{selected.expected_effect || '設定されていません'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">影響度</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{selected.impact}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">不確実性</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{selected.uncertainty}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 関連する仮説の表示 */}
                  {(treeData[selected.id]?.parents.length > 0 || treeData[selected.id]?.children.length > 0) && (
                    <div className="bg-violet-50 p-4 sm:p-5 rounded-xl space-y-5 border border-violet-100">
                      <h3 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
                        <LinkIcon size={16} />
                        関連する仮説
                      </h3>
                      
                      {treeData[selected.id]?.parents.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-violet-700 mb-2">親仮説</h4>
                          <ul className="space-y-2">
                            {treeData[selected.id].parents.map(parent => (
                              <li key={parent.id} className="bg-white rounded-lg p-3 border border-violet-100 flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{treeData[parent.id]?.data.title}</div>
                                  {parent.label && (
                                    <div className="text-xs text-violet-700 mt-1">
                                      関連：{parent.label}
                                    </div>
                                  )}
                                </div>
                                <Link
                                  href={`/projects/${projectId}/hypotheses/${parent.id}`}
                                  className="text-indigo-600 hover:text-indigo-800 p-1"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {treeData[selected.id]?.children.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-violet-700 mb-2">子仮説</h4>
                          <ul className="space-y-2">
                            {treeData[selected.id].children.map(child => (
                              <li key={child.id} className="bg-white rounded-lg p-3 border border-violet-100 flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{treeData[child.id]?.data.title}</div>
                                  {child.label && (
                                    <div className="text-xs text-violet-700 mt-1">
                                      関連：{child.label}
                                    </div>
                                  )}
                                </div>
                                <Link
                                  href={`/projects/${projectId}/hypotheses/${child.id}`}
                                  className="text-indigo-600 hover:text-indigo-800 p-1"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              </li>
                            ))}

                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <Link
                      href={`/projects/${projectId}/hypotheses/${selected.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg transition-all duration-300 text-sm"
                    >
                      <span>仮説詳細を見る</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}