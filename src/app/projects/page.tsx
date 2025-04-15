// src/app/projects/page.tsx
'use client';

import Link from 'next/link';
import { PlusCircle, ArrowRight, FlaskConical } from 'lucide-react';

const projects = [
  { id: 'alpha', name: '新規Webアプリ「Alpha」', status: '検証中' },
  { id: 'beta', name: 'SaaSサービス「Beta」', status: '仮説整理中' },
];

export default function ProjectList() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
        <Link
          href="#"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <PlusCircle size={18} />
          新規作成
        </Link>
      </div>

      {/* プロジェクトカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FlaskConical size={16} />
                <span>{p.status}</span>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <h2 className="text-lg font-semibold mb-3">{p.name}</h2>
            <div className="text-right">
              <Link
                href={`/projects/${p.id}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                詳細を見る <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ステータスに応じて色が変わるバッジ
function StatusBadge({ status }: { status: string }) {
  const color = status === '検証中'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-700';
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
      {status}
    </span>
  );
}
