'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  Save, ArrowLeft, Star, Clock,
  Calendar, Eye, User, Info, Pencil, FileText,
  Book, MessageSquare, Tag, Link as LinkIcon,
  Loader2, AlertCircle, ChevronLeft, ExternalLink, 
  Globe, X, Folder,Check
} from 'lucide-react'
import Link from 'next/link'
import { isValidHttpUrl } from '../../../utils/urlChecker' // この関数は下記に定義

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

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  )
}

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
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

// URLのドメイン部分を取得する関数
const getDomainFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch (e) {
    return url
  }
}

// ファイル種類のアイコン
const getFileIcon = (url: string) => {
  if (!url) return <FileText className="w-5 h-5" />
  
  if (url.includes('docs.google.com') || url.includes('document')) {
    return <FileText className="w-5 h-5 text-blue-500" />
  } else if (url.includes('sheets.google.com') || url.includes('spreadsheets')) {
    return <FileText className="w-5 h-5 text-green-500" />
  } else if (url.includes('slides.google.com') || url.includes('presentation')) { 
    return <FileText className="w-5 h-5 text-amber-500" />
  } else if (url.includes('.pdf')) {
    return <FileText className="w-5 h-5 text-red-500" />
  } else if (url.includes('drive.google.com')) {
    return <FileText className="w-5 h-5 text-blue-500" />
  } else {
    return <Globe className="w-5 h-5 text-indigo-500" />
  }
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [isEditing, setIsEditing] = useState(documentId === 'new')
  const [document, setDocument] = useState({
    id: '',
    title: '',
    document_url: '', // URLを保存するフィールドに変更
    summary: '',
    category_id: '',
    category_name: '',
    status: 'draft',
    tags: [] as string[],
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '',
    creator_name: ''
  })
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [newTag, setNewTag] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  
  // 新規ページ用のタイトル
  const [title, setTitle] = useState('')
  // 新規ページ用のカテゴリ
  const [categoryId, setCategoryId] = useState('')
  // 新規ページ用のサマリー
  const [summary, setSummary] = useState('')
  // 新規ページ用のタグ
  const [tags, setTags] = useState<string[]>([])
  // 新規ページ用のURL
  const [documentUrl, setDocumentUrl] = useState('')
  // URL入力バリデーション
  const [urlError, setUrlError] = useState('')
  
  useEffect(() => {
    if (documentId === 'new') {
      setLoading(false)
      return
    }
    
    fetchDocumentData()
  }, [documentId])

  const fetchDocumentData = async () => {
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
      
      // ドキュメントが新規でない場合、データを取得
      if (documentId !== 'new') {
        // ドキュメント情報の取得 - Join せずに別々に取得する
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single()
          
        if (docError) {
          console.error('Document error:', docError)
          setError('ドキュメントが見つかりませんでした')
          setLoading(false)
          return
        }
        
        // カテゴリ名を取得
        let categoryName = ''
        if (doc.category_id) {
          const { data: categoryData } = await supabase
            .from('document_categories')
            .select('name')
            .eq('id', doc.category_id)
            .single()
            
          if (categoryData) {
            categoryName = categoryData.name
          }
        }
        
        // 作成者名を取得
        let creatorName = ''
        if (doc.created_by) {
          const { data: creatorData } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', doc.created_by)
            .single()
            
          if (creatorData) {
            creatorName = creatorData.display_name || ''
          }
        }
        
        const formattedDoc = {
          id: doc.id,
          title: doc.title,
          document_url: doc.document_url || '', // URLフィールドを追加
          summary: doc.summary || '',
          category_id: doc.category_id || '',
          category_name: categoryName,
          status: doc.status || 'draft',
          tags: doc.tags || [],
          view_count: doc.view_count || 0,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          created_by: doc.created_by,
          creator_name: creatorName
        }
        
        setDocument(formattedDoc)
        setIsPinned(doc.is_pinned || false)
        
        // 閲覧履歴を記録（実際の実装ではこれをAPIルートに移す）
        try {
          await supabase
            .from('document_views')
            .insert({
              document_id: documentId,
              user_id: user.id
            })
            
          // ビューカウントを増加
          await supabase
            .from('documents')
            .update({
              view_count: (doc.view_count || 0) + 1
            })
            .eq('id', documentId)
        } catch (e) {
          // ビューの記録に失敗しても続行
          console.warn('閲覧履歴の記録に失敗しました', e)
        }
      }
      
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError('ドキュメントの取得中にエラーが発生しました')
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

  const handleSave = async () => {
    // タイトル検証
    if (documentId === 'new' && !title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    
    if (documentId !== 'new' && !document.title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    
    // URL検証
    const urlToValidate = documentId === 'new' ? documentUrl : document.document_url
    if (!validateUrl(urlToValidate)) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !organizationId) {
        setError('ログイン情報または組織IDが見つかりません')
        return
      }
      
      if (documentId === 'new') {
        // 新規作成
        const { data: newDoc, error } = await supabase
          .from('documents')
          .insert({
            title: title,
            document_url: documentUrl, // URLを保存
            summary: summary,
            category_id: categoryId || null,
            tags: tags,
            organization_id: organizationId,
            created_by: user.id,
            updated_by: user.id,
            status: 'draft'
          })
          .select('id')
          .single()
        
        if (error) {
          throw new Error('ドキュメントの保存に失敗しました: ' + error.message)
        }
        
        alert('ドキュメントリンクを登録しました')
        router.push(`/documents/${newDoc.id}`)
      } else {
        // 更新
        const { error } = await supabase
          .from('documents')
          .update({
            title: document.title,
            document_url: document.document_url, // URLを更新
            summary: document.summary,
            category_id: document.category_id || null,
            tags: document.tags,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id)
          
        if (error) {
          throw new Error('ドキュメントの更新に失敗しました: ' + error.message)
        }
        
        alert('ドキュメント情報を保存しました')
        setIsEditing(false)
        fetchDocumentData()
      }
      
    } catch (error: any) {
      console.error('保存エラー:', error)
      setError(error.message || 'ドキュメントの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }
  
  const togglePin = async () => {
    try {
      const newPinState = !isPinned
      setIsPinned(newPinState)
      
      const { error } = await supabase
        .from('documents')
        .update({ is_pinned: newPinState })
        .eq('id', document.id)
        
      if (error) {
        throw new Error('ピン留め状態の更新に失敗しました')
      }
    } catch (err: any) {
      console.error('ピン留め更新エラー:', err)
      setIsPinned(!isPinned) // エラー時は元に戻す
      setError(err.message)
    }
  }
  
  const handleAddTag = () => {
    if (
      !newTag.trim() || 
      (documentId === 'new' ? tags.includes(newTag.trim()) : document.tags.includes(newTag.trim()))
    ) return
    
    if (documentId === 'new') {
      setTags([...tags, newTag.trim()])
    } else {
      setDocument({
        ...document,
        tags: [...document.tags, newTag.trim()]
      })
    }
    setNewTag('')
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    if (documentId === 'new') {
      setTags(tags.filter(tag => tag !== tagToRemove))
    } else {
      setDocument({
        ...document,
        tags: document.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-lg text-slate-700">ドキュメント情報を読み込み中...</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/documents" className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" />
          ドキュメント一覧へ戻る
        </Link>
        
        <div className="flex items-center gap-3">
          {documentId !== 'new' && !isEditing && (
            <>
              <Button 
                variant="outline"
                onClick={togglePin}
                className={isPinned ? 'text-amber-500' : ''}
              >
                <Star className={`w-4 h-4 mr-1.5 ${isPinned ? 'fill-current' : ''}`} />
                {isPinned ? 'ピン留め中' : 'ピン留め'}
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Pencil className="w-4 h-4 mr-1.5" />
                編集
              </Button>
            </>
          )}
          
          {(isEditing || documentId === 'new') && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {saving ? '保存中...' : '保存'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-3">
          {isEditing || documentId === 'new' ? (
            // 編集モード
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">タイトル *</label>
                <Input 
                  value={documentId === 'new' ? title : document.title}
                  onChange={(e) => documentId === 'new' 
                    ? setTitle(e.target.value)
                    : setDocument({...document, title: e.target.value})
                  }
                  placeholder="ドキュメントのタイトル"
                  className="text-lg font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ドキュメントのURL *</label>
                <div className="space-y-1">
                  <Input 
                    value={documentId === 'new' ? documentUrl : document.document_url}
                    onChange={(e) => {
                      const value = e.target.value
                      if (documentId === 'new') {
                        setDocumentUrl(value)
                        setUrlError('')
                      } else {
                        setDocument({...document, document_url: value})
                        setUrlError('')
                      }
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
                  value={documentId === 'new' ? summary : document.summary}
                  onChange={(e) => documentId === 'new'
                    ? setSummary(e.target.value)
                    : setDocument({...document, summary: e.target.value})
                  }
                  placeholder="ドキュメントの概要（省略可）"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                <select
                  value={documentId === 'new' ? categoryId : document.category_id}
                  onChange={(e) => documentId === 'new'
                    ? setCategoryId(e.target.value)
                    : setDocument({...document, category_id: e.target.value})
                  }
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
                  {(documentId === 'new' ? tags : document.tags).map((tag, i) => (
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
                  
                  {(documentId === 'new' ? tags.length === 0 : document.tags.length === 0) && (
                    <span className="text-sm text-slate-500 italic">タグはまだ追加されていません</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // 表示モード
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{document.title}</h1>
              
              {document.summary && (
                <p className="text-slate-600 text-lg mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {document.summary}
                </p>
              )}
              
              {/* 外部リンク表示 */}
              <Card className="mb-6">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                  <div className="flex items-center">
                    {getFileIcon(document.document_url)}
                    <span className="ml-2 text-slate-700 font-medium break-all">
                      {getDomainFromUrl(document.document_url)}
                    </span>
                  </div>
                  
                  <a 
                    href={document.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-md flex items-center transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    ドキュメントを開く
                  </a>
                </CardContent>
              </Card>
              
              {/* カテゴリ・タグ表示 */}
              <div className="mb-6 flex flex-wrap gap-2">
                {document.category_name && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-sm flex items-center">
                    <Folder className="w-4 h-4 mr-1.5" />
                    {document.category_name}
                  </span>
                )}
                
                {document.tags.map((tag, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* サイドバー - メタ情報 */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-slate-900 mb-4">ドキュメント情報</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-500">作成日</p>
                    <p className="text-slate-700">{formatDate(document.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-500">最終更新</p>
                    <p className="text-slate-700">{formatDate(document.updated_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-500">作成者</p>
                    <p className="text-slate-700">{document.creator_name || '不明'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <Eye className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-500">閲覧数</p>
                    <p className="text-slate-700">{document.view_count} 回</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}