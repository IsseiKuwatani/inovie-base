'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import classNames from 'classnames'
import React from 'react'
import { X, Map, AlertTriangle, CheckCircle, XCircle, HelpCircle, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react'

type Hypothesis = {
  id: string
  title: string
  assumption: string
  expected_effect: string
  impact: number
  uncertainty: number
  type: string
  status: string
}

export default function HypothesisMap() {
  const { id: projectId } = useParams()
  const [data, setData] = useState<Hypothesis[]>([])
  const [selected, setSelected] = useState<Hypothesis | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const detailsRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: hypotheses } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)

      setData(hypotheses || [])
      setLoading(false)
    }

    fetchData()
  }, [projectId])

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
          <Map className="text-indigo-500" size={28} />
          仮説マップ
        </h1>
        <p className="text-slate-600 mt-2">
          影響度（縦軸）× 不確実性（横軸）のマトリックスに仮説を配置し、優先度の高い仮説を可視化します。
          右上のエリアにある項目が最も優先度が高くなります。
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <Map className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-medium text-slate-700">マップ表示する仮説がありません</h3>
          <p className="mt-2 text-slate-500">仮説を追加すると、このマップに自動的に表示されます</p>
          <Link
            href={`/projects/${projectId}/hypotheses/new`}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg transition-all duration-300 text-sm"
          >
            仮説を追加する
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-6 gap-3 relative mb-6">
                {/* 優先度の高いエリアを示す背景 */}
                <div></div>
                <div className="col-span-5 grid grid-cols-5 gap-3">
                  <div className="col-span-2"></div>
                  <div className="col-span-3 absolute right-0 top-10 bottom-1/2 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-tr-lg -z-10"></div>
                </div>

                {/* ラベル：縦軸（影響度） */}
                <div></div>
                {[1, 2, 3, 4, 5].map((u) => (
                  <div key={`col-header-${u}`} className="text-center text-xs text-slate-400"></div>
                ))}

                {[5, 4, 3, 2, 1].map((impact) => (
                  <React.Fragment key={`row-${impact}`}>
                    <div className="flex items-center font-medium text-sm text-slate-600 justify-end pr-2">
                      影響度 {impact}
                    </div>
                    {[1, 2, 3, 4, 5].map((uncertainty) => {
                      const items = data.filter(h => h.impact === impact && h.uncertainty === uncertainty)
                      const priority = impact * uncertainty;
                      let cellClass = "bg-white";
                      
                      if (priority >= 20) {
                        cellClass = "bg-gradient-to-br from-indigo-50/70 to-violet-50/70";
                      } else if (priority >= 16) {
                        cellClass = "bg-gradient-to-br from-indigo-50/40 to-violet-50/40";
                      }

                      return (
                        <div
                          key={`cell-${impact}-${uncertainty}`}
                          className={`min-h-[100px] border border-slate-200 rounded-lg p-2 flex flex-wrap gap-2 ${cellClass}`}
                        >
                          {items.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => setSelected(h === selected ? null : h)}
                              className={classNames(
                                'rounded-full px-3 py-1.5 text-xs text-white font-medium transition-all duration-200 shadow-sm',
                                getStatusColor(h.status),
                                h === selected ? 'ring-2 ring-offset-2 ring-indigo-300' : '',
                                'hover:shadow hover:scale-105 flex items-center gap-1'
                              )}
                              title={h.title}
                            >
                              {getStatusIcon(h.status)}
                              <span>{h.title.length > 16 ? h.title.slice(0, 16) + '…' : h.title}</span>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}

                {/* ラベル：横軸（不確実性） */}
                <div></div>
                {[1, 2, 3, 4, 5].map((uncertainty) => (
                  <div
                    key={`uncertainty-label-${uncertainty}`}
                    className="text-center mt-3 text-sm font-medium text-slate-600"
                  >
                    不確実性 {uncertainty}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 優先度の説明 */}
          <div className="mt-6 flex justify-end">
            <div className="inline-flex items-center text-sm text-slate-600">
              <span className="w-4 h-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded mr-2"></span>
              優先度が高い領域
            </div>
          </div>

          {/* 凡例 */}
          <div className="mt-6 flex flex-wrap gap-4 justify-end">
            <div className="text-sm text-slate-600 font-medium">ステータス:</div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500 text-white text-xs font-medium">
                <HelpCircle size={12} /> 未検証
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium">
                <AlertTriangle size={12} /> 検証中
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                <CheckCircle size={12} /> 成立
              </span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500 text-white text-xs font-medium">
                <XCircle size={12} /> 否定
              </span>
            </div>
          </div>
        </>
      )}

      {/* 詳細表示パネル - アコーディオン形式 */}
      <div ref={detailsRef} className="mt-10">
        {selected && (
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-slideDown">
            {/* ヘッダー部分 - クリックでアコーディオン展開/折りたたみ */}
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
            
            {/* コンテンツ部分 - アコーディオンで表示/非表示 */}
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
