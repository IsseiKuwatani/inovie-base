// src/app/projects/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Edit, FlaskConical, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const projects = [
  { id: 'alpha', name: '新規Webアプリ「Alpha」', status: '検証中', description: 'Webサービスの仮説検証プロジェクトです。' },
  { id: 'beta', name: 'SaaSサービス「Beta」', status: '仮説整理中', description: '業務支援SaaSの初期フェーズ。' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const project = useMemo(() => projects.find(p => p.id === id), [id]);

  if (!project) {
    return <div>プロジェクトが見つかりませんでした。</div>;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
          <Edit size={16} />
          編集
        </button>
      </div>

      {/* ステータス + 説明 */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <StatusBadge status={project.status} />
        <span>{project.description}</span>
      </div>

      {/* 仮説一覧（仮データ） */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">仮説一覧</h2>
          <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <PlusCircle size={16} />
            仮説を追加
          </button>
        </div>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 bg-white border rounded-md p-4">
            <FlaskConical size={18} className="text-gray-500" />
            <span className="text-sm">ターゲット企業の課題感は強いか？</span>
          </li>
          <li className="flex items-center gap-2 bg-white border rounded-md p-4">
            <FlaskConical size={18} className="text-gray-500" />
            <span className="text-sm">LPでのCV率は10%以上か？</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

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