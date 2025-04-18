'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const redirectBasedOnAuth = async () => {
      try {
        console.log('ルートページ: 認証状態チェック開始')
        
        // セッションチェック
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('セッション取得エラー:', error)
          // エラーがあってもログインページにリダイレクト
          window.location.href = '/login'
          return
        }
        
        // リダイレクト
        if (data.session) {
          console.log('セッションあり、プロジェクトページにリダイレクト')
          window.location.href = '/projects'
        } else {
          console.log('セッションなし、ログインページにリダイレクト')
          window.location.href = '/login'
        }
      } catch (err) {
        console.error('予期せぬエラー:', err)
        // エラー時はログインページへ
        window.location.href = '/login'
      }
    }
    
    // タイムアウト保護
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('タイムアウト発生、ログインページに強制リダイレクト')
        window.location.href = '/login'
      }
    }, 5000)
    
    redirectBasedOnAuth()
    
    return () => clearTimeout(timeoutId)
  }, [loading])

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">読み込み中...</p>
      </div>
    </div>
  )
}
