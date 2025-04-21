// app/(dashboard)/hypotheses/page.tsx
import Link from 'next/link'
import { Lightbulb } from 'lucide-react'

export default function AllHypothesesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">すべての仮説</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-700">グローバル仮説一覧</h2>
          <p className="mt-2 text-gray-500 max-w-lg mx-auto">
            すべてのプロジェクトの仮説を一覧表示する機能は現在開発中です。
            特定のプロジェクトの仮説を閲覧するには、プロジェクトページから確認してください。
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            プロジェクト一覧へ
          </Link>
        </div>
      </div>
    </div>
  )
}