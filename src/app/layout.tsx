// src/app/layout.tsx
'use client'

import Link from 'next/link'
import './globals.css'
import { LayoutDashboard, FolderKanban, FlaskConical, Settings, LogOut, User } from 'lucide-react'
import SidebarFooter from '@/components/SidebarFooter'
import Breadcrumbs from '@/components/Breadcrumbs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activePage, setActivePage] = useState('')

  // ログインページかどうかを判定
  const isLoginPage = pathname === '/login'

  // アクティブなページを設定
  useEffect(() => {
    if (pathname.startsWith('/projects')) {
      setActivePage('projects')
    } else if (pathname === '/') {
      setActivePage('dashboard')
    } else if (pathname.startsWith('/hypotheses')) {
      setActivePage('hypotheses')
    } else if (pathname.startsWith('/settings')) {
      setActivePage('settings')
    }
  }, [pathname])

  // セッションのチェック
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setIsLoggedIn(!!data.session)
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
  }, [router])

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

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
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col px-6 py-8">
          <div className="text-2xl font-bold tracking-wide mb-12">Inovie</div>
          <nav className="space-y-4">
            <NavItem 
              href="/" 
              icon={<LayoutDashboard size={20} />}
              isActive={activePage === 'dashboard'}
            >
              ダッシュボード
            </NavItem>
            <NavItem 
              href="/projects" 
              icon={<FolderKanban size={20} />}
              isActive={activePage === 'projects'}
            >
              プロジェクト
            </NavItem>
            <NavItem 
              href="/hypotheses" 
              icon={<FlaskConical size={20} />}
              isActive={activePage === 'hypotheses'}
            >
              仮説
            </NavItem>
            <NavItem 
              href="/settings" 
              icon={<Settings size={20} />}
              isActive={activePage === 'settings'}
            >
              設定
            </NavItem>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-red-400 transition-colors w-full text-left mt-6"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">ログアウト</span>
            </button>
          </nav>

          <SidebarFooter />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-6">
          <Breadcrumbs /> {/* パンくずリストを常設！ */}
          {children}
        </main>
      </body>
    </html>
  )
}

function NavItem({ 
  href, 
  icon, 
  children,
  isActive = false
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-indigo-600 text-white' 
          : 'hover:bg-gray-800 hover:text-indigo-400'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
