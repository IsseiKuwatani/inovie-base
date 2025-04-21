// components/AuthWrapper.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // ログインページかどうかを判定
  const isLoginPage = pathname === '/login'

  // セッションのチェック
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setIsLoggedIn(!!data.session)
        
        // ログインしていないのにログインページ以外にいる場合はリダイレクト
        if (!data.session && !isLoginPage && !pathname?.startsWith('/auth')) {
          router.push('/login')
        }
      } catch (err) {
        console.error('認証チェックエラー:', err)
      } finally {
        // 認証チェック完了
        setCheckingAuth(false)
      }
    }
    
    checkSession()

    // セッション変更イベントのリスナー設定
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session)
        
        // ログアウト時
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, isLoginPage])

  // 認証チェック中の場合はローディング表示
  if (checkingAuth && !isLoginPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ログインページまたは認証完了済みの場合は子コンポーネントを表示
  return children
}
