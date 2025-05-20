'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Folder, Plus, Edit, Trash2, Save, X,
  AlertCircle, Loader2, Info, ArrowLeft, Check
} from 'lucide-react'
import Link from 'next/link'

type Category = {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
  is_archived: boolean
  document_count?: number
}

// シンプルなUIコンポーネント
const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "default", 
  className = "" 
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "outline" | "ghost" | "danger"
  className?: string
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
  
  const variantStyles = {
    default: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-4 py-2",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2",
    ghost: "bg-transparent text-slate-800 hover:bg-slate-100 px-3 py-1.5",
    danger: "bg-red-500 hover:bg-red-600 text-white px-4 py-2"
  }
  
  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

const Input = ({ 
  value, 
  onChange, 
  placeholder = "", 
  className = "" 
}: { 
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
    />
  )
}

const Textarea = ({ 
  value, 
  onChange, 
  placeholder = "", 
  rows = 2, 
  className = "" 
}: { 
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  className?: string
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y ${className}`}
    />
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  
  // 新規カテゴリ追加関連
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [isSaving, setIsSaving] = useState(false)
  
  // カテゴリ編集関連
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')
  
  // カラーパレット
  const colorOptions = [
    '#6366f1', // インディゴ
    '#8b5cf6', // バイオレット
    '#ec4899', // ピンク
    '#ef4444', // レッド
    '#f59e0b', // アンバー
    '#10b981', // エメラルド
    '#3b82f6', // ブルー
    '#6b7280', // グレー
  ]
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('ログインが必要です')
        setLoading(false)
        return
      }
      
      // ユーザープロファイルから組織IDを取得
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
        
      if (profileError || !profile?.organization_id) {
        setError('組織情報が見つかりません')
        setLoading(false)
        return
      }
      
      setOrganizationId(profile.organization_id)
      
      // カテゴリ一覧を取得
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('document_categories')
        .select(`
          id, 
          name, 
          description,
          color,
          icon,
          sort_order,
          is_archived
        `)
        .eq('organization_id', profile.organization_id)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      
      if (categoriesError) {
        console.error('カテゴリ取得エラー:', categoriesError)
        setError('カテゴリの読み込みに失敗しました')
        setLoading(false)
        return
      }
      
      // 各カテゴリのドキュメント数をカウント
      const enrichedCategories = await Promise.all((categoriesData || []).map(async (category) => {
        const { count, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('category_id', category.id)
        .eq('is_archived', false)
        
        return {
          ...category,
          document_count: count || 0
        }
      }))
      
      setCategories(enrichedCategories)
      
    } catch (err) {
      console.error('カテゴリ取得エラー:', err)
      setError('データの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddCategory = async () => {
    if (!newName.trim()) {
      setError('カテゴリ名を入力してください')
      return
    }
    
    if (!organizationId) {
      setError('組織IDが取得できません')
      return
    }
    
    try {
      setIsSaving(true)
      setError(null)
      
      // 並び順の最大値を取得
      let maxSortOrder = 0
      if (categories.length > 0) {
        const sortOrders = categories
          .map(cat => cat.sort_order || 0)
          .filter(order => !isNaN(order))
        
        if (sortOrders.length > 0) {
          maxSortOrder = Math.max(...sortOrders)
        }
      }
      
      const { data, error } = await supabase
        .from('document_categories')
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || null,
          color: newColor,
          organization_id: organizationId,
          sort_order: maxSortOrder + 10, // 間を空けて追加
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
      
      if (error) {
        throw new Error('カテゴリの追加に失敗しました: ' + error.message)
      }
      
      // 状態をリセットして一覧を再取得
      setNewName('')
      setNewDescription('')
      setNewColor('#6366f1')
      setIsAdding(false)
      await fetchCategories()
      
    } catch (err: any) {
      console.error('カテゴリ追加エラー:', err)
      setError(err.message || 'カテゴリの追加に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }
  
  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditDescription(category.description || '')
    setEditColor(category.color || '#6366f1')
  }
  
  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setEditColor('')
  }
  
  const handleUpdateCategory = async (categoryId: string) => {
    if (!editName.trim()) {
      setError('カテゴリ名を入力してください')
      return
    }
    
    try {
      setIsSaving(true)
      setError(null)
      
      const { error } = await supabase
        .from('document_categories')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          color: editColor,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
      
      if (error) {
        throw new Error('カテゴリの更新に失敗しました: ' + error.message)
      }
      
      // 編集状態をリセットして一覧を再取得
      cancelEditing()
      await fetchCategories()
      
    } catch (err: any) {
      console.error('カテゴリ更新エラー:', err)
      setError(err.message || 'カテゴリの更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeleteCategory = async (categoryId: string) => {
    // 確認ダイアログ
    if (!confirm('このカテゴリを削除してもよろしいですか？\n関連するドキュメントのカテゴリは未設定になります。')) {
      return
    }
    
    try {
      setError(null)
      
      // 論理削除（is_archived フラグを立てる）
      const { error } = await supabase
        .from('document_categories')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
      
      if (error) {
        throw new Error('カテゴリの削除に失敗しました: ' + error.message)
      }
      
      // 関連するドキュメントのカテゴリIDをnullに設定
      await supabase
        .from('documents')
        .update({ category_id: null })
        .eq('category_id', categoryId)
      
      // 一覧を再取得
      await fetchCategories()
      
    } catch (err: any) {
      console.error('カテゴリ削除エラー:', err)
      setError(err.message || 'カテゴリの削除に失敗しました')
    }
  }
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/documents" className="flex items-center text-slate-600 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-5 h-5 mr-1" />
          ドキュメント一覧に戻る
        </Link>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          ドキュメントカテゴリ管理
        </h1>
        <p className="text-slate-500 mt-1">
          カテゴリを作成・編集・削除して、ドキュメント分類を管理します
        </p>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* 開発中通知 */}
      <div className="mb-8 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
        <div className="flex">
          <Info className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">機能開発中のお知らせ</h3>
            <p className="text-sm text-amber-700 mt-1">
              ドキュメントカテゴリ管理機能は現在開発中です。カテゴリを作成して、リンク文書の分類整理にお役立てください。
            </p>
          </div>
        </div>
      </div>
      
      {/* カテゴリ追加ボタン */}
      {!isAdding && (
        <div className="mb-6">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            カテゴリを追加
          </Button>
        </div>
      )}
      
      {/* 新規カテゴリ追加フォーム */}
      {isAdding && (
        <div className="mb-8 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">新しいカテゴリを追加</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                カテゴリ名 *
              </label>
              <Input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="カテゴリ名を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                説明（省略可）
              </label>
              <Textarea 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="カテゴリの説明"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                カラー
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newColor === color ? 'border-slate-800' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button onClick={handleAddCategory} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </div>
      )}
      
      {/* カテゴリ一覧 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {categories.length === 0 ? (
            <div className="py-12 text-center">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">カテゴリがまだありません</p>
              {!isAdding && (
                <Button 
                  onClick={() => setIsAdding(true)} 
                  variant="ghost"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  カテゴリを追加
                </Button>
              )}
            </div>
          ) : (
            categories.map(category => (
              <div 
                key={category.id} 
                className={`p-4 ${editingId === category.id ? 'bg-indigo-50' : ''}`}
              >
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="font-medium"
                    />
                    
                    <Textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="説明（省略可）"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 ${
                            editColor === color ? 'border-slate-800' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Button 
                        onClick={() => handleUpdateCategory(category.id)}
                        className="text-sm px-3 py-1"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            更新中
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            更新
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={cancelEditing}
                        className="text-sm px-3 py-1"
                        disabled={isSaving}
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-full" 
                        style={{ backgroundColor: category.color || '#6366f1' }}
                      />
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {category.document_count} 件
                      </span>
                      
                      <Button 
                        variant="ghost" 
                        className="p-1.5"
                        onClick={() => startEditing(category)}
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="p-1.5"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}