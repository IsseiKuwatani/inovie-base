'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  FolderPlus, 
  ArrowLeft, 
  Sparkles, 
  CalendarClock,
  FileText,
  Info,
  Clock,
  AlertTriangle,
  XCircle,
  Building
} from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('未着手')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState('約3〜5分')
  
  // 組織情報関連の状態を追加
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [loadingOrganization, setLoadingOrganization] = useState(true)

  // ページロード時に組織情報を取得
  useEffect(() => {
    const fetchUserOrganization = async () => {
      try {
        setLoadingOrganization(true)
        
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // ユーザープロフィールを取得
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('プロフィール取得エラー:', profileError)
          setError('組織情報の取得に失敗しました')
          return
        }
        
        if (!profileData?.organization_id) {
          setError('所属組織が見つかりません。プロフィールを更新してください。')
          return
        }
        
        setOrganizationId(profileData.organization_id)
        
        // 組織名を取得（オプション）
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profileData.organization_id)
          .single()
        
        if (!orgError && orgData) {
          setOrganizationName(orgData.name)
        }
        
      } catch (err) {
        console.error('組織情報取得エラー:', err)
        setError('組織情報の取得に失敗しました')
      } finally {
        setLoadingOrganization(false)
      }
    }
    
    fetchUserOrganization()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!name.trim()) {
      setError('プロジェクト名を入力してください')
      return
    }
    
    // 組織IDがない場合はエラー
    if (!organizationId) {
      setError('所属組織が設定されていません。プロフィールを確認してください。')
      return
    }

    setLoading(true)

    try {
      const session = await supabase.auth.getSession()
      const token = session?.data.session?.access_token

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          status,
          description,
          autoGenerateHypotheses: autoGenerate,
          organization_id: organizationId  // 組織IDを追加
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'プロジェクトの作成に失敗しました')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/projects')
        }, 2000) // 自動生成の場合でも通常のリダイレクト
      }
    } catch (err) {
      console.error('API呼び出しエラー:', err)
      setError('予期せぬエラーが発生しました')
    }

    setLoading(false)
  }

  // 組織情報の読み込み中表示
  if (loadingOrganization) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600">組織情報を読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Link
          href="/projects"
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>プロジェクト一覧に戻る</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">新規プロジェクト作成</h1>
        <p className="text-slate-500">プロジェクトを作成して、仮説検証のサイクルを開始しましょう。</p>
      </div>

      {/* 組織情報の表示 */}
      {organizationId && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <Building className="text-indigo-600" size={20} />
          <div>
            <p className="text-sm text-slate-600">所属組織</p>
            <p className="font-medium text-slate-800">{organizationName || '組織名が取得できません'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">プロジェクト名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none"
                placeholder="例：新サービスαの検証"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ステータス</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none"
                >
                  <option value="未着手">未着手</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <CalendarClock size={18} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">説明</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all outline-none"
                  rows={4}
                  placeholder="プロジェクトの目的や背景を入力"
                />
                <div className="absolute top-3 right-3">
                  <FileText size={18} className="text-slate-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">具体的な内容を記入するとチームメンバーとの共有がスムーズになります。</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Sparkles size={20} className="text-indigo-600" />
                </div>
                <div>
                  <label htmlFor="autoGenerate" className="block text-sm font-medium text-indigo-800">仮説を自動生成</label>
                  <p className="text-xs text-indigo-600">AIが初期仮説を自動で追加します（任意）</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="autoGenerate"
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {/* 自動生成が選択された場合に表示する時間の目安と注意事項 */}
            {autoGenerate && (
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-white/50 border border-indigo-100 rounded-lg">
                  <div className="flex items-start gap-2 text-indigo-700">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">仮説の自動生成には時間がかかります</p>
                      <p className="mt-1">生成完了までの目安: {estimatedTime}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <div className="text-xs text-rose-800">
                      <p className="font-medium">処理を中断しないでください</p>
                      <p className="mt-1">生成処理中にページを閉じると、仮説の生成が完了しません。生成が完了するまでこのページでお待ちください。</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ヒントカード */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <div className="flex-shrink-0">
              <Info size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800">プロジェクト作成のヒント</h3>
              <p className="text-xs text-amber-700 mt-1">プロジェクトを作成した後は、仮説の追加や検証サイクルの設定ができます。仮説は後からいつでも追加・編集できます。</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-md flex items-start gap-3">
              <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md flex items-start gap-3">
              <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-emerald-700 font-medium">プロジェクトを作成しました！</p>
                {autoGenerate && (
                  <p className="text-xs text-emerald-600 mt-1">仮説を自動生成しています。しばらくお待ちください...<br/>処理が完了するまでこのページを閉じないでください。</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4 justify-end">
            <Link
              href="/projects"
              className="px-5 py-2.5 text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading || !organizationId}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-full hover:shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{autoGenerate ? '作成・生成中...' : '作成中...'}</span>
                </>
              ) : (
                <>
                  <FolderPlus size={18} />
                  <span>プロジェクトを作成</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
