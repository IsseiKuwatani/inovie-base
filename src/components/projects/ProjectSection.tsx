import { useRef } from 'react'
import { Project, MenuRefType } from '@/types/projects'
import { ProjectCard } from './ProjectCard'
import { ProjectList } from './ProjectList'

interface ProjectSectionProps {
    projects: Project[]
    viewMode: 'card' | 'list'
    toggleFavorite: (id: string, e: React.MouseEvent) => void
    handleCardClick: (id: string) => void
    handleDelete: (id: string) => void
    statusFilter: string
    searchTerm: string
    deletingId: string | null
    openMenuId: string | null
    setOpenMenuId: (id: string | null) => void
    menuRef: MenuRefType
    canDelete?: boolean
    showJoinButton?: boolean
  }

export function ProjectSection({
  projects,
  viewMode,
  toggleFavorite,
  handleCardClick,
  handleDelete,
  statusFilter,
  searchTerm,
  deletingId,
  openMenuId,
  setOpenMenuId,
  menuRef,
  canDelete = false,
  showJoinButton = false
}: ProjectSectionProps) {
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

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 text-center">
        <p className="text-slate-500">表示できるプロジェクトはありません</p>
      </div>
    )
  }

  return viewMode === 'card' ? (
    // カード表示
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedProjects.map((project) => (
        <ProjectCard 
          key={project.id}
          project={project}
          toggleFavorite={toggleFavorite}
          handleCardClick={handleCardClick}
          handleDelete={handleDelete}
          deletingId={deletingId}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuRef={menuRef}
          canDelete={canDelete}
          showJoinButton={showJoinButton}
        />
      ))}
    </div>
  ) : (
    // リスト表示
    <ProjectList 
      projects={sortedProjects}
      toggleFavorite={toggleFavorite}
      handleCardClick={handleCardClick}
      handleDelete={handleDelete}
      deletingId={deletingId}
      openMenuId={openMenuId}
      setOpenMenuId={setOpenMenuId}
      menuRef={menuRef}
      canDelete={canDelete}
      showJoinButton={showJoinButton}
    />
  )
}
