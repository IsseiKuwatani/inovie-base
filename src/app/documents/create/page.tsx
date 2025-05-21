'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  Save, ChevronLeft, Info, Loader2, 
  X, AlertCircle, Folder
} from 'lucide-react'
import Link from 'next/link'

// URLチェッカーユーティリティ（インライン実装）
const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

// UI コンポーネント
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
  variant?: "default" | "outline" | "ghost"
  className?: string
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
  
  const variantStyles = {
    default: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-4 py-2",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2",
    ghost: "bg-transparent text-slate-800 hover:bg-slate-100 px-3 py-1.5"
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
  rows = 4, 
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

export default function CreateDocumentPage() {
  const router = useRouter()
  
  // 状態管理
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  
  // フォームフィールド
  const [title, setTitle] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [urlError, setUrlError] = useState('')
  
  useEffect(() => {
    fetchInitialData()
  }, [])
  
  const fetchInitialData = async () => {
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
      
      // カテゴリ取得
      const { data: categoriesData } = await supabase
        .from('document_categories')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_archived', false)
        .order('name')
      
      setCategories(categoriesData || [])
      
    } catch (err) {
      console.error('初期データ取得エラー:', err)
      setError('データの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setUrlError('URLを入力してください')
      return false
    }

    if (!isValidHttpUrl(url)) {
      setUrlError('有効なURLを入力してください (例: https://example.com)')
      return false
    }

    setUrlError('')
    return true
  }
  
  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return
    
    setTags([...tags, newTag.trim()])
    setNewTag('')
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  const handleSave = async () => {
    // バリデーション
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    
    if (!validateUrl(documentUrl)) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      // ユーザー情報取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !organizationId) {
        setError('ログイン情報または組織IDが見つかりません')
        return
      }
      
      // 新規ドキュメント作成
      const { data: newDoc, error } = await supabase
        .from('documents')
        .insert({
          title: title.trim(),
          document_url: documentUrl.trim(),
          summary: summary.trim() || null,
          category_id: categoryId || null,
          tags: tags.length > 0 ? tags : null,
          organization_id: organizationId,
          created_by: user.id,
          updated_by: user.id,
          status: 'draft'
        })
        .select()
        .single()
      
      if (error) {
        throw new Error('ドキュメントの保存に失敗しました: ' + error.message)
      }
      
      // 成功したら詳細ページに遷移
      alert('ドキュメントリンクを登録しました')
      router.push(`/documents/${newDoc.id}`)
      
    } catch (err: any) {
      console.error('保存エラー:', err)
      setError(err.message || 'ドキュメントの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-lg text-slate-700">読み込み中...</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 開発中通知 */}
      <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
        <div className="flex">
          <Info className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">機能開発中のお知らせ</h3>
            <p className="text-sm text-amber-700 mt-1">
              ドキュメント管理機能は現在開発中です。外部サービス上のドキュメント・PDF へのリンクを登録して管理することができます。
            </p>
          </div>
        </div>
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

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/documents" className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          ドキュメント一覧へ戻る
        </Link>
        
        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">リンク文書の新規登録</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">タイトル *</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ドキュメントのタイトル"
              className="text-lg font-medium"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ドキュメントのURL *</label>
            <div className="space-y-1">
              <Input 
                value={documentUrl}
                onChange={(e) => {
                  setDocumentUrl(e.target.value)
                  setUrlError('')
                }}
                placeholder="https://例えば Google Drive や Dropbox のリンクを入力"
                className={urlError ? "border-red-300" : ""}
              />
              {urlError && (
                <p className="text-red-500 text-xs">{urlError}</p>
              )}
              <p className="text-xs text-slate-500">
                Google Drive、Google Docs、Microsoft OneDrive、Dropbox、PDFへのリンクなど
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">サマリー</label>
            <Textarea 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="ドキュメントの概要（省略可）"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            >
              <option value="">カテゴリなし</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">タグ</label>
            <div className="flex gap-2">
              <Input 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="新しいタグを追加"
                className="flex-1"
              />
              <Button 
                onClick={handleAddTag}
                variant="outline"
              >
                追加
              </Button>
            </div>
            
            {/* タグ表示 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, i) => (
                <div key={i} className="bg-slate-100 text-slate-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  #{tag}
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(tag)} 
                    className="ml-1 text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {tags.length === 0 && (
                <span className="text-sm text-slate-500 italic">タグはまだ追加されていません</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
