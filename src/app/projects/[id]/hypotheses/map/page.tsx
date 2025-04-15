'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import classNames from 'classnames'
import React from 'react'

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

  useEffect(() => {
    const fetchData = async () => {
      const { data: hypotheses } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)

      setData(hypotheses || [])
    }

    fetchData()
  }, [projectId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '未検証': return 'bg-gray-400'
      case '検証中': return 'bg-blue-500'
      case '成立': return 'bg-green-500'
      case '否定': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🗺 仮説マップ</h1>
      <p className="text-sm text-gray-500 mb-6">影響度 × 不確実性</p>

      <div className="grid grid-cols-6 gap-2 relative mb-4">
        {/* ラベル：縦軸（影響度） */}
        <div></div>
        {[1, 2, 3, 4, 5].map((u) => (
          <div key={`col-header-${u}`} className="text-center text-xs text-gray-400"></div>
        ))}

        {[5, 4, 3, 2, 1].map((impact) => (
          <React.Fragment key={`row-${impact}`}>
            <div className="flex items-center font-medium text-sm text-gray-600 justify-end pr-1">
              影響度 {impact}
            </div>
            {[1, 2, 3, 4, 5].map((uncertainty) => {
              const items = data.filter(h => h.impact === impact && h.uncertainty === uncertainty)

              return (
                <div
                  key={`cell-${impact}-${uncertainty}`}
                  className="min-h-[90px] border border-gray-200 bg-white rounded-md p-2 flex flex-wrap gap-2"
                >
                  {items.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelected(h)}
                      className={classNames(
                        'rounded px-2 py-1 text-xs text-white font-medium transition shadow',
                        getStatusColor(h.status),
                        'hover:scale-105'
                      )}
                      title={h.title}
                    >
                      {h.title.length > 18 ? h.title.slice(0, 18) + '…' : h.title}
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
            className="text-center mt-2 text-sm font-medium text-gray-600"
          >
            不確実性 {uncertainty}
          </div>
        ))}
      </div>

      {/* 詳細表示パネル */}
      {selected && (
        <div className="mt-8 p-5 bg-white border rounded shadow-md max-w-xl">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold">{selected.title}</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              ✕ 閉じる
            </button>
          </div>
          <p className="text-sm text-gray-700"><strong>タイプ:</strong> {selected.type}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>前提:</strong> {selected.assumption || '―'}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>効果:</strong> {selected.expected_effect || '―'}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>ステータス:</strong> {selected.status}</p>
          <Link
            href={`/projects/${projectId}/hypotheses/${selected.id}`}
            className="inline-block mt-4 px-4 py-2 text-sm text-white bg-gray-800 rounded hover:bg-gray-700"
          >
            仮説詳細を見る
          </Link>
        </div>
      )}
    </div>
  )
}
