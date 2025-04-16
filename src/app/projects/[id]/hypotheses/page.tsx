'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import classNames from 'classnames'
import { motion } from 'framer-motion'

type Hypothesis = {
  id: string
  title: string
  type: string
  status: string
  impact: number
  uncertainty: number
  confidence: number
  created_at: string
  priority?: number
}

type ViewMode = 'grid' | 'list'
type SortOption = 'priority' | 'impact' | 'uncertainty' | 'created_at'

export default function HypothesisList() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [filteredHypotheses, setFilteredHypotheses] = useState<Hypothesis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [columns, setColumns] = useState<number>(2)
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    priority: 'all',
    type: 'all',
    status: 'all',
  })
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [projectInfo, setProjectInfo] = useState<{ name: string; description: string | null } | null>(null)

useEffect(() => {
  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single()

    if (!error && data) {
      setProjectInfo(data)
    }
  }

  fetchProject()
}, [projectId])


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
        
        // デフォルトソート（優先度の降順）
        const sortedData = withPriority.sort((a, b) => b.priority! - a.priority!)
        
        // 利用可能なタイプとステータスのリストを作成
        const types = [...new Set(sortedData.map(h => h.type))]
        const statuses = [...new Set(sortedData.map(h => h.status))]
        
        setHypotheses(sortedData)
        setFilteredHypotheses(sortedData)
        setAvailableTypes(types)
        setAvailableStatuses(statuses)
      }
      setIsLoading(false)
    }

    fetchHypotheses()
  }, [projectId])

  // フィルタリングとソートを適用
  useEffect(() => {
    let filtered = [...hypotheses]
    
    // 検索クエリでフィルタリング
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(h => 
        h.title.toLowerCase().includes(query) || 
        h.type.toLowerCase().includes(query) ||
        h.status.toLowerCase().includes(query)
      )
    }
    
    // 優先度でフィルタリング
    if (filters.priority !== 'all') {
      if (filters.priority === 'high') {
        filtered = filtered.filter(h => h.priority! >= 20)
      } else if (filters.priority === 'medium') {
        filtered = filtered.filter(h => h.priority! >= 15 && h.priority! < 20)
      } else if (filters.priority === 'low') {
        filtered = filtered.filter(h => h.priority! < 15)
      }
    }
    
    // タイプでフィルタリング
    if (filters.type !== 'all') {
      filtered = filtered.filter(h => h.type === filters.type)
    }
    
    // ステータスでフィルタリング
    if (filters.status !== 'all') {
      filtered = filtered.filter(h => h.status === filters.status)
    }
    
    // ソート
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'priority':
          comparison = a.priority! - b.priority!
          break
        case 'impact':
          comparison = a.impact - b.impact
          break
        case 'uncertainty':
          comparison = a.uncertainty - b.uncertainty
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        default:
          comparison = a.priority! - b.priority!
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setFilteredHypotheses(filtered)
  }, [hypotheses, filters, sortBy, sortDirection, searchQuery])

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

  const getDateFormat = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('desc') // 新しいソートオプションの場合は降順をデフォルトに
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
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
     {projectInfo && (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-3 hover:shadow-md transition-all duration-300">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{projectInfo.name}</h2>
    {projectInfo.description && (
      <p className="text-slate-600 text-sm">{projectInfo.description}</p>
    )}
  </div>
)}

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
        <>
          {/* フィルターと表示コントロール */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-grow">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center rounded-lg border border-slate-200 p-1">
                  <button
                    className={classNames(
                      "p-1.5 rounded",
                      viewMode === 'grid' ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                    )}
                    onClick={() => setViewMode('grid')}
                    title="グリッド表示"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    className={classNames(
                      "p-1.5 rounded",
                      viewMode === 'list' ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                    )}
                    onClick={() => setViewMode('list')}
                    title="リスト表示"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {viewMode === 'grid' && (
                  <div className="flex items-center rounded-lg border border-slate-200 p-1">
                    <button
                      className={classNames(
                        "p-1.5 rounded",
                        columns === 1 ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                      )}
                      onClick={() => setColumns(1)}
                      title="1カラム"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      className={classNames(
                        "p-1.5 rounded",
                        columns === 2 ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                      )}
                      onClick={() => setColumns(2)}
                      title="2カラム"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      className={classNames(
                        "p-1.5 rounded",
                        columns === 3 ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                      )}
                      onClick={() => setColumns(3)}
                      title="3カラム"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-lg border border-slate-200 text-sm"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="all">優先度: すべて</option>
                <option value="high">優先度: 高</option>
                <option value="medium">優先度: 中</option>
                <option value="low">優先度: 低</option>
              </select>

              <select
                className="rounded-lg border border-slate-200 text-sm"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">タイプ: すべて</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>タイプ: {type}</option>
                ))}
              </select>

              <select
                className="rounded-lg border border-slate-200 text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">ステータス: すべて</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>ステータス: {status}</option>
                ))}
              </select>

              <select
                className="rounded-lg border border-slate-200 text-sm ml-auto"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
              >
                <option value="priority">優先度でソート</option>
                <option value="impact">影響度でソート</option>
                <option value="uncertainty">不確実性でソート</option>
                <option value="created_at">作成日でソート</option>
              </select>

              <button
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? '降順に切り替え' : '昇順に切り替え'}
              >
                {sortDirection === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* 件数表示 */}
            <div className="mt-3 text-sm text-slate-500">
              {filteredHypotheses.length} 件の仮説が見つかりました
              {hypotheses.length !== filteredHypotheses.length && ` (全 ${hypotheses.length} 件中)`}
            </div>
          </div>

          {filteredHypotheses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-700">該当する仮説がありません</h3>
              <p className="mt-2 text-slate-500">検索条件に一致する仮説はありませんでした。検索条件を変更してみてください。</p>
            </div>
          ) : viewMode === 'list' ? (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">仮説</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">優先度</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">影響度</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">不確実性</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">確信度</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">タイプ</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ステータス</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">作成日</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredHypotheses.map((h) => {
                      const priority = h.priority!
                      const priorityLabel = getPriorityLabel(priority)
                      const priorityColor = getPriorityColor(priority)

                      return (
                        <motion.tr 
                          key={h.id}
                          variants={item}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{h.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={classNames('inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium', priorityColor)}>
                              {priorityLabel} ({priority})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{h.impact}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{h.uncertainty}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{h.confidence}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{h.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">{h.status}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-500">{getDateFormat(h.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/projects/${projectId}/hypotheses/${h.id}`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              詳細
                            </Link>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.ul 
              variants={container}
              initial="hidden"
              animate="show"
              className={classNames(
                "grid gap-6",
                columns === 1 ? "grid-cols-1" : 
                columns === 2 ? "grid-cols-1 md:grid-cols-2" : 
                "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {filteredHypotheses.map((h) => {
                const priority = h.priority!
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
                      <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                        作成日: {getDateFormat(h.created_at)}
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
        </>
      )}
    </div>
  )
}