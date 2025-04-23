'use client'

import { useEffect, useState, useRef,} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  Loader2,
  MoreVertical,
  FileText,
  CalendarDays,
  Star,
  Filter,
  X,
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  CircleDashed,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Lightbulb,
  Map as MapIcon,
  Trash,
  LayoutGrid,
  List
} from 'lucide-react'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  status: string | null
  description?: string | null
  created_at: string
  hypothesis_count?: number
  is_favorite: boolean
}

const STATUS_TABS = ['すべて', '未着手', '進行中', '完了']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  '未着手': <CircleDashed size={16} className="text-slate-500" />,
  '進行中': <Clock size={16} className="text-amber-500" />,
  '完了': <CheckCircle2 size={16} className="text-emerald-500" />,
}

export default function ProjectList() {
  const router = useRouter() // useRouterを追加
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('すべて')
  const [showFilters, setShowFilters] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card') // 表示モードの状態を追加
  const menuRef = useRef<HTMLDivElement>(null)

  // 表示モードをローカルストレージから読み込む
  useEffect(() => {
    const savedViewMode = localStorage.getItem('projectViewMode') as 'card' | 'list'
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  // 表示モードが変更されたらローカルストレージに保存
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
          fetchProjects() // 引数なしで呼び出し
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
  const fetchProjects = async () => {  // 引数なしの関数定義
    try {
      setLoading(true);
      setErrorMsg(''); // エラーメッセージをクリア
      
      // ユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('ユーザー情報取得エラー:', userError);
        setErrorMsg('ユーザー情報の取得に失敗しました');
        return;
      }
      
      if (!user) {
        console.error('ユーザーが認証されていません');
        setErrorMsg('ログインが必要です');
        return;
      }
      
      // まず、自分がオーナーのプロジェクトを取得
      const { data: ownerProjects, error: ownerError } = await supabase
        .from('projects')
        .select('*, hypotheses(count), is_favorite')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ownerError) {
        console.error('オーナープロジェクト取得エラー:', ownerError);
        setErrorMsg('プロジェクトの読み込みに失敗しました');
        return;
      }
      
      // 次に、メンバーのプロジェクトIDを取得
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      
      if (memberError) {
        console.error('メンバープロジェクトID取得エラー:', memberError);
        // エラーがあっても続行（オーナープロジェクトだけでも表示）
      }
      
      // メンバーのプロジェクトIDを取得（エラーがあれば空配列）
      const memberProjectIds = memberData?.map(item => item.project_id) || [];
      
      // メンバーのプロジェクトIDがあれば、それらのプロジェクトも取得
      let memberProjects = [];
      if (memberProjectIds.length > 0) {
        const { data: memberProjectsData, error: memberProjectsError } = await supabase
          .from('projects')
          .select('*, hypotheses(count), is_favorite')
          .in('id', memberProjectIds)
          .order('created_at', { ascending: false });
        
        if (memberProjectsError) {
          console.error('メンバープロジェクト取得エラー:', memberProjectsError);
          // エラーがあっても続行（オーナープロジェクトだけでも表示）
        } else {
          memberProjects = memberProjectsData || [];
        }
      }
      
      // オーナープロジェクトとメンバープロジェクトを結合
      const allProjects = [...(ownerProjects || []), ...memberProjects];
      
      // 重複を除去（同じプロジェクトがオーナーとメンバーの両方に含まれる可能性がある）
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      );
      
      // データの整形
      const enrichedProjects = uniqueProjects.map(p => ({
        ...p,
        hypothesis_count: p.hypotheses[0]?.count ?? 0,
        is_favorite: p.is_favorite || false
      }));
      
      setProjects(enrichedProjects);
    } catch (err) {
      console.error('プロジェクト取得中のエラー:', err);
      setErrorMsg('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

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
        setProjects((prev) => prev.filter((p) => p.id !== id))
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
    
    // 現在のお気に入り状態を取得
    const currentProject = projects.find(p => p.id === id);
    const newFavoriteState = !currentProject?.is_favorite;
    
    // UI を先に更新して応答性を良くする
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: newFavoriteState } : p))
    )
    
    try {
      // データベースを更新
      const { error } = await supabase
        .from('projects')
        .update({ is_favorite: newFavoriteState })
        .eq('id', id)
      
      if (error) {
        console.error('お気に入り更新エラー:', error);
        // エラーが発生した場合は元の状態に戻す
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_favorite: !newFavoriteState } : p))
        );
        alert('お気に入りの更新に失敗しました');
      }
    } catch (err) {
      console.error('お気に入り処理中のエラー:', err);
      // エラーが発生した場合は元の状態に戻す
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_favorite: !newFavoriteState } : p))
      );
      alert('お気に入りの更新中にエラーが発生しました');
    }
  }

  // カード型とリスト型の切り替え
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'list' : 'card')
  }

  // 特定のカードへの移動
  const handleCardClick = (id: string) => {
    router.push(`/projects/${id}`)
  }

  // フィルター+検索適用
  const filteredProjects = projects
    .filter(p => statusFilter === 'すべて' ? true : p.status === statusFilter)
    .filter(p => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        p.name.toLowerCase().includes(searchLower) || 
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
    })

  // ソート: お気に入り→その他
  const sortedProjects = [
    ...filteredProjects.filter((p) => p.is_favorite),
    ...filteredProjects.filter((p) => !p.is_favorite)
  ]

  // フィルター状態をリセット
  const resetFilters = () => {
    setStatusFilter('すべて')
    setSearchTerm('')
  }

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

// レンダリングするプロジェクトメニュー (共通部分)
const renderProjectMenu = (p: Project, mode: 'card' | 'list' = 'card') => (
  <div className="relative">
    <button 
      onClick={(e) => {
        e.stopPropagation(); // 親要素へのクリックイベント伝播を防ぐ
        setOpenMenuId(openMenuId === p.id ? null : p.id);
      }}
      className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
      aria-label="メニューを開く"
    >
      <MoreVertical size={18} />
    </button>
    
    {openMenuId === p.id && (
      <div 
        ref={menuRef}
        className={`absolute z-20 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden
          ${mode === 'card' 
            ? 'bottom-full right-0 mb-1' // カード表示時は上に表示
            : 'top-0 right-0 mt-8'       // リスト表示時は下に表示
          }`}
        onClick={(e) => e.stopPropagation()} // メニュー内クリックの伝播を防ぐ
      >
        <ul className="text-sm divide-y divide-slate-100">
          <li>
            <Link 
              href={`/projects/${p.id}`} 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
              onClick={(e) => e.stopPropagation()} // リンククリックの伝播を防ぐ
            >
              <FileText size={16} />
              <span>詳細確認</span>
            </Link>
          </li>
          <li>
            <Link 
              href={`/projects/${p.id}/hypotheses`} 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
              onClick={(e) => e.stopPropagation()} // リンククリックの伝播を防ぐ
            >
              <Lightbulb size={16} />
              <span>仮説一覧</span>
            </Link>
          </li>
          <li>
            <Link 
              href={`/projects/${p.id}/hypotheses/new`} 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
              onClick={(e) => e.stopPropagation()} // リンククリックの伝播を防ぐ
            >
              <Plus size={16} />
              <span>仮説作成</span>
            </Link>
          </li>
          <li>
            <Link 
              href={`/projects/${p.id}/hypotheses/map`} 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
              onClick={(e) => e.stopPropagation()} // リンククリックの伝播を防ぐ
            >
              <MapIcon size={16} />
              <span>マップ表示</span>
            </Link>
          </li>
          <li>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 削除ボタンのクリックが伝播しないようにする
                handleDelete(p.id);
              }} 
              disabled={deletingId === p.id} 
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash size={16} />
              <span>{deletingId === p.id ? '削除中...' : '削除'}</span>
            </button>
          </li>
        </ul>
      </div>
    )}
  </div>
)

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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:text-indigo-700'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span>フィルター</span>
              {statusFilter !== 'すべて' && (
                <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs rounded-full">1</span>
              )}
            </button>
            
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
        
        {/* 展開されるフィルターオプション */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">ステータス</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((status) => (
                <button
                  key={status}
                  className={`text-sm px-4 py-2 rounded-lg border transition-all duration-200 ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-700'
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
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
          {filteredProjects.length} 件のプロジェクト
          {filteredProjects.length !== projects.length && ` (全 ${projects.length} 件中)`}
        </div>
        
        <div className="text-xs text-slate-500">
          {searchTerm && <span>検索: "{searchTerm}" </span>}
          {statusFilter !== 'すべて' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              {STATUS_ICONS[statusFilter] || <Filter size={12} />}
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
      ) : sortedProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="text-center py-16">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-700 mb-2">該当するプロジェクトはありません</h3>
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
      ) : viewMode === 'card' ? (
        // カード型表示
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((p) => (
            <div
              key={p.id}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200 overflow-hidden flex flex-col"
            >
              {/* ヘッダー部分 */}
              <div className="relative p-5 border-b border-slate-100">
                {/* お気に入りバッジ - アイコンスタイル */}
            {p.is_favorite && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-amber-400 text-white p-1.5 rounded-full shadow-sm">
                  <Star size={14} fill="currentColor" />
                </div>
              </div>
            )}
                            
                
                
                {/* プロジェクト名 */}
                <Link
                  href={`/projects/${p.id}`}
                  className="block mb-2 group-hover:translate-y-[-2px] transition-transform"
                >
                  <h2 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {p.name}
                  </h2>
                </Link>
                
                {/* 説明 */}
                {p.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{p.description}</p>
                )}
                
                {/* ステータスバッジ */}
                <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                  {STATUS_ICONS[p.status || '未着手'] || <CircleDashed size={14} />}
                  <span>{p.status || '未設定'}</span>
                </div>
              </div>

              {/* コンテンツ部分 */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-slate-600 gap-1.5">
                    <FileText size={16} className="text-indigo-500" />
                    <span>仮説 {p.hypothesis_count} 件</span>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleFavorite(p.id, e)} 
                    className={`p-1.5 rounded-full ${p.is_favorite ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-50'} transition-colors`}
                    aria-label={p.is_favorite ? "お気に入りから削除" : "お気に入りに追加"}
                  >
                    <Star fill={p.is_favorite ? 'currentColor' : 'none'} size={16} />
                  </button>
                </div>
                
                {/* 作成日 */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-auto">
                  <Clock size={14} />
                  <span>作成日: {new Date(p.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* フッター部分 */}
              <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t border-slate-100">
                <Link
                  href={`/projects/${p.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  詳細を見る
                  <ArrowUpRight size={16} />
                </Link>
                
                {renderProjectMenu(p, 'card')} {/* 'card'モードを明示的に指定 */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // リスト型表示
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>プロジェクト名</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    仮説数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedProjects.map((p) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleCardClick(p.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {p.is_favorite && (
                          <Star fill="currentColor" size={16} className="text-amber-400 flex-shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-slate-900">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{p.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                        {STATUS_ICONS[p.status || '未着手'] || <CircleDashed size={14} />}
                        <span>{p.status || '未設定'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <FileText size={16} className="text-indigo-500" />
                        <span>{p.hypothesis_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => toggleFavorite(p.id, e)} 
                        className={`p-1.5 rounded-full ${p.is_favorite ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-50'} transition-colors`}
                        aria-label={p.is_favorite ? "お気に入りから削除" : "お気に入りに追加"}
                      >
                        <Star fill={p.is_favorite ? 'currentColor' : 'none'} size={16} />
                      </button>
                      <div className="relative">
                        {renderProjectMenu(p, 'list')} {/* 'list'モードを明示的に指定 */}
                      </div>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* モバイル対応のリスト表示 */}
          <div className="md:hidden border-t border-slate-200">
            <div className="text-xs text-slate-500 px-4 py-2 bg-slate-50">
              リスト表示はモバイルデバイスでは一部簡略化されています
            </div>
            {sortedProjects.map((p) => (
              <div 
                key={p.id}
                className="border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors"
                onClick={() => handleCardClick(p.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {p.is_favorite && (
                      <Star fill="currentColor" size={16} className="text-amber-400 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <h3 className="font-medium text-slate-900 mb-1">{p.name}</h3>
                      <div className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {STATUS_ICONS[p.status || '未着手'] || <CircleDashed size={12} />}
                        <span>{p.status || '未設定'}</span>
                      </div>
                    </div>
                  </div>
                  
                                  <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-20" // z-indexを高く設定
                >
                  {renderProjectMenu(p, 'list')} {/* 'list'モードを明示的に指定 */}
                </div>
                </div>
                
                {p.description && (
                  <p className="text-xs text-slate-600 mb-3 line-clamp-1">{p.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{new Date(p.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-indigo-500" />
                    <span>仮説 {p.hypothesis_count} 件</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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