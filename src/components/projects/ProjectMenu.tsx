import Link from 'next/link'
import { 
  MoreVertical, FileText, Lightbulb, Plus, Map, 
  Trash, UserPlus, LayoutList 
} from 'lucide-react'
import { Project, MenuRefType } from '@/types/projects'

interface ProjectMenuProps {
  project: Project
  handleDelete: (id: string) => void
  deletingId: string | null
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  menuRef: MenuRefType
  canDelete: boolean
  mode?: 'card' | 'list'
}

export function ProjectMenu({
  project,
  handleDelete,
  deletingId,
  openMenuId,
  setOpenMenuId,
  menuRef,
  canDelete,
  mode = 'card'
}: ProjectMenuProps) {
  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenuId(openMenuId === project.id ? null : project.id)
        }}
        className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
        aria-label="メニューを開く"
      >
        <MoreVertical size={18} />
      </button>
      
      {openMenuId === project.id && (
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
                href={`/projects/${project.id}`} 
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText size={16} />
                <span>詳細確認</span>
              </Link>
            </li>
            <li>
              <Link 
                href={`/projects/${project.id}/hypotheses`} 
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Lightbulb size={16} />
                <span>仮説一覧</span>
              </Link>
            </li>
            <li> <Link 
                href={`/projects/${project.id}/hypotheses/new`} 
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus size={16} />
                <span>仮説作成</span>
              </Link>
            </li>
            <li>
              <Link 
                href={`/projects/${project.id}/hypotheses/map`} 
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Map size={16} />
                <span>マップ表示</span>
              </Link>
            </li>
            <li>
              <Link 
                href={`/projects/${project.id}/tasks`} 
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <LayoutList size={16} />
                <span>タスク管理</span>
              </Link>
            </li>
            {canDelete && (
              <li>
                <button 
                  onClick={(e) => {
                    e.stopPropagation() // 削除ボタンのクリックが伝播しないようにする
                    handleDelete(project.id)
                  }} 
                  disabled={deletingId === project.id} 
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash size={16} />
                  <span>{deletingId === project.id ? '削除中...' : '削除'}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
