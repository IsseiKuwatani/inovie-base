'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  AlertCircle, Building2, Loader2, Save, Users, 
  Info, Mail, UserPlus, Clock, CheckCircle,
  Settings
} from 'lucide-react'

// 既存の UI コンポーネントをインポート
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Organization = {
  id: string
  name: string
  description?: string
}

type Member = {
  id: string
  email?: string
  display_name?: string
  role?: string
  department?: string
  status?: string
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization>({
    id: '',
    name: '',
    description: ''
  })
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchOrganizationData()
  }, [])

  const fetchOrganizationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // ① ユーザー情報
      const { data: { user } } = await supabase.auth.getUser()
      console.log('user.id:', user?.id)
  
      if (!user) {
        setError('ログインが必要です')
        setLoading(false)
        return
      }
  
      // ② プロファイル（organization_id取得）
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      console.log('profile:', profile)
      console.log('organization_id:', profile?.organization_id)
  
      if (profileError || !profile?.organization_id) {
        setError('組織が見つかりません')
        setLoading(false)
        return
      }
  
      // ③ 組織情報取得
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()
      
      console.log('org:', org)
  
      if (orgError || !org) {
        setError('組織情報の取得に失敗しました')
        setLoading(false)
        return
      }
  
      setOrganization({
        id: org.id,
        name: org.name || '',
        description: org.description || ''
      })
  
      // ④ メンバー一覧取得
      const { data: memberProfiles, error: memberError } = await supabase
        .from('user_profiles')
        .select('id, email, display_name, role, status, department')
        .eq('organization_id', org.id)
      
      console.log('members:', memberProfiles)
  
      if (!memberError && memberProfiles) {
        setMembers(memberProfiles)
      }
  
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError('予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const saveOrganizationInfo = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          description: organization.description
        })
        .eq('id', organization.id)
        
      if (error) {
        throw new Error('組織情報の更新に失敗しました')
      }
      
      alert('組織情報を更新しました')
      
    } catch (err: any) {
      console.error('更新エラー:', err)
      setError(err.message || '組織情報の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const inviteMember = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('有効なメールアドレスを入力してください')
      return
    }
    
    try {
      setInviting(true)
      setError(null)
      
      // 実際の実装では、招待メール送信APIを呼び出す
      // ここではメール送信の代わりにユーザー仮登録
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', inviteEmail)
        .eq('organization_id', organization.id)
        .single()
        
      if (existingUser) {
        setError('このメールアドレスはすでに招待されています')
        return
      }
      
      // 仮ユーザープロフィールを作成
      const { error: inviteError } = await supabase
        .from('user_profiles')
        .insert({
          email: inviteEmail,
          organization_id: organization.id,
          status: 'invited',
          role: 'member'
        })
        
      if (inviteError) {
        throw new Error('メンバー招待に失敗しました')
      }
      
      alert(`${inviteEmail} にメンバー招待メールを送信しました`)
      setInviteEmail('')
      
      // メンバーリストを更新
      fetchOrganizationData()
      
    } catch (err: any) {
      console.error('招待エラー:', err)
      setError(err.message || 'メンバー招待に失敗しました')
    } finally {
      setInviting(false)
    }
  }

  const toggleMemberStatus = async (memberId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', memberId)
        .eq('organization_id', organization.id)
        
      if (error) {
        throw new Error('ステータス変更に失敗しました')
      }
      
      // メンバーリストを更新
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, status: newStatus } : member
      ))
      
    } catch (err: any) {
      console.error('ステータス変更エラー:', err)
      setError(err.message || 'ステータス変更に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <span className="text-lg font-medium text-slate-700">組織データを読み込み中...</span>
      </div>
    )
  }

  if (error && !organization.id) {
    return (
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">エラーが発生しました</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                再読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  console.log('state: organization', organization)
  
  return (
    <div className="max-w-5xl mx-auto my-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">
          組織管理
        </h1>
        <p className="text-slate-500">
          組織の基本情報とメンバーの管理を行えます
        </p>
      </div>
      
      {/* 開発中通知 */}
      <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
        <div className="flex">
          <Info className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">機能開発中のお知らせ</h3>
            <p className="text-sm text-amber-700 mt-1">
              組織管理機能は現在開発中です。メンバー招待などの一部機能は正常に動作しない場合があります。
            </p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'info' | 'members')}>
        <TabsList className="mb-6 bg-slate-100 p-1 rounded-xl shadow-inner">
          <TabsTrigger value="info" className="flex items-center rounded-lg py-2.5 px-4">
            <Building2 className="w-4 h-4 mr-2" />
            組織情報
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center rounded-lg py-2.5 px-4">
            <Users className="w-4 h-4 mr-2" />
            メンバー管理
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card className="border-none shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2 text-indigo-800">
                <Settings className="h-6 w-6" />
                組織情報
              </CardTitle>
              <CardDescription className="text-indigo-700/70">
                組織の基本情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">組織名</label>
                  <Input 
                    value={organization.name} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setOrganization({...organization, name: e.target.value})
                    }
                    placeholder="組織名"
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">説明</label>
                  <Textarea 
                    value={organization.description} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setOrganization({...organization, description: e.target.value})
                    }
                    placeholder="組織の説明を入力してください"
                    rows={4}
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end bg-slate-50 py-4 border-t border-slate-100">
              <Button 
                onClick={saveOrganizationInfo} 
                disabled={saving}
                className="flex items-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? '保存中...' : '保存'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card className="border-none shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2 text-indigo-800">
                <Users className="h-6 w-6" />
                メンバー管理
              </CardTitle>
              <CardDescription className="text-indigo-700/70">
                組織メンバーの一覧と招待を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              {/* 開発中通知 - メンバー機能 */}
              <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <div className="flex">
                  <Clock className="h-5 w-5 text-slate-500 mr-3" />
                  <p className="text-sm text-slate-600">
                    メンバー招待機能は開発中のため、現在はデモ表示のみとなっています。
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3 text-slate-800">新規メンバーを招待</h3>
                <form onSubmit={inviteMember} className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      type="email"
                      placeholder="メールアドレスを入力"
                      value={inviteEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={true} // 開発中のため無効化
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={true} // 開発中のため無効化
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    招待
                  </Button>
                </form>
                <p className="text-xs text-slate-500 mt-2">
                  ※ 招待されたユーザーにはメールが送信されます
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-slate-800">メンバー一覧</h3>
                
                {members.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 font-medium">メンバーはまだいません</p>
                    <p className="text-slate-500 text-sm mt-1">
                      新しいメンバーを招待して組織を拡大しましょう
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            名前/メール
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            役職
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            部署
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            ステータス
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
                                  {(member.display_name || member.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">{member.display_name || '(未設定)'}</div>
                                  <div className="text-sm text-slate-500">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-sm text-slate-700">
                              {member.role || 'メンバー'}
                            </td>
                            <td className="py-3.5 px-4 text-sm text-slate-700">
                              {member.department || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                member.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : member.status === 'invited' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {member.status === 'active' 
                                  ? <CheckCircle className="w-3 h-3 mr-1" /> 
                                  : member.status === 'invited' 
                                  ? <Mail className="w-3 h-3 mr-1" /> 
                                  : <Info className="w-3 h-3 mr-1" />}
                                {member.status === 'active' ? '有効' : 
                                 member.status === 'invited' ? '招待中' : '無効'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {member.status !== 'invited' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={true} // 開発中のため無効化
                                  className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-800"
                                >
                                  {member.status === 'active' ? '無効化' : '有効化'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}