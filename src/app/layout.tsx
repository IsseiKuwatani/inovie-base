'use client'

import './globals.css'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlobalSidebar from '@/components/GlobalSidebar'  // グローバルサイドバーコンポーネント
import ProjectSidebar from '@/components/ProjectSidebar'  // プロジェクトサイドバーコンポーネント

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // ログインページかどうかを判定
  const isLoginPage = pathname === '/login'
  
  // プロジェクト詳細ページかどうかを判定
  const isProjectDetailPage = pathname?.match(/^\/projects\/[^\/]+(?!\/(new))/)

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
        
        // ルートページにいる場合、ログイン済みならプロジェクト一覧にリダイレクト
        if (pathname === '/' && data.session) {
          router.push('/projects')
        }
      } catch (err) {
        console.error('認証チェックエラー:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    
    checkSession()
  }, [router, pathname, isLoginPage])

  // ログインページか認証チェック中の場合はシンプルなレイアウト
  if (isLoginPage || checkingAuth) {
    return (
      <html lang="ja">
        <body className="bg-slate-50 min-h-screen">
          {checkingAuth && !isLoginPage ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-slate-600">読み込み中...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </body>
      </html>
    )
  }

  // 通常のアプリケーションレイアウト（ログイン済み）
  return (
    <html lang="ja">
      <body className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* サイドバー - 条件によって切り替え */}
        {isProjectDetailPage ? (
          <ProjectSidebar />
        ) : (
          <GlobalSidebar />
        )}

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6 md:p-10 space-y-6">
          {children}
        </main>

      </body>
    </html>
  )
}
