'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        
        // セッションの有無に応じてリダイレクト
        if (data.session) {
          window.location.href = '/projects'
        } else {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('認証エラー:', error)
        // エラー時はログインページへ
        window.location.href = '/login'
      }
    }
    
    // タイムアウト対策
    const timeout = setTimeout(() => {
      window.location.href = '/login'
    }, 3000)
    
    checkAuth()
    
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">読み込み中...</p>
      </div>
    </div>
  )
}
