import { useState } from 'react'
import { SlidersHorizontal, Filter } from 'lucide-react'
import { STATUS_TABS } from '@/app/projects/page'

interface ProjectStatusFilterProps {
  statusFilter: string
  setStatusFilter: (status: string) => void
}

export function ProjectStatusFilter({ 
  statusFilter, 
  setStatusFilter 
}: ProjectStatusFilterProps) {
  const [showFilters, setShowFilters] = useState(false)
  
  return (
    <div className="relative">
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
      
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg border border-slate-200 p-4 w-64 z-30">
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
                onClick={() => {
                  setStatusFilter(status)
                  setShowFilters(false)
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}