'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

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

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('読み込みエラー:', error)
      } else {
        setProjects(data)
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">プロジェクト一覧</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          読み込み中...
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((p) => (
            <li key={p.id} className="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{p.status ?? 'ステータス未設定'}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
