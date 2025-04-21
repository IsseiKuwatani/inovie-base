// app/projects/[id]/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Home, Lightbulb, Map, ChartPie, BarChart, Settings, ArrowLeft, LogOut } from 'lucide-react'
import AuthWrapper from '@/components/AuthWrapper'

type Project = {
  id: string
  name: string
  description?: string
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id: projectId } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')

  // プロジェクト情報の取得
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true)
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
        // プロジェクトが見つからない場合はリダイレクト
        router.push('/projects')
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId, router])

  // アクティブなセクションを設定
  useEffect(() => {
    if (pathname?.includes('/hypotheses/tree-map')) {
      setActiveSection('tree-map')
    } else if (pathname?.includes('/hypotheses')) {
      setActiveSection('hypotheses')
    } else if (pathname?.includes('/settings')) {
      setActiveSection('settings')
    } else {
      setActiveSection('overview')
    }
  }, [pathname])

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  if (isLoading) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </AuthWrapper>
    )
  }

  if (!project) {
    return (
      <AuthWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-700">プロジェクトが見つかりません</h1>
          <p className="mt-2 text-gray-500">指定されたプロジェクトは存在しないか、アクセス権がありません。</p>
          <Link href="/projects" className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* Project Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col px-6 py-8">
         {/* Project Header */}
         <div className="mb-8">
  <Link 
    href="/projects" 
    className="flex items-center gap-2 mb-3 text-gray-400 hover:text-white transition-colors"
  >
    <ArrowLeft size={16} />
    <span className="text-sm font-medium">プロジェクト一覧</span>
  </Link>
  
  <h1 className="text-xl font-bold text-white break-words leading-tight">
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
                  isActive={pathname?.includes('/hypotheses') && !pathname?.includes('/hypotheses/tree-map')}
                >
                  仮説一覧
                </ProjectNavItem>
                <ProjectNavItem 
                  href={`/projects/${projectId}/hypotheses/tree-map`}
                  icon={<Map size={18} />}
                  isActive={activeSection === 'tree-map'}
                >
                  仮説ツリーマップ
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

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-6">

          {children}
        </main>
      </div>
    </AuthWrapper>
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
