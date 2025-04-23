// components/MainContentUnderDevelopment.tsx
'use client'

import { Construction, Calendar, Lightbulb } from 'lucide-react'

type MainContentUnderDevelopmentProps = {
  title?: string;
  description?: string;
  estimatedCompletion?: string;
  menuItem?: string; // 選択されたメニュー項目名
}

export default function MainContentUnderDevelopment({
  title = "ページ開発中",
  description = "このページは現在開発中です。近日中に公開予定です。",
  estimatedCompletion,
  menuItem
}: MainContentUnderDevelopmentProps) {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="text-center max-w-lg">
        <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-8">
          <Construction size={48} className="text-indigo-600" />
        </div>
        
        {menuItem && (
          <div className="mb-4 text-indigo-700 bg-indigo-50 rounded-full py-2 px-4 inline-block">
            <span className="font-medium">{menuItem}</span>
          </div>
        )}
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 text-lg mb-8">{description}</p>
        
        {estimatedCompletion && (
          <div className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 py-3 px-6 rounded-xl mb-8 text-lg">
            <Calendar size={20} />
            <span>予定完了日: {estimatedCompletion}</span>
          </div>
        )}
        
        <div className="mt-8 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-start">
            <Lightbulb size={24} className="text-yellow-500 mr-3 flex-shrink-0" />
            <p className="text-left text-gray-700">
              他のメニュー項目を試すか、開発が完了するまでお待ちください。ご不便をおかけして申し訳ありません。
            </p>
          </div>
        </div>
      </div>
      
      {/* アニメーション効果のある装飾要素 */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  )
}
