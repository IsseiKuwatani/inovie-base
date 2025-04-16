'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderKanban,
  FlaskConical,
  FilePlus,
  Pencil,
  Home,
  FileText,
  ChevronRight,
  MapPin,
  ListFilter,
  User
} from 'lucide-react'

const labelMap: Record<string, { label: string; icon: React.ReactNode; color?: string }> = {
  projects: { 
    label: 'プロジェクト一覧', 
    icon: <FolderKanban size={16} />, 
    color: 'text-violet-500'
  },
  hypotheses: { 
    label: '仮説一覧', 
    icon: <FlaskConical size={16} />, 
    color: 'text-indigo-500'
  },
  new: { 
    label: '新規作成', 
    icon: <FilePlus size={16} />, 
    color: 'text-emerald-500'
  },
  edit: { 
    label: '編集', 
    icon: <Pencil size={16} />, 
    color: 'text-amber-500'
  },
  me: { 
    label: 'マイページ', 
    icon: <User size={16} />, 
    color: 'text-slate-500'
  },
  map: { 
    label: 'マップ表示', 
    icon: <MapPin size={16} />, 
    color: 'text-rose-500'
  },
}

// ❌ 非表示にしたいパス（404になる可能性あり）
const hiddenSegments = ['validations']

function resolveSegment(segment: string) {
  if (labelMap[segment]) return labelMap[segment]
  if (segment.length > 10) return { label: '詳細', icon: <FileText size={16} />, color: 'text-slate-500' }
  return { label: decodeURIComponent(segment), icon: <ListFilter size={16} />, color: 'text-slate-500' }
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments
    .map((seg, idx) => {
      if (hiddenSegments.includes(seg)) return null

      const href = '/' + segments.slice(0, idx + 1).join('/')
      const { label, icon, color } = resolveSegment(seg)
      return { href, label, icon, color }
    })
    .filter(Boolean) as { href: string; label: string; icon: React.ReactNode; color?: string }[]

  return (
    <nav className="bg-white border-b border-slate-100 shadow-sm py-3 px-4 sm:px-6 lg:px-8 mb-6">
      <div className="max-w-7xl mx-auto flex items-center text-sm text-slate-600">
        <Link 
          href="/" 
          className="flex items-center bg-slate-50 rounded-full p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label="ホーム"
        >
          <Home size={16} />
        </Link>
        
        {crumbs.length > 0 && (
          <ChevronRight size={14} className="mx-2 text-slate-300" />
        )}
        
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span key={i} className="flex items-center">
              {isLast ? (
                <span 
                  className={`${c.color || 'text-slate-700'} bg-slate-50 rounded-full py-1.5 px-3 font-medium flex items-center gap-1.5`}
                >
                  {c.icon}
                  {c.label}
                </span>
              ) : (
                <>
                  <Link 
                    href={c.href} 
                    className={`${c.color || 'text-indigo-600'} hover:underline flex items-center gap-1.5 hover:text-indigo-800 transition-colors`}
                  >
                    {c.icon}
                    <span>{c.label}</span>
                  </Link>
                  <ChevronRight size={14} className="mx-2 text-slate-300" />
                </>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
