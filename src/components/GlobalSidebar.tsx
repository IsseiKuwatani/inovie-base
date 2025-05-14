// components/GlobalSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  BarChart4, 
  FileText,
  Briefcase,
  HelpCircle,
  UserCog,
  Building,
  MessageSquare,
  Calendar,
  BookOpen
} from 'lucide-react'

// ユーザープロファイル型定義
type UserProfile = {
  id: string;
  display_name: string | null;
  email: string;
  position: string | null;
  department: string | null;
  organization_id: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export default function GlobalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activePage, setActivePage] = useState('')
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

 // ユーザー情報とプロファイル情報を取得
useEffect(() => {
  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      
      // 認証ユーザー情報を取得
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return
      
      setUser(authData.user)
      
      // ユーザープロファイル情報のみを取得（組織情報は別途）
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, position, department, organization_id')
        .eq('id', authData.user.id)
        .single()
      
      if (error) {
        console.error('ユーザープロファイル取得エラー:', error)
        return
      }
        
          // 組織情報を別途取得
      let organizationData = null
      if (profileData?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', profileData.organization_id)
          .single()
        
        if (orgData) {
          organizationData = orgData
        }
      }
      
      // データを適切に変換
      const formattedProfile = {
        id: profileData.id,
        display_name: profileData.display_name,
        email: profileData.email,
        position: profileData.position,
        department: profileData.department,
        organization_id: profileData.organization_id,
        organization: organizationData
      }
      
      setUserProfile(formattedProfile)
      console.log('設定したプロファイル:', formattedProfile) // 確認用
      
    } catch (err) {
      console.error('データ取得エラー:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  fetchUserData()
}, [])



  // アクティブなページを設定
  useEffect(() => {
    if (pathname?.startsWith('/projects')) {
      setActivePage('projects')
    } else if (pathname === '/') {
      setActivePage('dashboard')
    } else if (pathname?.startsWith('/team')) {
      setActivePage('team')
    } else if (pathname?.startsWith('/analytics')) {
      setActivePage('analytics')
    } else if (pathname?.startsWith('/reports')) {
      setActivePage('reports')
    } else if (pathname?.startsWith('/documents')) {
      setActivePage('documents')
    } else if (pathname?.startsWith('/settings')) {
      setActivePage('settings')
    } else if (pathname?.startsWith('/me')) {
      setActivePage('profile')
    }
  }, [pathname])

  // サインアウト処理
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('サインアウトエラー:', err)
    }
  }

  // ユーザーイニシャルを取得
  const getUserInitials = () => {
    if (userProfile?.display_name) {
      // 名前がある場合は名前の最初の文字
      return userProfile.display_name.charAt(0).toUpperCase()
    } else if (user?.email) {
      // 名前がない場合はメールの最初の文字
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* ヘッダーロゴと検索 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 w-8 h-8 rounded-md flex items-center justify-center">
              <span className="font-bold text-white">I</span>
            </div>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Inovie</span>
          </Link>
          
          <button 
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
          >
            <Search size={18} />
          </button>
        </div>
        
        {/* 検索フィールド（展開時のみ表示） */}
        {isMenuExpanded && (
          <div className="mb-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="検索..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        )}
      </div>
      
      {/* ユーザー情報 - 強化バージョン */}
      {user && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
              {getUserInitials()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {userProfile?.display_name || 'ユーザー'}
            </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
              
              {/* 組織情報 */}
              {userProfile?.organization && (
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <Building size={12} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{userProfile.organization.name}</span>
                </div>
              )}
              
              {/* 部署・役職情報 */}
              {(userProfile?.department || userProfile?.position) && (
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {userProfile.department && <span>{userProfile.department}</span>}
                  {userProfile.department && userProfile.position && <span> • </span>}
                  {userProfile.position && <span>{userProfile.position}</span>}
                </div>
              )}
            </div>
          </div>
          
          {/* プロファイルへのリンク */}
          <div className="mt-3">
            <Link 
              href="/profile" 
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"
            >
              <UserCog size={12} className="mr-1" />
              プロフィール設定
            </Link>
          </div>
        </div>
      )}
      
      {/* メインナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            メイン
          </h3>
          <NavItem 
            href="/"
            icon={<LayoutDashboard size={18} />}
            isActive={activePage === 'dashboard'}
          >
            ダッシュボード
          </NavItem>
          <NavItem 
            href="/projects"
            icon={<FolderKanban size={18} />}
            isActive={activePage === 'projects'}
          >
            プロジェクト
          </NavItem>

        </div>
        
        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            ワークスペース
          </h3>

          <NavItem 
            href="/reports"
            icon={<FileText size={18} />}
            isActive={activePage === 'reports'}
          >
            レポート
          </NavItem>
          <NavItem 
            href="/documents"
            icon={<BookOpen size={18} />}
            isActive={activePage === 'documents'}
          >
            ドキュメント
          </NavItem>

        </div>
        
        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            組織
          </h3>
          <NavItem 
            href="/organization"
            icon={<Building size={18} />}
            isActive={activePage === 'organization'}
          >
            組織管理
          </NavItem>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            設定
          </h3>
          <NavItem 
            href="/profile"
            icon={<UserCog size={18} />}
            isActive={activePage === 'profile'}
          >
            プロフィール
          </NavItem>
          <NavItem 
            href="/settings"
            icon={<Settings size={18} />}
            isActive={activePage === 'settings'}
          >
            設定
          </NavItem>
          <NavItem 
            href="/help"
            icon={<HelpCircle size={18} />}
            isActive={activePage === 'help'}
          >
            ヘルプ
          </NavItem>
        </div>
      </nav>
      
      {/* フッター */}
      <div className="px-5 py-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={18} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
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
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
        isActive 
          ? 'bg-indigo-50 text-indigo-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={isActive ? 'text-indigo-600' : 'text-gray-500'}>
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  )
}
