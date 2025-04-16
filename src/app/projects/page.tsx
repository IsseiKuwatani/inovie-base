'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Loader2,
  MoreVertical,
  FileText,
  CalendarDays,
  Star
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">あなたのプロジェクト</h1>
        <Link
          href="/projects/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition"
        >
          ＋ 新規プロジェクト作成
        </Link>
      </div>

      {/* ステータスフィルター */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            className={`text-sm px-3 py-1 rounded-full border ${
              statusFilter === status
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          読み込み中...
        </div>
      ) : errorMsg ? (
        <div className="text-red-600 text-sm">{errorMsg}</div>
      ) : sortedProjects.length === 0 ? (
        <p className="text-gray-500">該当するプロジェクトはありません。</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProjects.map((p) => (
            <li
              key={p.id}
              className="relative flex flex-col bg-white rounded-2xl border shadow-sm group hover:shadow-md transition"
            >
              {/* ヘッダー */}
              <div className="flex justify-between items-start p-4 border-b">
                <div className="flex-1 pr-6 space-y-1">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition line-clamp-1"
                  >
                    {p.name}
                  </Link>
                  {p.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button onClick={() => toggleFavorite(p.id)} className="text-yellow-400 hover:text-yellow-500">
                    <Star fill={p.is_favorite ? 'currentColor' : 'none'} size={18} />
                  </button>
                  <button onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}>
                    <MoreVertical className="text-gray-500 hover:text-gray-700" size={18} />
                  </button>
                </div>
                {openMenuId === p.id && (
                  <div className="absolute top-full right-3 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-md">
                    <ul className="text-sm">
                      <li><Link href={`/projects/${p.id}`} className="block px-4 py-2 hover:bg-gray-100">詳細確認</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses`} className="block px-4 py-2 hover:bg-gray-100">仮説一覧</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses/new`} className="block px-4 py-2 hover:bg-gray-100">仮説作成</Link></li>
                      <li><Link href={`/projects/${p.id}/hypotheses/map`} className="block px-4 py-2 hover:bg-gray-100">マップ表示</Link></li>
                      <li><button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">削除</button></li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 本文 */}
              <div className="px-4 py-3 space-y-2">
                <div className="text-sm text-gray-500">ステータス：{p.status ?? '未設定'}</div>
                <div className="flex items-center text-sm text-gray-700 gap-2">
                  <FileText size={16} />
                  <span>仮説 {p.hypothesis_count} 件</span>
                </div>
              </div>

              {/* フッター */}
              <div className="flex items-center gap-2 text-xs text-gray-400 px-4 pb-4">
                <CalendarDays size={14} />
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
