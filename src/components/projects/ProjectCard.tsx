import { useState } from 'react'
import Link from 'next/link'
import { 
  Star, ArrowUpRight, Clock, FileText, 
  CircleDashed, CheckCircle2, UserPlus
} from 'lucide-react'
import { Project, MenuRefType, STATUS_ICONS } from '@/types/projects'
import { ProjectMenu } from './ProjectMenu'

interface ProjectCardProps {
  project: Project
  toggleFavorite: (id: string, e: React.MouseEvent) => void
  handleCardClick: (id: string) => void
  handleDelete: (id: string) => void
  deletingId: string | null
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  menuRef: MenuRefType
  canDelete: boolean
  showJoinButton: boolean
}

export function ProjectCard({
  project,
  toggleFavorite,
  handleCardClick,
  handleDelete,
  deletingId,
  openMenuId,
  setOpenMenuId,
  menuRef,
  canDelete,
  showJoinButton
}: ProjectCardProps) {
  const [isJoining, setIsJoining] = useState(false)
  
  // プロジェクト参加処理
  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isJoining) return
    
    try {
      setIsJoining(true)
      
      // Supabase API 呼び出し (実際のコードでは適切に実装)
      // const { error } = await supabase
      //   .from('project_members')
      //   .insert({ project_id: project.id, user_id: userId })
      
      // 成功メッセージ
      alert('プロジェクトに参加しました')
      
      // リロードして最新データを表示
      window.location.reload()
      
    } catch (err) {
      console.error('参加処理エラー:', err)
      alert('プロジェクト参加に失敗しました')
    } finally {
      setIsJoining(false)
    }
  }
  
  // アイコンコンポーネント
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case '未着手':
        return <CircleDashed size={14} />
      case '進行中':
        return <Clock size={14} className="text-amber-500" />
      case '完了':
        return <CheckCircle2 size={14} className="text-emerald-500" />
      default:
        return <CircleDashed size={14} />
    }
  }
  
  return (
    <div
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200 overflow-hidden flex flex-col"
    >
      {/* ヘッダー部分 */}
      <div className="relative p-5 border-b border-slate-100">
        {/* お気に入りバッジ */}
        {project.is_favorite && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-amber-400 text-white p-1.5 rounded-full shadow-sm">
              <Star size={14} fill="currentColor" />
            </div>
          </div>
        )}
        
        {/* プロジェクト名 */}
        <div
          onClick={() => handleCardClick(project.id)}
          className="block mb-2 group-hover:translate-y-[-2px] transition-transform cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {project.name}
          </h2>
        </div>
        
        {/* 説明 */}
        {project.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
        )}
        
        {/* ステータスバッジ */}
        <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
          {getStatusIcon(project.status)}
          <span>{project.status || '未設定'}</span>
        </div>
      </div>

      {/* コンテンツ部分 */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-slate-600 gap-1.5">
            <FileText size={16} className="text-indigo-500" />
            <span>仮説 {project.hypothesis_count} 件</span>
          </div>
          
          <button 
            onClick={(e) => toggleFavorite(project.id, e)} 
            className={`p-1.5 rounded-full ${project.is_favorite ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-50'} transition-colors`}
            aria-label={project.is_favorite ? "お気に入りから削除" : "お気に入りに追加"}
          >
            <Star fill={project.is_favorite ? 'currentColor' : 'none'} size={16} />
          </button>
        </div>
        
        {/* 作成日 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-auto">
          <Clock size={14} />
          <span>作成日: {new Date(project.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* フッター部分 */}
      <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t border-slate-100">
        {showJoinButton ? (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group-hover:gap-2 transition-all disabled:opacity-50"
          >
            <UserPlus size={16} />
            {isJoining ? '参加中...' : 'プロジェクトに参加'}
          </button>
        ) : (
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            詳細を見る
            <ArrowUpRight size={16} />
          </Link>
        )}
        
        <ProjectMenu 
          project={project}
          handleDelete={handleDelete}
          deletingId={deletingId}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuRef={menuRef}
          canDelete={canDelete}
        />
      </div>
    </div>
  )
}
