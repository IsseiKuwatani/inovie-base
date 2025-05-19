import { ProjectCategory } from '@/types/projects'

interface ProjectTabsProps {
  selectedTab: ProjectCategory
  onTabChange: (tab: ProjectCategory) => void
  ownedCount: number
  joinedCount: number
  orgCount: number
}

export function ProjectTabs({ 
  selectedTab, 
  onTabChange,
  ownedCount,
  joinedCount,
  orgCount
}: ProjectTabsProps) {
  
  const tabs = [
    { 
      id: 'all' as ProjectCategory, 
      label: 'すべて', 
      count: ownedCount + joinedCount + orgCount 
    },
    { 
      id: 'owned' as ProjectCategory, 
      label: '作成したプロジェクト', 
      count: ownedCount 
    },
    { 
      id: 'member' as ProjectCategory, 
      label: '参加中のプロジェクト', 
      count: joinedCount 
    },
    { 
      id: 'organization' as ProjectCategory, 
      label: '組織内プロジェクト', 
      count: orgCount 
    }
  ]
  
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${selectedTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${selectedTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
