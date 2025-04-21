// components/AppHeader.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  Search, 
  ChevronDown,
  Home,
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  BookOpen,
  Sparkles,
  Shield
} from 'lucide-react'

export default function AppHeader() {
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // クリック外部でメニューを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // ユーザー情報と通知を取得
  useEffect(() => {
    const getUser = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setUser(data.session.user)
          // 通知データのダミー
          setNotifications([
            {
              id: 1,
              title: '新規プロジェクト作成',
              message: 'プロジェクト「新規マーケティング」が作成されました',
              time: new Date(Date.now() - 1000 * 60 * 30),
              read: false
            },
            {
              id: 2,
              title: '仮説検証完了',
              message: 'プロジェクト「ECサイト改善」の仮説検証が完了しました',
              time: new Date(Date.now() - 1000 * 60 * 60 * 2),
              read: true
            }
          ])
        }
      } catch (err) {
        console.error('ユーザーデータ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
  }, [])
  
  // サインアウト処理
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      console.error('サインアウトエラー:', err)
    }
  }
  
  // 未読通知の数を計算
  const unreadCount = notifications.filter(n => !n.read).length
  
  // アクティブなナビゲーションリンクを判定
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }
  
  if (loading) return null;
  if (!user) return null;
  
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* ロゴとモバイルメニューアイコン */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 w-8 h-8 rounded flex items-center justify-center">
                  <Sparkles className="text-white" size={16} />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Inovie</span>
              </Link>
            </div>
            
            {/* デスクトップのナビゲーション */}
            <nav className="hidden md:ml-8 md:flex md:space-x-2">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/') 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <Home size={16} />
                <span>ホーム</span>
              </Link>
              <Link 
                href="/projects"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/projects') 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <FolderKanban size={16} />
                <span>プロジェクト</span>
              </Link>
              <Link 
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>ダッシュボード</span>
              </Link>
            </nav>
          </div>
          
          {/* モバイルメニューアイコン */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* 右側のアクション */}
          <div className="hidden md:flex items-center space-x-3">
            {/* 検索ボタン */}
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors relative flex items-center"
            >
              <Search size={18} />
              <span className="sr-only">検索</span>
            </button>
            
            {/* 検索パネル */}
            {searchOpen && (
              <div 
                ref={searchRef}
                className="absolute right-16 top-16 w-96 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="プロジェクト、仮説を検索..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  <p>よく検索されるキーワード:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer">マーケティング</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer">SEO</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer">広告効果</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 通知ボタン */}
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* 通知パネル */}
            {notificationOpen && (
              <div 
                ref={notificationRef}
                className="absolute right-8 top-16 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-medium text-slate-800">通知</h3>
                  <button className="text-xs text-indigo-600 hover:text-indigo-800">すべて既読にする</button>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-slate-800">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {notification.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    通知はありません
                  </div>
                )}
                
                <div className="p-2 text-center border-t border-slate-200">
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 py-1 px-2 rounded-md hover:bg-indigo-50 transition-colors">
                    すべての通知を見る
                  </button>
                </div>
              </div>
            )}
            
            {/* ヘルプボタン */}
            <button className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors">
              <HelpCircle size={18} />
              <span className="sr-only">ヘルプ</span>
            </button>
            
            {/* プレミアムプラン */}
            <button className="hidden lg:inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full hover:bg-amber-200 transition-colors">
              <Sparkles size={12} />
              <span>プレミアム</span>
            </button>
            
            {/* ユーザーメニュー */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors py-1 px-1 rounded-full hover:bg-slate-50"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-medium border-2 border-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              
              {userMenuOpen && (
                <div 
                  ref={userMenuRef}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-slate-200"
                >
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-medium text-lg border-2 border-white shadow-sm">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.email?.split('@')[0]}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium w-fit">
                          <Shield size={10} />
                          <span>管理者</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-slate-500 uppercase">アカウント</p>
                      <div className="mt-1.5 space-y-1">
                        <Link 
                          href="/me" 
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-md text-sm transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} />
                          <span>プロフィール</span>
                        </Link>
                        <Link 
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-md text-sm transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>設定</span>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 mt-1">
                      <p className="text-xs font-medium text-slate-500 uppercase">ヘルプ</p>
                      <div className="mt-1.5 space-y-1">
                        <Link 
                          href="/help" 
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-md text-sm transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HelpCircle size={16} />
                          <span>ヘルプセンター</span>
                        </Link>
                        <Link 
                          href="/docs" 
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-md text-sm transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BookOpen size={16} />
                          <span>ドキュメント</span>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-3 mt-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
                      >
                        <LogOut size={16} />
                        <span>サインアウト</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link 
              href="/projects"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/projects') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              プロジェクト
            </Link>
            <Link 
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              ダッシュボード
            </Link>
            <Link 
              href="/me"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/me') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              プロフィール
            </Link>
            <Link 
              href="/settings"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/settings') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              設定
            </Link>
            <button 
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              サインアウト
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
