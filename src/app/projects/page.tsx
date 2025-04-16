'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Loader2,
  MoreVertical,
  FileText,
  CalendarDays,
  Star,
  Filter,
  X
} from 'lucide-react'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  status: string | null
  description?: string | null
  created_at: string
  hypothesis_count?: number
  is_favorite?: boolean
}

const STATUS_TABS = ['すべて', '未着手', '進行中', '完了']

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('すべて')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      setErrorMsg('')

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const user = sessionData?.session?.user

      if (!user || sessionError) {
        setErrorMsg('ログイン情報の取得に失敗しました')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*, hypotheses(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('読み込みエラー:', error)
        setErrorMsg('プロジェクトの読み込みに失敗しました')
      } else {
        const enriched = data.map((p: any) => ({
          ...p,
          hypothesis_count: p.hypotheses[0]?.count ?? 0
        }))
        setProjects(enriched)
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('このプロジェクトを削除します。元に戻すことはできません。本当によろしいですか？')
    if (!confirm) return

    setDeletingId(id)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      console.error('削除失敗:', error)
      alert('削除に失敗しました')
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }
    setDeletingId(null)
  }

  const toggleFavorite = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: !p.is_favorite } : p))
    )
  }

  const filteredProjects = projects.filter((p) =>
    statusFilter === 'すべて' ? true : p.status === statusFilter
  )

  const sortedProjects = [
    ...filteredProjects.filter((p) => p.is_favorite),
    ...filteredProjects.filter((p) => !p.is_favorite)
  ]

  // フィルター状態をリセット
  const resetFilters = () => {
    setStatusFilter('すべて')
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">あなたのプロジェクト</h1>
        <Link
          href="/projects/new"
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>新規プロジェクト作成</span>
        </Link>
      </div>

      {/* フィルターセクション */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Filter size={16} />
              <span>フィルター</span>
              {statusFilter !== 'すべて' && (
                <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs rounded-full">1</span>
              )}
            </button>
            
            {statusFilter !== 'すべて' && (
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                  ステータス: {statusFilter}
                  <button 
                    onClick={resetFilters}
                    className="hover:bg-indigo-100 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-slate-500">
            {filteredProjects.length} 件のプロジェクト
            {filteredProjects.length !== projects.length && ` (全 ${projects.length} 件中)`}
          </div>
        </div>
        
        {/* 展開されるフィルターオプション */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">ステータス</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_TABS.map((status) => (
                    <button
                      key={status}
                      className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 ${
                        statusFilter === status
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-700'
                      }`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : errorMsg ? (
        <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm">{errorMsg}</div>
      ) : sortedProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-xl font-medium text-slate-700">該当するプロジェクトはありません</h3>
          <p className="mt-2 text-slate-500">プロジェクトを作成するか、フィルターを変更してみてください。</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProjects.map((p) => (
            <li
              key={p.id}
              className="relative flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300 hover:border-indigo-200"
            >
              {/* ヘッダー */}
              <div className="flex justify-between items-start p-5 border-b border-slate-100">
                <div className="flex-1 pr-10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700 transition line-clamp-1"
                    >
                      {p.name}
                    </Link>
                    <button 
                      onClick={() => toggleFavorite(p.id)} 
                      className="text-amber-400 hover:text-amber-500 transition-colors"
                    >
                      <Star fill={p.is_favorite ? 'currentColor' : 'none'} size={16} />
                    </button>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <div className="absolute top-5 right-5">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                    className="p-1.5 rounded-full hover:bg-slate-50 transition-colors"
                  >
                    <MoreVertical className="text-slate-500 hover:text-slate-700" size={18} />
                  </button>
                </div>
                {openMenuId === p.id && (
                  <div className="absolute top-14 right-5 z-20 w-44 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden">
                    <ul className="text-sm divide-y divide-slate-100">
                      <li><Link href={`/projects/${p.id}`} className="block px-4 py-2.5 hover:bg-slate-50 text-slate-700">詳細確認</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses`} className="block px-4 py-2.5 hover:bg-slate-50 text-slate-700">仮説一覧</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses/new`} className="block px-4 py-2.5 hover:bg-slate-50 text-slate-700">仮説作成</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses/map`} className="block px-4 py-2.5 hover:bg-slate-50 text-slate-700">マップ表示</Link></li>
                      <li><button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed">{deletingId === p.id ? '削除中...' : '削除'}</button></li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 本文 */}
              <div className="px-5 py-4 space-y-3 flex-grow">
                <div className="inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium bg-slate-100 text-slate-700">
                  ステータス：{p.status ?? '未設定'}
                </div>
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  <span>仮説 {p.hypothesis_count} 件</span>
                </div>
              </div>

              {/* フッター */}
              <div className="flex items-center gap-2 text-xs text-slate-400 px-5 pb-4 pt-2">
                <CalendarDays size={14} />
                <span>{new Date(p.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
