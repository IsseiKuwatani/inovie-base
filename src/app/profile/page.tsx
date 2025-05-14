'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Edit, 
  Save, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  organization_id: string;
  organization?: {
    id: string;
    name: string;
  } | null;
};


export default function MyPage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // フォーム状態
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);
  
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
  
        if (!user) {
          router.push('/login');
          return;
        }
  
        setAuthUser(user);
  
        // プロフィール取得
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, email, display_name, phone, position, department, organization_id')
          .eq('id', user.id)
          .maybeSingle();
  
          let currentProfile = profileData;

          if (!currentProfile) {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email,
                display_name: user.email?.split('@')[0] || 'ユーザー'
              })
              .select()
              .single();
          
            if (createError || !newProfile) {
              console.error('プロフィール作成エラー:', createError);
              setError('プロフィールの作成に失敗しました');
              return;
            }
          
            currentProfile = newProfile;
          }
          
          // この位置で nullチェックを入れる
          if (!currentProfile) {
            setError('プロフィールの取得に失敗しました');
            return;
          }
          
          // ↓ ここから先は currentProfile は null ではないと保証される
          let organizationInfo: { id: string; name: string } | null = null;
          if (currentProfile.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', currentProfile.organization_id)
              .maybeSingle();
          
            if (orgData) {
              organizationInfo = orgData;
            } else {
              console.error('組織情報取得エラー:', orgError);
            }
          }
  
        // プロフィールとフォーム初期値を設定
        setProfile({
          id: currentProfile.id,
          email: currentProfile.email,
          display_name: currentProfile.display_name,
          phone: currentProfile.phone,
          position: currentProfile.position,
          department: currentProfile.department,
          organization_id: currentProfile.organization_id,
          organization: organizationInfo
        });
  
        setDisplayName(currentProfile.display_name || '');
        setPhone(currentProfile.phone || '');
        setPosition(currentProfile.position || '');
        setDepartment(currentProfile.department || '');
      } catch (err: any) {
        console.error('データ取得エラー:', err);
        setError('情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserAndProfile();
  }, [router]);

  // プロフィール更新
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile || !authUser) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          phone: phone || null,
          position: position || null,
          department: department || null
        })
        .eq('id', profile.id)
      
      if (error) throw error
      
      // プロフィール情報を更新
      setProfile({
        ...profile,
        display_name: displayName,
        phone: phone || null,
        position: position || null,
        department: department || null
      })
      
      setSuccess('プロフィールを更新しました')
      setEditing(false)
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (err: any) {
      console.error('プロフィール更新エラー:', err)
      setError('プロフィールの更新に失敗しました: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600">情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          マイページ
        </h1>
        <p className="text-slate-600 mt-2">
          アカウント情報とプロフィールを管理します
        </p>
      </header>
      
      {/* 通知メッセージ */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg mb-6">
          <div className="flex">
            <AlertCircle className="text-rose-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-rose-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg mb-6">
          <div className="flex">
            <CheckCircle className="text-emerald-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-emerald-700">{success}</p>
          </div>
        </div>
      )}
      
      {/* アカウント情報 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            アカウント情報
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">メールアドレス</h3>
            <p className="mt-1 flex items-center gap-2">
              <Mail className="text-slate-400" size={16} />
              <span className="text-slate-800">{authUser?.email}</span>
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-slate-500">認証方法</h3>
            <p className="mt-1 text-slate-800">
              {authUser?.app_metadata?.provider === 'email' ? 'メール/パスワード' : authUser?.app_metadata?.provider || '不明'}
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
      
      {/* プロフィール情報 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            プロフィール情報
          </h2>
          
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit size={16} />
              編集
            </button>
          ) : (
            <button
              onClick={() => {
                setEditing(false)
                // 編集をキャンセルして元の値に戻す
                setDisplayName(profile?.display_name || '')
                setPhone(profile?.phone || '')
                setPosition(profile?.position || '')
                setDepartment(profile?.department || '')
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} />
              キャンセル
            </button>
          )}
        </div>
        
        {editing ? (
          <form onSubmit={updateProfile} className="p-6 space-y-6">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 mb-1">
                表示名
              </label>
              <div className="relative">
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="表示名"
                />
                <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                電話番号
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="電話番号（任意）"
                />
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">
                  役職
                </label>
                <div className="relative">
                  <input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="役職（任意）"
                  />
                  <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
                  部署
                </label>
                <div className="relative">
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="部署（任意）"
                  />
                  <Building className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    変更を保存
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500">表示名</h3>
              <p className="mt-1 text-lg font-medium text-slate-900">
                {profile?.display_name || <span className="text-slate-400 italic">未設定</span>}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-500">電話番号</h3>
              <p className="mt-1 text-slate-700">
                {profile?.phone || <span className="text-slate-400 italic">未設定</span>}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500">役職</h3>
                <p className="mt-1 text-slate-700">
                  {profile?.position || <span className="text-slate-400 italic">未設定</span>}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500">部署</h3>
                <p className="mt-1 text-slate-700">
                  {profile?.department || <span className="text-slate-400 italic">未設定</span>}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-500">所属組織</h3>
              <p className="mt-1 text-slate-700">
                {profile?.organization?.name || <span className="text-slate-400 italic">組織情報が見つかりません</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}