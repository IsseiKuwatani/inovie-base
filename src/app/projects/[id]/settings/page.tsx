//
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  Settings,
  Users,
  User,
  Shield,
  UserPlus,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  ChevronDown,
  Info,
  Mail,
  User as UserIcon,
  Search,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'

type Member = {
    id: string;
    user_id: string;
    role: string;
    permissions: any;
    joined_at: string;
    user_profiles: {
      id: string;
      display_name: string | null;
      email: string;
      position?: string | null;
      department?: string | null;
    };
  }

type Project = {
  id: string
  name: string
  description: string | null
  status: string | null
  organization_id: string | null
  user_id: string
  created_at: string
}

type OrganizationUser = {
  id: string
  display_name: string | null
  email: string
  position?: string | null
  department?: string | null
}

export default function ProjectSettings() {
  const { id: projectId } = useParams() as { id: string }
  const router = useRouter()
  
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('member')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 編集フォームの状態
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedStatus, setEditedStatus] = useState('')
  
  // UI状態
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showMemberForm, setShowMemberForm] = useState(false)
  
  // 初期データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        // プロジェクト情報を取得
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        if (projectError) throw projectError
        
        setProject(projectData)
        setEditedName(projectData.name)
        setEditedDescription(projectData.description || '')
        setEditedStatus(projectData.status || '')
        
        console.log('Project data:', projectData)
        
        // プロジェクトメンバーを取得
        const { data: membersData, error: membersError } = await supabase
          .from('project_members')
          .select(`
            id,
            user_id,
            role,
            permissions,
            joined_at,
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
        
        if (membersError) throw membersError
        
        console.log('Raw members data:', membersData)
        
        // 型変換処理を修正 - user_profilesが配列でなく単一オブジェクトになるように
        const typedMembers: Member[] = membersData.map(member => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          permissions: member.permissions,
          joined_at: member.joined_at,
          user_profiles: Array.isArray(member.user_profiles)
            ? member.user_profiles[0] || {
                id: member.user_id,
                display_name: null,
                email: '',
                position: null,
                department: null
              }
            : member.user_profiles || {
                id: member.user_id,
                display_name: null,
                email: '',
                position: null,
                department: null
              }
        }))
        
        console.log('Typed members:', typedMembers)
        setMembers(typedMembers)
        
        // 組織のユーザーを取得
        if (projectData.organization_id) {
          const { data: orgUsersData, error: orgUsersError } = await supabase
            .from('user_profiles')
            .select('id, display_name, email, position, department')
            .eq('organization_id', projectData.organization_id)
          
          if (orgUsersError) throw orgUsersError
          
          console.log('Organization users:', orgUsersData)
          
          // すでにメンバーになっているユーザーを除外 (文字列に変換して比較)
          const memberIds = typedMembers.map(m => m.user_id.toString())
          const availableUsers = orgUsersData.filter(
            user => !memberIds.includes(user.id.toString())
          )
          
          console.log('Available users:', availableUsers)
          setOrganizationUsers(availableUsers)
        }
      } catch (err: any) {
        console.error('データ取得エラー:', err)
        setError('データの読み込みに失敗しました: ' + (err.message || err))
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [projectId])
  
  // プロジェクト情報の更新
  const updateProject = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      if (!editedName.trim()) {
        setError('プロジェクト名は必須です')
        return
      }
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: editedName,
          description: editedDescription || null,
          status: editedStatus || null
        })
        .eq('id', projectId)
        .select()
        .single()
      
      if (error) throw error
      
      setProject(data)
      setIsEditingProject(false)
      setSuccess('プロジェクト情報を更新しました')
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('更新エラー:', err)
      setError('更新に失敗しました: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }
  
 // メンバー追加
 const addMember = async () => {
  if (!selectedUserId) {
    setError('ユーザーを選択してください')
    return
  }
  
  try {
    setIsAddingMember(true)
    setError(null)
    
    const permissions = getRolePermissions(selectedRole)
    
    // 選択したユーザーの情報を保存
    const selectedUser = organizationUsers.find(user => user.id === selectedUserId)
    if (!selectedUser) {
      throw new Error('選択したユーザーの情報が見つかりません')
    }
    
    console.log('Adding member:', selectedUser)
    
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: selectedUserId,
        role: selectedRole,
        permissions,
        invited_by: currentUser?.id
      })
      .select(`
        id,
        user_id,
        role,
        permissions,
        joined_at
      `)
      .single()
    
    if (error) throw error
    
    console.log('Added member data from DB:', data)
    
    // データ型変換 - user_profilesを追加
    const newMember: Member = {
      id: data.id,
      user_id: data.user_id,
      role: data.role,
      permissions: data.permissions,
      joined_at: data.joined_at,
      user_profiles: {
        id: selectedUser.id,
        display_name: selectedUser.display_name,
        email: selectedUser.email,
        position: selectedUser.position || null,
        department: selectedUser.department || null
      }
    }
    
    // メンバー一覧を更新
    setMembers(prevMembers => [newMember, ...prevMembers])
    
    // 追加したユーザーを組織ユーザー一覧から削除
    setOrganizationUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUserId))
    
    // フォームをリセット
    setSelectedUserId(null)
    setSelectedRole('member')
    setShowMemberForm(false)
    setSuccess('メンバーを追加しました')
    
    // 3秒後に成功メッセージをクリア
    setTimeout(() => setSuccess(null), 3000)
  } catch (err: any) {
    console.error('メンバー追加エラー:', err)
    setError('メンバーの追加に失敗しました: ' + (err.message || err))
  } finally {
    setIsAddingMember(false)
  }
}
  
  // メンバー削除
  const removeMember = async (memberId: string, userId: string) => {
    // プロジェクトオーナーは削除不可
    if (project?.user_id === userId) {
      setError('プロジェクトオーナーは削除できません')
      return
    }
    
    // 自分自身を削除しようとしている場合は確認
    if (userId === currentUser?.id) {
      if (!confirm('自分自身をプロジェクトから削除しますか？削除後はこのプロジェクトにアクセスできなくなります。')) {
        return
      }
    }
    
    try {
      setError(null)
      
      // 削除対象メンバーの情報を事前に取得
      const memberToRemove = members.find(m => m.id === memberId)
      if (!memberToRemove) {
        throw new Error('指定されたメンバーが見つかりません')
      }
      
      console.log('Removing member:', memberToRemove)
      
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)
      
      if (error) throw error
      
      // メンバー一覧から削除
      setMembers(prevMembers => prevMembers.filter(m => m.id !== memberId))
      
      // 削除したユーザーの情報を整形して組織ユーザー一覧に戻す
      if (memberToRemove.user_profiles) {
        const userToAdd = {
          id: memberToRemove.user_id,
          display_name: memberToRemove.user_profiles.display_name,
          email: memberToRemove.user_profiles.email,
          position: memberToRemove.user_profiles.position,
          department: memberToRemove.user_profiles.department
        }
        
        console.log('Adding back to organization users:', userToAdd)
        setOrganizationUsers(prevUsers => [...prevUsers, userToAdd])
      }
      
      setSuccess('メンバーを削除しました')
      
      // 自分自身を削除した場合はプロジェクト一覧に戻る
      if (userId === currentUser?.id) {
        router.push('/projects')
      }
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('メンバー削除エラー:', err)
      setError('メンバーの削除に失敗しました: ' + (err.message || err))
    }
  }
  
  // メンバーの権限更新
  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      setError(null)
      
      const permissions = getRolePermissions(newRole)
      
      const { error } = await supabase
        .from('project_members')
        .update({
          role: newRole,
          permissions
        })
        .eq('id', memberId)
      
      if (error) throw error
      
      // メンバー一覧を更新
      setMembers(members.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            role: newRole,
            permissions
          }
        }
        return member
      }))
      
      setSuccess('メンバーの権限を更新しました')
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('権限更新エラー:', err)
      setError('権限の更新に失敗しました: ' + (err.message || err))
    }
  }
  
  // 権限レベルに応じた権限オブジェクトを取得
  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return { edit: true, view: true, admin: true, delete: false }
      case 'editor':
        return { edit: true, view: true, admin: false, delete: false }
      case 'viewer':
        return { edit: false, view: true, admin: false, delete: false }
      default:
        return { edit: true, view: true, admin: false, delete: false }
    }
  }
  
  // 権限レベルのラベルを取得
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者'
      case 'editor': return '編集者'
      case 'viewer': return '閲覧者'
      default: return 'メンバー'
    }
  }
  
  // 権限レベルに応じたバッジのクラスを取得
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-violet-100 text-violet-700'
      case 'editor': return 'bg-blue-100 text-blue-700'
      case 'viewer': return 'bg-slate-100 text-slate-700'
      default: return 'bg-indigo-100 text-indigo-700'
    }
  }
  
  // プロジェクトステータスのラベルを取得
  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case '未着手': return { label: '未着手', class: 'bg-slate-100 text-slate-700' }
      case '進行中': return { label: '進行中', class: 'bg-amber-100 text-amber-700' }
      case '完了': return { label: '完了', class: 'bg-emerald-100 text-emerald-700' }
      case '中止': return { label: '中止', class: 'bg-rose-100 text-rose-700' }
      default: return { label: '未設定', class: 'bg-slate-100 text-slate-700' }
    }
  }
  
  // 検索条件にマッチするユーザーをフィルタリング
  const filteredUsers = organizationUsers.filter(user => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      (user.display_name && user.display_name.toLowerCase().includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.position && user.position.toLowerCase().includes(searchTermLower)) ||
      (user.department && user.department.toLowerCase().includes(searchTermLower))
    )
  })
  
  // プロジェクトオーナーかどうか
  const isProjectOwner = project?.user_id === currentUser?.id
  
  // プロジェクト管理者かどうか
  const isProjectAdmin = members.some(
    m => m.user_id === currentUser?.id && (m.role === 'admin' || m.permissions?.admin)
  )
  
  // 管理権限があるかどうか（オーナーまたは管理者）
  const hasAdminPermission = isProjectOwner || isProjectAdmin
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-semibold">プロジェクトが見つかりません</h2>
              <p className="mt-1">プロジェクトが削除されたか、アクセス権がありません。</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
            >
              プロジェクト一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ヘッダー */}
      <header className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            プロジェクト設定
          </h1>
        </div>
        <p className="text-slate-600 mt-2">
          プロジェクトの基本情報やメンバー権限を管理します
        </p>
      </header>
      
      {/* 通知メッセージ */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg">
          <div className="flex">
            <AlertCircle className="text-rose-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-rose-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg">
          <div className="flex">
            <CheckCircle className="text-emerald-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-emerald-700">{success}</p>
          </div>
        </div>
      )}
      
      {/* プロジェクト基本情報 */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">プロジェクト基本情報</h2>
          
          {hasAdminPermission && !isEditingProject && (
            <button
              onClick={() => setIsEditingProject(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit size={16} />
              編集
            </button>
          )}
          
          {isEditingProject && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingProject(false)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={16} />
                キャンセル
              </button>
              
              <button
                onClick={updateProject}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {isEditingProject ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 mb-1">
                  プロジェクト名 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="プロジェクト名"
                />
              </div>
              
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-slate-700 mb-1">
                  説明
                </label>
                <textarea
                  id="project-description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  placeholder="プロジェクトの説明（任意）"
                />
              </div>
              
              <div>
                <label htmlFor="project-status" className="block text-sm font-medium text-slate-700 mb-1">
                  ステータス
                </label>
                <select
                  id="project-status"
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">ステータスを選択</option>
                  <option value="未着手">未着手</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                  <option value="中止">中止</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500">プロジェクト名</h3>
                <p className="mt-1 text-lg font-medium text-slate-900">{project.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500">説明</h3>
                <p className="mt-1 text-slate-700">
                  {project.description || <span className="text-slate-400 italic">説明はありません</span>}
                </p>
              </div>
              
              <div className="flex gap-8">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">ステータス</h3>
                  <div className="mt-1">
                    {project.status ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusLabel(project.status).class}`}>
                        {getStatusLabel(project.status).label}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">未設定</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500">作成日</h3>
                  <p className="mt-1 text-slate-700">
                    {new Date(project.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500">オーナー</h3>
                  <p className="mt-1 text-slate-700">
                    {isProjectOwner ? (
                      <span className="inline-flex items-center gap-1 text-indigo-600">
                        <Shield size={14} className="text-indigo-500" />
                        あなた
                      </span>
                    ) : (
                      <span>別のユーザー</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* メンバー管理 */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            プロジェクトメンバー
            <span className="text-sm font-normal text-slate-500">
              ({members.length}人)
            </span>
          </h2>
          
          {hasAdminPermission && (
            <button
              onClick={() => setShowMemberForm(!showMemberForm)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                showMemberForm
                  ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {showMemberForm ? (
                <>
                  <X size={16} />
                  キャンセル
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  メンバーを追加
                </>
              )}
            </button>
          )}
        </div>
        
        {/* メンバー追加フォーム */}
        {showMemberForm && (
          <div className="p-6 bg-indigo-50 border-b border-indigo-100">
            <h3 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-indigo-600" />
              新しいメンバーを追加
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="search-user" className="block text-sm font-medium text-slate-700 mb-1">
                  ユーザーを検索
                </label>
                <div className="relative">
                  <input
                    id="search-user"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="名前、メール、部署などで検索..."
                    className="w-full pl-10 pr-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-indigo-400" size={18} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ユーザーを選択
                </label>
                <div className="max-h-60 overflow-y-auto border border-indigo-200 rounded-lg bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      {searchTerm ? '該当するユーザーが見つかりません' : '追加可能なユーザーがいません'}
                    </div>
                  ) : (
                    <ul className="divide-y divide-indigo-100">
                      {filteredUsers.map((user) => (
                        <li key={user.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                              selectedUserId === user.id ? 'bg-indigo-100' : ''
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="text-indigo-600" size={20} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {user.display_name || '（名前なし）'}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Mail size={12} />
                                {user.email}
                              </div>
                              {(user.position || user.department) && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {user.position && <span>{user.position}</span>}
                                  {user.position && user.department && <span> / </span>}
                                  {user.department && <span>{user.department}</span>}
                                </div>
                              )}
                            </div>
                            {selectedUserId === user.id && (
                              <CheckCircle className="ml-auto text-indigo-600" size={18} />
                            )}
                          </button>
                        </li>
                      ))}
                       </ul>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="member-role" className="block text-sm font-medium text-slate-700 mb-1">
                  権限
                </label>
                <select
                  id="member-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="admin">管理者 - プロジェクトの編集・メンバー管理が可能</option>
                  <option value="editor">編集者 - プロジェクトの編集のみ可能</option>
                  <option value="viewer">閲覧者 - 閲覧のみ可能</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={addMember}
                  disabled={!selectedUserId || isAddingMember}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingMember ? (
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
          </div>
        )}
        
        {/* メンバーリスト */}
        <div className="p-6">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-700">メンバーがいません</h3>
              <p className="mt-1 text-slate-500 max-w-md mx-auto">
                まだメンバーが追加されていません。「メンバーを追加」ボタンからプロジェクトメンバーを招待しましょう。
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((member) => {
                const isOwner = project.user_id === member.user_id
                const isCurrentUser = currentUser?.id === member.user_id
                
                return (
                  <li key={member.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {member.user_profiles?.display_name || member.user_profiles?.email || '（不明なユーザー）'}
                            {isOwner && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <Shield size={12} className="mr-1" />
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
                            {member.user_profiles?.email}
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
                          
                          {!isOwner && hasAdminPermission && (
                            <select
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-full px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                              <option value="admin">管理者</option>
                              <option value="editor">編集者</option>
                              <option value="viewer">閲覧者</option>
                            </select>
                          )}
                        </div>
                        
                        {!isOwner && hasAdminPermission && (
                          <button
                            onClick={() => removeMember(member.id, member.user_id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
                            title="メンバーを削除"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      
      {/* その他の設定セクション */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Info className="text-indigo-600" size={20} />
            その他の設定
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {/* 危険な操作 */}
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-lg font-medium text-rose-700 mb-2">危険な操作</h3>
              <p className="text-rose-600 text-sm mb-4">
                以下の操作は取り消すことができません。十分に注意して実行してください。
              </p>
              
              {isProjectOwner && (
                <button
                  onClick={() => {
                    if (confirm('本当にこのプロジェクトを削除しますか？この操作は取り消せません。')) {
                      // プロジェクト削除処理
                      alert('プロジェクト削除機能は実装中です。')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={16} />
                  プロジェクトを削除
                </button>
              )}
              
              {!isProjectOwner && (
                <button
                  onClick={() => {
                    if (confirm('本当にこのプロジェクトから脱退しますか？再度参加するには招待が必要です。')) {
                      // 自分自身のメンバーエントリを見つける
                      const myMembership = members.find(m => m.user_id === currentUser?.id)
                      if (myMembership) {
                        removeMember(myMembership.id, myMembership.user_id)
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={16} />
                  プロジェクトから脱退
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}