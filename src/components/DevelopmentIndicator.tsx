// components/DevelopmentIndicator.tsx
'use client'

import { Construction, Info } from 'lucide-react'
import { useState } from 'react'

type DevelopmentIndicatorProps = {
  title?: string;
  description?: string;
  estimatedCompletion?: string;
  variant?: 'default' | 'compact' | 'banner';
}

export default function DevelopmentIndicator({
  title = "開発中の機能",
  description = "この機能は現在開発中です。近日中に公開予定です。",
  estimatedCompletion,
  variant = 'default'
}: DevelopmentIndicatorProps) {
  const [isInfoVisible, setIsInfoVisible] = useState(false)
  
  if (variant === 'compact') {
    return (
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded-md">
          <Construction size={12} />
          <span>{title}</span>
          <button
            onClick={() => setIsInfoVisible(!isInfoVisible)}
            className="ml-1 text-yellow-600 hover:text-yellow-800"
          >
            <Info size={12} />
          </button>
        </div>
        
        {isInfoVisible && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-white shadow-lg rounded-md p-3 text-xs w-60">
            <p className="text-gray-700 mb-2">{description}</p>
            {estimatedCompletion && (
              <p className="text-gray-500">予定完了日: {estimatedCompletion}</p>
            )}
          </div>
        )}
      </div>
    )
  }
  
  if (variant === 'banner') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
        <div className="flex items-start">
          <Construction size={20} className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{title}</h3>
            <p className="mt-1 text-sm text-yellow-700">{description}</p>
            {estimatedCompletion && (
              <p className="mt-1 text-xs text-yellow-600">予定完了日: {estimatedCompletion}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Default variant
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
          <Construction size={20} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          <p className="mt-1 text-gray-600">{description}</p>
          {estimatedCompletion && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 py-1 px-2 rounded-full">
              <span>予定完了日: {estimatedCompletion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
