'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Users, UserPlus, ArrowLeft, Search, 
  Loader2, Shield, ShieldCheck, UserX, 
  User, UserCircle, Mail, X, Check, AlertCircle
} from 'lucide-react'

export default function ProjectMembers() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingMember, setAddingMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [userRole, setUserRole] = useState('member')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        // プロジェクト情報を取得
        const { data: projectData } = await supabase
          .from('projects')
          .select('*, organizations(name)')
          .eq('id', projectId)
          .single()
        
        setProject(projectData)
        
        // プロジェクトの組織IDを取得
        const organizationId = projectData?.organization_id
        
        if (organizationId) {
          // メンバー情報を取得（ユーザープロファイル情報を含む）
          const { data: membersData } = await supabase
            .from('project_members')
            .select(`
              id,
              role,
              permissions,
              joined_at,
              user_id,
              user_profiles:user_id (
                id,
                display_name,
                email,
                position,
                department
              )
            `)
            .eq('project_id', projectId)
            .order('joined_at', { ascending: false })
          
          // 組織に所属するユーザーを取得
          const { data: usersData } = await supabase
            .from('user_profiles')
            .select(`
              id,
              display_name,
              email,
              position,
              department
            `)
            .eq('organization_id', organizationId)
          
          // すでにプロジェクトメンバーになっているユーザーを除外
          const memberIds = membersData?.map(m => m.user_id) || []
          const availableUsers = usersData?.filter(user => !memberIds.includes(user.id)) || []
          
          setMembers(membersData || [])
          setOrganizationUsers(availableUsers || [])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('データ取得エラー:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [projectId])
  
  const addProjectMember = async () => {
    if (!selectedUser) return
    
    setAddingMember(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: selectedUser,
          role: userRole,
          permissions: getPermissionsByRole(userRole),
          invited_by: currentUser?.id
        })
        .select(`
          id,
          role,
          permissions,
          joined_at,
          user_id,
          user_profiles:user_id (
            id,
            display_name,
            email,
            position,
            department
          )
        `)
      
      if (error) throw error
      
      // 追加したユーザーを組織ユーザーリストから削除
      const addedUser = organizationUsers.find(user => user.id === selectedUser)
      setOrganizationUsers(organizationUsers.filter(user => user.id !== selectedUser))
      
      // メンバーリストを更新
      setMembers([data[0], ...members])
      
      // フォームをリセット
      setSelectedUser(null)
      setUserRole('member')
      setShowAddForm(false)
    } catch (error: any) {
      console.error('メンバー追加エラー:', error)
      setError(error.message || 'メンバーの追加中にエラーが発生しました')
    } finally {
      setAddingMember(false)
    }
  }
  
  const removeProjectMember = async (memberId: string, userId: string) => {
    try {
      // プロジェクトオーナーは削除不可（オーナーかどうかチェック）
      const isOwner = project?.user_id === userId
      if (isOwner) {
        setError('プロジェクトオーナーはメンバーから削除できません')
        return
      }
      
      // 自分自身を削除しようとしている場合は確認
      if (userId === currentUser?.id) {
        if (!confirm('自分自身をプロジェクトから削除しますか？削除後はこのプロジェクトにアクセスできなくなります。')) {
          return
        }
      }
      
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)
      
      if (error) throw error
      
      // 削除したメンバーの情報を取得
      const removedMember = members.find(m => m.id === memberId)
      
      // メンバーリストを更新
      setMembers(members.filter(m => m.id !== memberId))
      
      // 削除したユーザーを組織ユーザーリストに戻す（存在する場合）
      if (removedMember?.user_profiles) {
        setOrganizationUsers([...organizationUsers, removedMember.user_profiles])
      }
      
      // 自分自身を削除した場合はプロジェクト一覧に戻る
      if (userId === currentUser?.id) {
        router.push('/projects')
      }
    } catch (error: any) {
      console.error('メンバー削除エラー:', error)
      setError(error.message || 'メンバーの削除中にエラーが発生しました')
    }
  }
  
  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({
          role: newRole,
          permissions: getPermissionsByRole(newRole)
        })
        .eq('id', memberId)
      
      if (error) throw error
      
      // メンバーリストを更新
      setMembers(members.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            role: newRole,
            permissions: getPermissionsByRole(newRole)
          }
        }
        return member
      }))
    } catch (error: any) {
      console.error('メンバー更新エラー:', error)
      setError(error.message || 'メンバーの更新中にエラーが発生しました')
    }
  }
  
  const getPermissionsByRole = (role: string) => {
    switch (role) {
      case 'admin':
        return { edit: true, view: true, admin: true, delete: true }
      case 'editor':
        return { edit: true, view: true, admin: false, delete: false }
      case 'viewer':
        return { edit: false, view: true, admin: false, delete: false }
      default:
        return { edit: true, view: true, admin: false, delete: false }
    }
  }
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者'
      case 'editor': return '編集者'
      case 'viewer': return '閲覧者'
      default: return 'メンバー'
    }
  }
  
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-violet-100 text-violet-700'
      case 'editor': return 'bg-blue-100 text-blue-700'
      case 'viewer': return 'bg-slate-100 text-slate-700'
      default: return 'bg-indigo-100 text-indigo-700'
    }
  }
  
  const filteredUsers = organizationUsers.filter(user => 
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500">読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 text-center">
          <h2 className="text-xl font-semibold mb-2">プロジェクトが見つかりません</h2>
          <p className="text-sm">プロジェクトが削除されたか、アクセス権がありません</p>
          <Link href="/projects" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ヘッダー */}
      <header className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/projects/${projectId}`}
                className="text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                メンバー管理
              </h1>
            </div>
            <p className="text-slate-600 mt-2">
              プロジェクト「{project.name}」のメンバー設定
            </p>
            <p className="text-sm text-slate-400 mt-1">
              組織：{project.organizations?.name || '（組織なし）'}
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shadow-sm text-sm ${
              showAddForm 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-md hover:translate-y-[-1px]'
            }`}
          >
            {showAddForm ? <X size={16} /> : <UserPlus size={16} />}
            {showAddForm ? 'キャンセル' : 'メンバーを追加'}
          </button>
        </div>
      </header>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 flex items-start gap-3">
          <AlertCircle className="mt-0.5" size={18} />
          <div>
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {/* メンバー追加フォーム */}
      {showAddForm && (
        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-indigo-800">
            <UserPlus size={20} className="text-indigo-600" />
            <h2 className="text-xl font-semibold">新しいメンバーを追加</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
                ユーザーを検索
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="名前、メール、部署などで検索..."
                  className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ユーザーを選択
              </label>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    {searchTerm ? '該当するユーザーが見つかりません' : 'ユーザーがいません'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user.id)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                            selectedUser === user.id ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserCircle className="text-indigo-600" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {user.display_name || '（名前なし）'}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Mail size={12} />
                              {user.email || '（メールなし）'}
                            </div>
                            {(user.position || user.department) && (
                              <div className="text-xs text-slate-500 mt-1">
                                {user.position && <span>{user.position}</span>}
                                {user.position && user.department && <span> / </span>}
                                {user.department && <span>{user.department}</span>}
                              </div>
                            )}
                          </div>
                          {selectedUser === user.id && (
                            <Check className="ml-auto text-indigo-600" size={18} />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                権限
              </label>
              <select
                id="role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="admin">管理者 - プロジェクトの編集・メンバー管理が可能</option>
                <option value="editor">編集者 - プロジェクトの編集のみ可能</option>
                <option value="viewer">閲覧者 - 閲覧のみ可能</option>
              </select>
            </div>
            
            <div className="pt-2">
              <button
                onClick={addProjectMember}
                disabled={!selectedUser || addingMember}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingMember ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    追加中...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    メンバーを追加
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}
      
      {/* メンバーリスト */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Users size={20} className="text-indigo-600" />
          <h2 className="text-xl font-semibold">プロジェクトメンバー</h2>
          <span className="text-sm text-slate-500 ml-2">（{members.length}人）</span>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
            <Users className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-700">メンバーがいません</h3>
            <p className="mt-2 text-slate-500">「メンバーを追加」ボタンから新しいメンバーを追加しましょう</p>
          </div>
        ) : (
          <ul className="grid gap-4">
            {members.map((member) => {
              const isOwner = project.user_id === member.user_id
              const isCurrentUser = currentUser?.id === member.user_id
              
              return (
                <li key={member.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserCircle className="text-indigo-600" size={24} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {member.user_profiles?.display_name || '（名前なし）'}
                            {isOwner && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <ShieldCheck size={12} className="mr-1" />
                                オーナー
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                あなた
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Mail size={12} />
                            {member.user_profiles?.email || '（メールなし）'}
                          </div>
                          {(member.user_profiles?.position || member.user_profiles?.department) && (
                            <div className="text-xs text-slate-500 mt-1">
                              {member.user_profiles?.position && <span>{member.user_profiles.position}</span>}
                              {member.user_profiles?.position && member.user_profiles?.department && <span> / </span>}
                              {member.user_profiles?.department && <span>{member.user_profiles.department}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${getRoleBadgeClass(member.role)}`}>
                          {isOwner ? (
                            <Shield size={12} className="mr-1" />
                          ) : (
                            <User size={12} className="mr-1" />
                          )}
                          {getRoleLabel(member.role)}
                        </span>
                        
                        {!isOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="admin">管理者</option>
                            <option value="editor">編集者</option>
                            <option value="viewer">閲覧者</option>
                          </select>
                        )}
                      </div>
                      
                      {!isOwner && (
                        <button
                          onClick={() => removeProjectMember(member.id, member.user_id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
                          title="メンバーを削除"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
