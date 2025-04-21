// app/(dashboard)/settings/page.tsx
export default function SettingsPage() {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">
            アプリケーション全体の設定ページです。
          </p>
          
          {/* ここに設定項目を追加 */}
          <div className="mt-6 space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-gray-800">アカウント設定</h3>
              <p className="text-sm text-gray-500 mt-1">ユーザープロフィールや認証設定を管理します</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-gray-800">通知設定</h3>
              <p className="text-sm text-gray-500 mt-1">通知の受け取り方法や頻度を設定します</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-gray-800">表示設定</h3>
              <p className="text-sm text-gray-500 mt-1">UIのカスタマイズやテーマを設定します</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  