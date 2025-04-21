// app/page.tsx (ルートページ)
export default function HomePage() {
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <h1 className="text-2xl font-bold mb-4">ホームページ</h1>
      <p>これはテスト用のホームページです</p>
      
      <div className="mt-4 space-y-2">
        <div>
          <a href="/login" className="text-blue-600 hover:underline">ログインページ</a>
        </div>
        <div>
          <a href="/projects" className="text-blue-600 hover:underline">プロジェクト一覧</a>
        </div>
      </div>
    </div>
  )
}
