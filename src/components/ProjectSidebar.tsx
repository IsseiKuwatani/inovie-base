// components/ProjectSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { 
  Home, 
  Lightbulb, 
  Map, 
  MapPinned,
  Settings, 
  ArrowLeft, 
  LogOut,
  ChevronRight,
  Network,
  Clock,
  Layers,
  BarChart3,
  AudioWaveform,
  FileText
} from 'lucide-react'

export default function ProjectSidebar() {
  const params = useParams()
  const projectId = params?.id as string
  const router = useRouter()
  const pathname = usePathname()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')

  // アクティブなセクションを設定
  useEffect(() => {
    if (pathname?.includes('/hypotheses/tree-map')) {
      setActiveSection('tree-map')
    } else if (pathname?.includes('/hypotheses/map')) {
      setActiveSection('map')
    } else if (pathname?.includes('/hypotheses')) {
      setActiveSection('hypotheses')
    } else if (pathname?.includes('/reports')) {
      setActiveSection('reports')
    } else if (pathname?.includes('/timeline')) {
      setActiveSection('timeline')
    } else if (pathname?.includes('/settings')) {
      setActiveSection('settings')
    } else if (pathname?.includes('/canvas')) { 
      setActiveSection('canvas')
    } else if (pathname?.includes('/analytics')) { 
      setActiveSection('analytics')
    } else {
      setActiveSection('overview')
    }
  }, [pathname])

  // プロジェクト情報の取得
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true)
      
      // 'new' の場合や無効な UUID の場合はスキップ
      if (!projectId || projectId === 'new') {
        setIsLoading(false)
        return
      }
      
      // UUID の形式を確認
      const isValidUUID = (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(uuid)
      }
      
      if (!isValidUUID(projectId)) {
        console.log('有効なプロジェクトIDではありません:', projectId)
        setIsLoading(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        if (error) throw error
        
        setProject(data)
      } catch (err) {
        console.error('プロジェクト取得エラー:', err)
        // 既存プロジェクトのエラーの場合のみリダイレクト
        if (pathname !== '/projects/new') {
          router.push('/projects')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId, pathname, router])

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  // パンくずリストの生成
  const getBreadcrumbs = () => {
    if (!pathname || !project) return [];
    
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // プロジェクト一覧
    breadcrumbs.push({
      href: '/projects',
      label: 'プロジェクト一覧'
    });
    
    // プロジェクト詳細
    if (segments.includes('projects') && segments.length > 1) {
      breadcrumbs.push({
        href: `/projects/${projectId}`,
        label: project.name
      });
      
      // 仮説関連
      if (segments.includes('roadmap')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/hypotheses/roadmap`,
          label: 'ロードマップ'
        });
    } else if (segments.includes('tree-map')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/hypotheses/tree-map`,
          label: 'ツリーマップ'
        });
     
      } else if (segments.includes('map')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/hypotheses/map`,
          label: 'マップ表示'
        });

      } else if (segments.includes('new')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/hypotheses/new`,
          label: '新規作成'
        });
      } else if (segments.includes('hypotheses')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/hypotheses`,
          label: '仮説一覧'
        });
      }
      
      // 設定
      if (segments.includes('settings')) {
        breadcrumbs.push({
          href: `/projects/${projectId}/settings`,
          label: '設定'
        });
      }
    }
    
    return breadcrumbs;
  };

  // 新規プロジェクト作成ページでは表示しない
  if (pathname === '/projects/new') {
    return null;
  }

  if (isLoading || !project) {
    return (
      <aside className="w-64 bg-gray-900 text-white flex flex-col px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-8"></div>
          <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded mb-4"></div>
        </div>
      </aside>
    )
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col px-6 py-8">
      {/* Project Header - リンク修正 */}
      <div className="mb-8">
        <Link 
          href="/projects" 
          className="flex items-center gap-2 mb-3 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">プロジェクト一覧に戻る</span>
        </Link>
        
        {/* プロジェクトタイトル - 折り返し表示 */}
        <h1 className="text-xl font-bold break-words leading-tight">
          {project.name}
        </h1>
      </div>

      
      {/* Project Navigation */}
      <nav className="space-y-6 flex-1">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            概要
          </h3>
          <div className="space-y-1">
            <ProjectNavItem 
              href={`/projects/${projectId}`}
              icon={<Home size={18} />}
              isActive={activeSection === 'overview'}
            >
              プロジェクト概要
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/analytics`}
              icon={<BarChart3 size={18} />}
              isActive={activeSection === 'analytics'}
            >
              アナリティクス
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/canvas`}
              icon={<Layers size={18} />}
              isActive={activeSection === 'canvas'}
            >
              リーンキャンバス
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/timeline`}
              icon={<Clock size={18} />}
              isActive={activeSection === 'timeline'}
            >
              タイムライン
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/reports`}
              icon={<FileText size={18} />}
              isActive={activeSection === 'reports'}
            >
              レポート
            </ProjectNavItem>
          </div>
        </div>
        
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            仮説検証
          </h3>
          <div className="space-y-1">
            <ProjectNavItem 
              href={`/projects/${projectId}/hypotheses`}
              icon={<Lightbulb size={18} />}
              isActive={activeSection === 'hypotheses'}
            >
              仮説一覧
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/hypotheses/map`}
              icon={<MapPinned size={18} />}
              isActive={activeSection === 'map'}
            >
              仮説マップ
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/hypotheses/tree-map`}
              icon={<Network size={18} />}
              isActive={activeSection === 'tree-map'}
            >
              仮説ツリーマップ
            </ProjectNavItem>
            <ProjectNavItem 
              href={`/projects/${projectId}/roadmap`}
              icon={<AudioWaveform size={18} />}
              isActive={activeSection === 'roadmap'}
            >
              仮説ロードマップ
            </ProjectNavItem>
          </div>
        </div>
        
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            設定
          </h3>
          <div className="space-y-1">
            <ProjectNavItem 
              href={`/projects/${projectId}/settings`}
              icon={<Settings size={18} />}
              isActive={activeSection === 'settings'}
            >
              プロジェクト設定
            </ProjectNavItem>
          </div>
        </div>
      </nav>
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 hover:text-red-400 transition-colors w-full text-left mt-4"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">ログアウト</span>
      </button>
    </aside>
  )
}

function ProjectNavItem({ 
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
          ? 'bg-indigo-600 text-white' 
          : 'hover:bg-gray-800 hover:text-indigo-400 text-gray-300'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
