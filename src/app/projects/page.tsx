'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'


type Project = {
  id: string
  name: string
  status: string | null
  description?: string | null
  created_at: string
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      setErrorMsg('')

      // ✅ ログインユーザーの取得
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const user = sessionData?.session?.user

      if (!user || sessionError) {
        setErrorMsg('ログイン情報の取得に失敗しました')
        setLoading(false)
        return
      }

      // ✅ ログインユーザーに紐づくプロジェクトのみ取得
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('読み込みエラー:', error)
        setErrorMsg('プロジェクトの読み込みに失敗しました')
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  return (
    
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">あなたのプロジェクト一覧</h1>
      <div>
      <Link
        href="/projects/new"
        className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
      >
        ＋ 新規プロジェクト作成
      </Link>
    </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          読み込み中...
        </div>
      ) : errorMsg ? (
        <div className="text-red-600 text-sm">{errorMsg}</div>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">プロジェクトが登録されていません。</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
              <li className="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition cursor-pointer">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{p.status ?? 'ステータス未設定'}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleString()}</p>
              </li>
            </Link>
          ))}
        </ul>
      )}
    </div>
    
  )
}
