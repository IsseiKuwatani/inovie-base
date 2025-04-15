'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import classNames from 'classnames'

export default function HypothesisList() {
  const { id: projectId } = useParams()
  const [hypotheses, setHypotheses] = useState<any[]>([])
  const [validationMap, setValidationMap] = useState<Record<string, { count: number; latest: string | null }>>({})
  const [filter, setFilter] = useState('すべて')

  useEffect(() => {
    const fetchHypotheses = async () => {
      const { data: hypoData } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setHypotheses(hypoData || [])

      const { data: validations } = await supabase
        .from('validations')
        .select('id, hypothesis_id, created_at')

      const map: Record<string, { count: number; latest: string | null }> = {}

      validations?.forEach((v) => {
        const hId = v.hypothesis_id
        if (!map[hId]) {
          map[hId] = { count: 0, latest: null }
        }
        map[hId].count += 1
        if (!map[hId].latest || new Date(v.created_at) > new Date(map[hId].latest)) {
          map[hId].latest = v.created_at
        }
      })

      setValidationMap(map)
    }

    fetchHypotheses()
  }, [projectId])

  const statusColors: Record<string, string> = {
    '未検証': 'bg-gray-200 text-gray-800',
    '検証中': 'bg-yellow-200 text-yellow-800',
    '成立': 'bg-green-200 text-green-800',
    '否定': 'bg-red-200 text-red-800',
  }

  const filteredHypotheses = hypotheses.filter(h =>
    filter === 'すべて' ? true : h.status === filter
  )

  const statusOptions = ['すべて', '未検証', '検証中', '成立', '否定']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仮説一覧</h1>

      {/* フィルター */}
      <div className="flex gap-3 flex-wrap text-sm">
        {statusOptions.map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={classNames(
              'px-3 py-1 rounded-full border',
              filter === option ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border-gray-300'
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {/* 一覧カード */}
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHypotheses.map((h) => {
          const stats = validationMap[h.id] || { count: 0, latest: null }
          const statusClass = statusColors[h.status] || 'bg-gray-100 text-gray-700'

          return (
            <li key={h.id} className="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition space-y-2">
              <Link href={`/projects/${projectId}/hypotheses/${h.id}`} className="block space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">{h.title}</h2>
                <span className={`inline-block text-xs px-2 py-1 rounded ${statusClass}`}>
                  {h.status}
                </span>
                <p className="text-sm text-gray-500 mt-1">種類: {h.type}</p>
              </Link>
              <p className="text-xs text-gray-400">
                🧪 検証数: {stats.count}　
                🕒 最終検証: {stats.latest ? new Date(stats.latest).toLocaleDateString() : '未実施'}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
