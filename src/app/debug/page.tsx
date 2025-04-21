// app/debug/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        setAuthState({
          hasSession: !!data.session,
          user: data.session?.user?.email,
          error: error?.message
        })
      } catch (err) {
        console.error('認証確認エラー:', err)
        setAuthState({ error: 'エラーが発生しました' })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <h1 className="text-2xl font-bold mb-4">デバッグページ</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">認証状態</h2>
        
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        )}
        
        <div className="mt-6 space-y-2">
          <div>
            <a href="/" className="text-blue-600 hover:underline">ホームページ</a>
          </div>
          <div>
            <a href="/login" className="text-blue-600 hover:underline">ログインページ</a>
          </div>
          <div>
            <a href="/projects" className="text-blue-600 hover:underline">プロジェクト一覧</a>
          </div>
        </div>
      </div>
    </div>
  )
}
