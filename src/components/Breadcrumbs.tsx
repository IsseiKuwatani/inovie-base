'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderKanban,
  FlaskConical,
  FilePlus,
  Pencil,
  ListTodo,
  FileText,
} from 'lucide-react'

const labelMap: Record<string, { label: string; icon: React.ReactNode }> = {
  projects: { label: 'プロジェクト一覧', icon: <FolderKanban size={14} className="inline" /> },
  hypotheses: { label: '仮説一覧', icon: <FlaskConical size={14} className="inline" /> },
  new: { label: '新規作成', icon: <FilePlus size={14} className="inline" /> },
  edit: { label: '編集', icon: <Pencil size={14} className="inline" /> },
  me: { label: 'マイページ', icon: <FileText size={14} className="inline" /> },
}

// ❌ 非表示にしたいパス（404になる可能性あり）
const hiddenSegments = ['validations']

function resolveSegment(segment: string) {
  if (labelMap[segment]) return labelMap[segment]
  if (segment.length > 10) return { label: '詳細', icon: null }
  return { label: decodeURIComponent(segment), icon: null }
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments
    .map((seg, idx) => {
      if (hiddenSegments.includes(seg)) return null

      const href = '/' + segments.slice(0, idx + 1).join('/')
      const { label, icon } = resolveSegment(seg)
      return { href, label, icon }
    })
    .filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[]

  return (
    <nav className="text-sm text-gray-600 mb-6 px-2 pt-4 flex flex-wrap gap-1 items-center">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {isLast ? (
              <span className="text-gray-500 flex items-center gap-1">
                {c.icon}
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="text-blue-600 hover:underline flex items-center gap-1">
                {c.icon}
                {c.label}
              </Link>
            )}
            {!isLast && <span className="text-gray-400">›</span>}
          </span>
        )
      })}
    </nav>
  )
}
