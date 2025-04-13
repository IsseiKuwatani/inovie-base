// src/app/projects/page.tsx
export default function ProjectList() {
  const projects = [
    { id: 'alpha', name: '新規Webアプリ「Alpha」', status: '検証中' },
    { id: 'beta', name: 'SaaSサービス「Beta」', status: '仮説整理中' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">プロジェクト一覧</h1>
      <ul className="space-y-4">
        {projects.map((p) => (
          <li key={p.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <a href={`/projects/${p.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
              {p.name}
            </a>
            <p className="text-sm text-gray-500 mt-1">ステータス: {p.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
