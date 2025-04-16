'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import classNames from 'classnames'
import { motion } from 'framer-motion' // アニメーションのために追加

type Hypothesis = {
  id: string
  title: string
  type: string
  status: string
  impact: number
  uncertainty: number
  confidence: number
  created_at: string
}

export default function HypothesisList() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHypotheses = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const withPriority = data.map((h) => ({
          ...h,
          priority: h.impact * h.uncertainty,
        }))
        setHypotheses(withPriority.sort((a, b) => b.priority - a.priority))
      }
      setIsLoading(false)
    }

    fetchHypotheses()
  }, [projectId])

  const getPriorityLabel = (score: number) => {
    if (score >= 20) return '高'
    if (score >= 15) return '中'
    return '低'
  }

  const getPriorityColor = (score: number) => {
    if (score >= 20) return 'bg-rose-100 text-rose-600'
    if (score >= 15) return 'bg-amber-100 text-amber-600'
    return 'bg-slate-100 text-slate-600'
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">仮説一覧</h1>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : hypotheses.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-4 text-xl font-medium text-slate-700">仮説がありません</h3>
          <p className="mt-2 text-slate-500">まだ仮説が登録されていません。「仮説を追加」ボタンから新しい仮説を作成しましょう。</p>
        </div>
      ) : (
        <motion.ul 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {hypotheses.map((h) => {
            const priority = h.impact * h.uncertainty
            const priorityLabel = getPriorityLabel(priority)
            const priorityColor = getPriorityColor(priority)

            return (
              <motion.li
                key={h.id}
                variants={item}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all duration-300 hover:border-indigo-200 group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-700 transition-colors">{h.title}</h2>
                    <span className={classNames('inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium', priorityColor)}>
                      優先度 {priorityLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">スコア: {priority}</div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>影響度: {h.impact}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>不確実性: {h.uncertainty}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>確信度: {h.confidence}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                    タイプ: {h.type}
                  </div>
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                    ステータス: {h.status}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/projects/${projectId}/hypotheses/${h.id}`}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors group-hover:translate-x-1 transition-transform duration-300"
                  >
                    詳細を見る
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </div>
  )
}
