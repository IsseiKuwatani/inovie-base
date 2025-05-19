  import { 
    Star, FileText, CircleDashed, Clock, CheckCircle2, 
    UserPlus 
  } from 'lucide-react'
  import { useState } from 'react'
  import { Project, MenuRefType } from '@/types/projects'
  import { ProjectMenu } from './ProjectMenu'
  
  interface ProjectListProps {
    projects: Project[]
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
  
  export function ProjectList({
    projects,
    toggleFavorite,
    handleCardClick,
    handleDelete,
    deletingId,
    openMenuId,
    setOpenMenuId,
    menuRef,
    canDelete,
    showJoinButton
  }: ProjectListProps) {
    const [joiningId, setJoiningId] = useState<string | null>(null)
    
    // プロジェクト参加処理
    const handleJoin = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      
      if (joiningId === id) return
      
      try {
        setJoiningId(id)
        
        // Supabase API 呼び出し (実際のコードでは適切に実装)
        // const { error } = await supabase
        //   .from('project_members')
        //   .insert({ project_id: id, user_id: userId })
        
        // 成功メッセージ
        alert('プロジェクトに参加しました')
        
        // リロードして最新データを表示
        window.location.reload()
        
      } catch (err) {
        console.error('参加処理エラー:', err)
        alert('プロジェクト参加に失敗しました')
      } finally {
        setJoiningId(null)
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
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(project.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {project.is_favorite && (
                        <Star fill="currentColor" size={16} className="text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-slate-900">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{project.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                      {getStatusIcon(project.status)}
                      <span>{project.status || '未設定'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <FileText size={16} className="text-indigo-500" />
                      <span>{project.hypothesis_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(project.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {showJoinButton ? (
                        <button
                          onClick={(e) => handleJoin(project.id, e)}
                          disabled={joiningId === project.id}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                        >
                          <UserPlus size={16} />
                          <span className="text-xs font-medium">{joiningId === project.id ? '参加中...' : '参加'}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => toggleFavorite(project.id, e)} 
                          className={`p-1.5 rounded-full ${project.is_favorite ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-50'} transition-colors`}
                          aria-label={project.is_favorite ? "お気に入りから削除" : "お気に入りに追加"}
                        >
                          <Star fill={project.is_favorite ? 'currentColor' : 'none'} size={16} />
                        </button>
                      )}
                      
                      <ProjectMenu 
                        project={project}
                        handleDelete={handleDelete}
                        deletingId={deletingId}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        menuRef={menuRef}
                        canDelete={canDelete}
                        mode="list"
                      />
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
          {projects.map((project) => (
            <div 
              key={project.id}
              className="border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors"
              onClick={() => handleCardClick(project.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {project.is_favorite && (
                    <Star fill="currentColor" size={16} className="text-amber-400 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">{project.name}</h3>
                    <div className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      {getStatusIcon(project.status)}
                      <span>{project.status || '未設定'}</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-10"
                >
                  {showJoinButton ? (
                    <button
                      onClick={(e) => handleJoin(project.id, e)}
                      disabled={joiningId === project.id}
                      className="p-1 text-xs rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <UserPlus size={14} />
                      <span className="text-xs font-medium">{joiningId === project.id ? '参加中' : '参加'}</span>
                    </button>
                  ) : (
                    <ProjectMenu 
                      project={project}
                      handleDelete={handleDelete}
                      deletingId={deletingId}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      menuRef={menuRef}
                      canDelete={canDelete}
                      mode="list"
                    />
                  )}
                </div>
              </div>
              
              {project.description && (
                <p className="text-xs text-slate-600 mb-3 line-clamp-1">{project.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{new Date(project.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-indigo-500" />
                  <span>仮説 {project.hypothesis_count} 件</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
