'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Loader2, Plus, X, AlertCircle, Filter, Search,
  SlidersHorizontal, LayoutGrid, List, ChevronDown, ChevronUp
} from 'lucide-react'
import { ProjectSection } from '@/components/projects/ProjectSection'
import { ProjectTabs } from '@/components/projects/ProjectTabs'
import { ProjectStatusFilter } from '@/components/projects/ProjectStatusFilter'

import { Project, ProjectCategory, MenuRefType } from '@/types/projects'

export const STATUS_TABS = ['すべて', '未着手', '進行中', '完了']

export default function ProjectList() {
  const router = useRouter()
  
  // プロジェクト状態（3カテゴリ）
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([])
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([])
  const [orgProjects, setOrgProjects] = useState<Project[]>([])
  
  // UI状態
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('すべて')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [selectedTab, setSelectedTab] = useState<ProjectCategory>('all')
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    owned: false,
    member: false,
    organization: false
  })
  
  const [user, setUser] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;


  // ローカルストレージから表示モードを読み込む
  useEffect(() => {
    const savedViewMode = localStorage.getItem('projectViewMode') as 'card' | 'list'
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  // 表示モード変更時にローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('projectViewMode', viewMode)
  }, [viewMode])

  // クリック外部でメニューを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // ログアウト時に自動リダイレクト
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    })
    
    // 初期データ取得
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const { data: userData } = await supabase.auth.getUser()
        
        if (userData.user) {
          setUser(userData.user)
          fetchProjects()
        }
      } catch (err) {
        console.error('データ取得エラー:', err)
        setErrorMsg('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    fetchInitialData()
  }, [])
  
  // プロジェクト一覧の取得
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
  
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('ユーザー情報取得エラー:', userError)
        setErrorMsg('ユーザー情報の取得に失敗しました')
        return
      }

      const userId = user.id

      // a. 自分が作成したプロジェクト
      const { data: ownedProjectsData, error: ownedError } = await supabase
        .from('projects')
        .select('id, name, user_id, status, description, created_at, is_favorite, organization_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (ownedError) {
        console.error('所有プロジェクト取得エラー:', ownedError)
      }

      // b. 自分がメンバー参加しているプロジェクト（オーナー除く）- 2段階取得方式
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId)

      if (membershipError) {
        console.error('メンバーシップ取得エラー:', membershipError)
      }

      // プロジェクトIDのリストを抽出
      const memberProjectIds = membershipData?.map(item => item.project_id) || []

      // 関連するプロジェクト情報を取得（自分が作成したものを除外）
      let formattedMemberProjects: Project[] = [];
      if (memberProjectIds.length > 0) {
        const { data: joinedProjectsData, error: joinedProjectsError } = await supabase
          .from('projects')
          .select('id, name, user_id, status, description, created_at, is_favorite, organization_id')
          .in('id', memberProjectIds)
          .neq('user_id', userId) // 自分が作成したプロジェクトを除外

        if (joinedProjectsError) {
          console.error('参加プロジェクト取得エラー:', joinedProjectsError)
        }
          
        formattedMemberProjects = joinedProjectsData || [];
      }

      // c. 自分の所属組織の他プロジェクト（未参加）
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('ユーザープロファイル取得エラー:', profileError)
      }

      let organizationProjects: Project[] = []
      
      if (profile?.organization_id) {
        const { data: orgProjectsData, error: orgError } = await supabase
          .from('projects')
          .select('id, name, user_id, status, description, created_at, is_favorite, organization_id')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })

        if (orgError) {
          console.error('組織プロジェクト取得エラー:', orgError)
        }

        // 既に参加しているプロジェクトID（自分が作成 or メンバー参加）をセット
        const ownedIds = new Set(ownedProjectsData?.map(p => p.id) || [])
        const memberIds = new Set(formattedMemberProjects?.map(p => p.id) || [])
        const participatedIds = new Set([...ownedIds, ...memberIds])

        // 未参加のプロジェクトをフィルタリング
        organizationProjects = orgProjectsData
          ? orgProjectsData.filter(p => !participatedIds.has(p.id))
          : []
      }

      // 各プロジェクト配列に仮説数を追加
      const enrichProjectsWithHypothesis = async (projectsArr: Project[]) => {
        return await Promise.all(
          projectsArr.map(async (p) => {
            const { count, error: countError } = await supabase
              .from('hypotheses')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', p.id)

            if (countError) {
              console.warn(`project_id: ${p.id} のカウント取得失敗`, countError)
            }

            return {
              ...p,
              hypothesis_count: typeof count === 'number' ? count : 0,
              is_favorite: p.is_favorite || false
            }
          })
        )
      }

      // 各カテゴリのプロジェクトに仮説数を追加
      const enrichedOwned = await enrichProjectsWithHypothesis(ownedProjectsData || [])
      const enrichedJoined = await enrichProjectsWithHypothesis(formattedMemberProjects || [])
      const enrichedOrg = await enrichProjectsWithHypothesis(organizationProjects || [])

      // 状態をセット
      setOwnedProjects(enrichedOwned)
      setJoinedProjects(enrichedJoined)
      setOrgProjects(enrichedOrg)
      
    } catch (err) {
      console.error('プロジェクト取得中のエラー:', err)
      setErrorMsg('予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('このプロジェクトを削除します。元に戻すことはできません。本当によろしいですか？')
    if (!confirm) return

    setDeletingId(id)
    
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      
      if (error) {
        console.error('削除失敗:', error)
        alert('削除に失敗しました')
      } else {
        // 各カテゴリから削除したプロジェクトを除外
        setOwnedProjects(prev => prev.filter(p => p.id !== id))
        setJoinedProjects(prev => prev.filter(p => p.id !== id))
        setOrgProjects(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error('削除処理中のエラー:', err)
      alert('削除処理中にエラーが発生しました')
    } finally {
      setDeletingId(null)
      setOpenMenuId(null)
    }
  }

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // カードのクリックイベントが発火しないように
    
    // プロジェクトを見つける
    const findProject = (id: string): [Project | undefined, 'owned' | 'joined' | 'org' | null] => {
      const owned = ownedProjects.find(p => p.id === id)
      if (owned) return [owned, 'owned']
      
      const joined = joinedProjects.find(p => p.id === id)
      if (joined) return [joined, 'joined']
      
      const org = orgProjects.find(p => p.id === id)
      if (org) return [org, 'org']
      
      return [undefined, null]
    }
    
    const [project, category] = findProject(id)
    if (!project || !category) return
    
    const newFavoriteState = !project.is_favorite
    
    // UI を先に更新して応答性を良くする
    switch (category) {
      case 'owned':
        setOwnedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: newFavoriteState} : p))
        break
      case 'joined':
        setJoinedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: newFavoriteState} : p))
        break
      case 'org':
        setOrgProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: newFavoriteState} : p))
        break
    }
    
    try {
      // データベースを更新
      const { error } = await supabase
        .from('projects')
        .update({ is_favorite: newFavoriteState })
        .eq('id', id)
      
      if (error) {
        console.error('お気に入り更新エラー:', error)
        // エラー時は元に戻す
        switch (category) {
          case 'owned':
            setOwnedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
            break
          case 'joined':
            setJoinedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
            break
          case 'org':
            setOrgProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
            break
        }
        alert('お気に入りの更新に失敗しました')
      }
    } catch (err) {
      console.error('お気に入り処理中のエラー:', err)
      // エラー時は元に戻す
      switch (category) {
        case 'owned':
          setOwnedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
          break
        case 'joined':
          setJoinedProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
          break
        case 'org':
          setOrgProjects(prev => prev.map(p => p.id === id ? {...p, is_favorite: !newFavoriteState} : p))
          break
      }
      alert('お気に入りの更新中にエラーが発生しました')
    }
  }

  // カード型とリスト型の切り替え
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'list' : 'card')
  }

  // セクションの折りたたみ切り替え
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // 特定のカードへの移動
  const handleCardClick = (id: string) => {
    router.push(`/projects/${id}`)
  }
  
  // フィルター適用用関数
  const applyFilters = (projects: Project[]) => {
    return projects
      .filter(p => statusFilter === 'すべて' ? true : p.status === statusFilter)
      .filter(p => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
          p.name.toLowerCase().includes(searchLower) || 
          (p.description && p.description.toLowerCase().includes(searchLower))
        )
      })
  }

  // フィルター適用
  const filteredOwnedProjects = applyFilters(ownedProjects)
  const filteredJoinedProjects = applyFilters(joinedProjects)
  const filteredOrgProjects = applyFilters(orgProjects)
  
  // フィルター状態をリセット
  const resetFilters = () => {
    setStatusFilter('すべて')
    setSearchTerm('')
  }

  // タブ変更ハンドラ
  const handleTabChange = (tab: ProjectCategory) => {
    setSelectedTab(tab)
  }
  
  // 表示するプロジェクト一覧を決定
  const getVisibleSections = () => {
    if (selectedTab === 'all') {
      return {
        showOwned: true,
        showJoined: true,
        showOrg: true
      }
    } else if (selectedTab === 'owned') {
      return {
        showOwned: true,
        showJoined: false,
        showOrg: false
      }
    } else if (selectedTab === 'member') {
      return {
        showOwned: false,
        showJoined: true,
        showOrg: false
      }
    } else if (selectedTab === 'organization') {
      return {
        showOwned: false,
        showJoined: false,
        showOrg: true
      }
    }
    
    return {
      showOwned: true,
      showJoined: true,
      showOrg: true
    }
  }
  
  const visibleSections = getVisibleSections()
  
  // 全プロジェクト数を計算
  const totalProjects = ownedProjects.length + joinedProjects.length + orgProjects.length
  const totalFilteredProjects = filteredOwnedProjects.length + filteredJoinedProjects.length + filteredOrgProjects.length
  
  // エラー状態
  if (errorMsg && !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-md w-full">
          <div className="text-rose-600 mb-4 flex justify-center">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">エラー</h2>
          <p className="text-gray-600 text-center mb-6">{errorMsg}</p>
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ヘッダー部分 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">あなたのプロジェクト</h1>
            <p className="text-slate-500 mt-1">
              プロジェクトの管理と仮説検証をスタートしましょう
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 表示モード切替ボタン */}
            <div className="bg-slate-100 rounded-lg p-1 flex items-center">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md flex items-center transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label="カード表示"
                title="カード表示"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md flex items-center transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label="リスト表示"
                title="リスト表示"
              >
                <List size={18} />
              </button>
            </div>
            
            <Link
              href="/projects/new"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 self-start sm:self-center"
            >
              <Plus size={18} />
              <span>新規プロジェクト作成</span>
            </Link>
          </div>
        </div>
        
        {/* カテゴリタブ */}
        <div className="mt-6 border-b border-slate-200">
          <ProjectTabs 
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            ownedCount={ownedProjects.length}
            joinedCount={joinedProjects.length}
            orgCount={orgProjects.length}
          />
        </div>
        
        {/* 検索とフィルター */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="プロジェクトを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <ProjectStatusFilter 
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
            
            {(statusFilter !== 'すべて' || searchTerm) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                リセット
              </button>
            )}
          </div>
        </div>
      </div>

      {/* エラーメッセージ（認証成功後のエラー） */}
      {errorMsg && user && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg mb-6">
          <div className="flex">
            <AlertCircle className="text-rose-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-sm text-rose-700">{errorMsg}</p>
          </div>
        </div>
      )}
      
      {/* 検索結果の表示 */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-slate-600 font-medium">
          {totalFilteredProjects} 件のプロジェクト
          {totalFilteredProjects !== totalProjects && ` (全 ${totalProjects} 件中)`}
        </div>
        
        <div className="text-xs text-slate-500">
          {searchTerm && <span>検索: "{searchTerm}" </span>}
          {statusFilter !== 'すべて' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              <Filter size={12} />
              {statusFilter}
            </span>
          )}
        </div>
      </div>

      {/* プロジェクト一覧 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500">プロジェクトを読み込み中...</p>
        </div>
      ) : (totalProjects === 0) ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="text-center py-16">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-700 mb-2">プロジェクトがありません</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              {searchTerm || statusFilter !== 'すべて' 
                ? '検索条件やフィルターを変更してみてください' 
                : 'プロジェクトを作成して、仮説検証を始めましょう'}
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              <span>新規プロジェクト作成</span>
            </Link>
          </div>
        </div>
      ) : totalFilteredProjects === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-slate-700 mb-2">該当するプロジェクトはありません</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              検索条件やフィルターを変更してみてください
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              フィルターをリセット
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 自分が作成したプロジェクト */}
          {visibleSections.showOwned && (
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300`}>
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => toggleSection('owned')}
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded"></span>
                  <span>あなたが作成したプロジェクト</span>
                  {filteredOwnedProjects.length > 0 && (
                    <span className="ml-2 text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {filteredOwnedProjects.length}
                    </span>
                  )}
                </h2>
                <button 
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label={collapsedSections.owned ? 'セクションを展開' : 'セクションを折りたたむ'}
                >
                  {collapsedSections.owned ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              
              {!collapsedSections.owned && (
                <div className="px-6 pb-6">
                  <ProjectSection 
                    projects={ownedProjects} 
                    viewMode={viewMode}
                    toggleFavorite={toggleFavorite}
                    handleCardClick={handleCardClick}
                    handleDelete={handleDelete}
                    statusFilter={statusFilter}
                    searchTerm={searchTerm}
                    deletingId={deletingId}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuRef={menuRef}
                    canDelete={true} // 自分が作成したプロジェクトは削除可能
                  />
                </div>
              )}
            </div>
          )}
          {/* 自分が参加しているプロジェクト */}
          {visibleSections.showJoined && (
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300`}>
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => toggleSection('member')}
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-violet-500 rounded"></span>
                  <span>あなたが参加しているプロジェクト</span>
                  {filteredJoinedProjects.length > 0 && (
                    <span className="ml-2 text-sm bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      {filteredJoinedProjects.length}
                    </span>
                  )}
                </h2>
                <button 
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label={collapsedSections.member ? 'セクションを展開' : 'セクションを折りたたむ'}
                >
                  {collapsedSections.member ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              
              {!collapsedSections.member && (
                <div className="px-6 pb-6">
                  <ProjectSection 
                    projects={joinedProjects} 
                    viewMode={viewMode}
                    toggleFavorite={toggleFavorite}
                    handleCardClick={handleCardClick}
                    handleDelete={handleDelete}
                    statusFilter={statusFilter}
                    searchTerm={searchTerm}
                    deletingId={deletingId}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuRef={menuRef}
                    canDelete={false} // 参加しているプロジェクトは削除不可
                  />
                </div>
              )}
            </div>
          )}

          {/* 組織内の未参加プロジェクト */}
          {visibleSections.showOrg && (
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300`}>
              <div 
                className="flex items-center justify-between p-6 cursor-pointer"
                onClick={() => toggleSection('organization')}
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-emerald-500 rounded"></span>
                  <span>同じ組織内の他のプロジェクト</span>
                  {filteredOrgProjects.length > 0 && (
                    <span className="ml-2 text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {filteredOrgProjects.length}
                    </span>
                  )}
                </h2>
                <button 
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label={collapsedSections.organization ? 'セクションを展開' : 'セクションを折りたたむ'}
                >
                  {collapsedSections.organization ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              
              {!collapsedSections.organization && (
                <div className="px-6 pb-6">
                  <ProjectSection 
                    projects={orgProjects} 
                    viewMode={viewMode}
                    toggleFavorite={toggleFavorite}
                    handleCardClick={handleCardClick}
                    handleDelete={handleDelete}
                    statusFilter={statusFilter}
                    searchTerm={searchTerm}
                    deletingId={deletingId}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuRef={menuRef}
                    canDelete={false} // 未参加プロジェクトは削除不可
                    showJoinButton={true} // 参加ボタンを表示
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* モバイル用の表示切替ボタン（フローティング） */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button
          onClick={toggleViewMode}
          className="flex items-center justify-center bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          aria-label="表示方法を切り替え"
        >
          {viewMode === 'card' ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>
    </div>
  )
}
