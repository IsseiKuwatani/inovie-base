'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Book, Search, Plus, File, Folder, Clock, Star, 
  AlertCircle, Filter, ArrowUpRight, Link as LinkIcon, 
  PlusCircle, Loader2, Info, FileText, 
  FolderPlus, Tag, BookOpen, Calendar, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

type Category = {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  document_count?: number
}

type Document = {
  id: string
  title: string
  summary?: string
  status: string
  is_pinned: boolean
  category_id?: string
  category_name?: string
  document_url: string
  created_at: string
  updated_at: string
  created_by: string
  creator_name?: string
  view_count: number
  tags: string[]
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pinnedDocuments, setPinnedDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  
  // スケルトンローダー
  const skeletonItems = Array(3).fill(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
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
      
      // データベースにテーブルがない場合はエラーハンドリング
      try {
        // カテゴリ情報の取得
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('document_categories')
          .select(`
            id, 
            name, 
            description,
            icon,
            color
          `)
          .eq('organization_id', profile.organization_id)
          .eq('is_archived', false)
          .order('sort_order', { ascending: true })
        
        if (categoriesError) {
          console.error('Categories error:', categoriesError)
          // テーブルがない場合はエラーをクリアして空の配列を表示
          setCategories([])
        } else {
          setCategories(categoriesData || [])
        }
        
        // ピン留めドキュメントの取得 - JOIN なしバージョン
        const { data: pinnedDocs, error: pinnedError } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            summary,
            status,
            is_pinned,
            category_id,
            document_url,
            created_at,
            updated_at,
            created_by,
            view_count,
            tags
          `)
          .eq('organization_id', profile.organization_id)
          .eq('is_pinned', true)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(5)
        
        if (pinnedError) {
          console.error('Pinned documents error:', pinnedError)
          // テーブルがない場合はエラーをクリアして空の配列を表示
          setPinnedDocuments([])
        } else {
          // 関連するカテゴリと作成者情報を取得
          let formattedPinned: Document[] = [];
          
          if (pinnedDocs && pinnedDocs.length > 0) {
            // カテゴリIDと作成者IDを収集
            const categoryIds = pinnedDocs
              .map(doc => doc.category_id)
              .filter(id => id !== null && id !== undefined) as string[];
              
            const creatorIds = pinnedDocs
              .map(doc => doc.created_by)
              .filter(id => id !== null && id !== undefined) as string[];
              
            // カテゴリ情報のマップを作成
            let categoryMap: Record<string, { name: string, color: string }> = {};
            
            if (categoryIds.length > 0) {
              const { data: categoryDetails } = await supabase
                .from('document_categories')
                .select('id, name, color')
                .in('id', categoryIds);
                
              if (categoryDetails) {
                categoryMap = categoryDetails.reduce((acc, cat) => {
                  acc[cat.id] = { name: cat.name, color: cat.color };
                  return acc;
                }, {} as Record<string, { name: string, color: string }>);
              }
            }
            
            // 作成者情報のマップを作成
            let creatorMap: Record<string, string> = {};
            
            if (creatorIds.length > 0) {
              const { data: creatorDetails } = await supabase
                .from('user_profiles')
                .select('id, display_name')
                .in('id', creatorIds);
                
              if (creatorDetails) {
                creatorMap = creatorDetails.reduce((acc, creator) => {
                  acc[creator.id] = creator.display_name || '';
                  return acc;
                }, {} as Record<string, string>);
              }
            }
            
            // データ構造を整形
            formattedPinned = pinnedDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              summary: doc.summary,
              status: doc.status,
              is_pinned: doc.is_pinned,
              document_url: doc.document_url || '', // URL フィールドを追加
              category_id: doc.category_id,
              category_name: doc.category_id && categoryMap[doc.category_id] ? 
                categoryMap[doc.category_id].name : '',
              created_at: doc.created_at,
              updated_at: doc.updated_at,
              created_by: doc.created_by,
              creator_name: doc.created_by && creatorMap[doc.created_by] ? 
                creatorMap[doc.created_by] : '',
              view_count: doc.view_count || 0,
              tags: doc.tags || []
            }));
          }
          
          setPinnedDocuments(formattedPinned);
        }
        
        // 最近のドキュメントの取得 - JOIN なしバージョン
        const { data: recentDocs, error: recentError } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            summary,
            status,
            is_pinned,
            category_id,
            document_url,
            created_at,
            updated_at,
            created_by,
            view_count,
            tags
          `)
          .eq('organization_id', profile.organization_id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(20)
        
        if (recentError) {
          console.error('Recent documents error:', recentError)
          // テーブルがない場合はエラーをクリアして空の配列を表示
          setDocuments([])
        } else {
          // 関連するカテゴリと作成者情報を取得
          let formattedRecent: Document[] = [];
          
          if (recentDocs && recentDocs.length > 0) {
            // カテゴリIDと作成者IDを収集
            const categoryIds = recentDocs
              .map(doc => doc.category_id)
              .filter(id => id !== null && id !== undefined) as string[];
              
            const creatorIds = recentDocs
              .map(doc => doc.created_by)
              .filter(id => id !== null && id !== undefined) as string[];
              
            // カテゴリ情報のマップを作成
            let categoryMap: Record<string, { name: string, color: string }> = {};
            
            if (categoryIds.length > 0) {
              const { data: categoryDetails } = await supabase
                .from('document_categories')
                .select('id, name, color')
                .in('id', categoryIds);
                
              if (categoryDetails) {
                categoryMap = categoryDetails.reduce((acc, cat) => {
                  acc[cat.id] = { name: cat.name, color: cat.color };
                  return acc;
                }, {} as Record<string, { name: string, color: string }>);
              }
            }
            
            // 作成者情報のマップを作成
            let creatorMap: Record<string, string> = {};
            
            if (creatorIds.length > 0) {
              const { data: creatorDetails } = await supabase
                .from('user_profiles')
                .select('id, display_name')
                .in('id', creatorIds);
                
              if (creatorDetails) {
                creatorMap = creatorDetails.reduce((acc, creator) => {
                  acc[creator.id] = creator.display_name || '';
                  return acc;
                }, {} as Record<string, string>);
              }
            }
            
            // データ構造を整形
            formattedRecent = recentDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              summary: doc.summary,
              status: doc.status,
              is_pinned: doc.is_pinned,
              document_url: doc.document_url || '', // URL フィールドを追加
              category_id: doc.category_id,
              category_name: doc.category_id && categoryMap[doc.category_id] ? 
                categoryMap[doc.category_id].name : '',
              created_at: doc.created_at,
              updated_at: doc.updated_at,
              created_by: doc.created_by,
              creator_name: doc.created_by && creatorMap[doc.created_by] ? 
                creatorMap[doc.created_by] : '',
              view_count: doc.view_count || 0,
              tags: doc.tags || []
            }));
          }
          
          setDocuments(formattedRecent);
        }
        
      } catch (err) {
        console.error('データ取得エラー:', err)
        // テーブルが存在しない場合でも強制的にエラーを表示せず続行
        setCategories([])
        setPinnedDocuments([])
        setDocuments([])
      }
      
    } catch (err) {
      console.error('初期データ取得エラー:', err)
      setError('データ取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  // フィルタリング処理
  const filteredDocuments = documents
    .filter(doc => !pinnedDocuments.some(pinned => pinned.id === doc.id)) // ピン留めされていないもの
    .filter(doc => {
      // カテゴリでフィルタリング
      if (selectedCategory && doc.category_id !== selectedCategory) {
        return false
      }
      
      // 検索語でフィルタリング
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          doc.title.toLowerCase().includes(search) || 
          (doc.summary && doc.summary.toLowerCase().includes(search)) ||
          doc.tags.some(tag => tag.toLowerCase().includes(search))
        )
      }
      
      return true
    })

  // カテゴリ別ドキュメント数を計算
  const categoryDocCounts = categories.map(category => {
    const count = documents.filter(doc => doc.category_id === category.id).length
    return {
      ...category,
      document_count: count
    }
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
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
    if (!url) return <File className="w-4 h-4" />
    
    if (url.includes('docs.google.com') || url.includes('document')) {
      return <File className="w-4 h-4 text-blue-500" />
    } else if (url.includes('sheets.google.com') || url.includes('spreadsheets')) {
      return <File className="w-4 h-4 text-green-500" />
    } else if (url.includes('slides.google.com') || url.includes('presentation')) { 
      return <File className="w-4 h-4 text-amber-500" />
    } else if (url.includes('.pdf')) {
      return <File className="w-4 h-4 text-red-500" />
    } else if (url.includes('drive.google.com')) {
      return <File className="w-4 h-4 text-blue-500" />
    } else {
      return <LinkIcon className="w-4 h-4 text-indigo-500" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            ドキュメント
          </h1>
          <div className="skeleton w-32 h-10 bg-slate-200 rounded-full"></div>
        </div>
        
        {/* スケルトンローダー省略 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* サイドバースケルトン */}
          <div className="hidden md:block">
            <div className="space-y-2">
              <div className="skeleton w-full h-10 bg-slate-200 rounded-lg"></div>
              <div className="skeleton w-full h-10 bg-slate-200 rounded-lg"></div>
              <div className="skeleton w-full h-10 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
          
          {/* メインコンテンツスケルトン */}
          <div className="md:col-span-3 space-y-6">
            <div className="skeleton w-full h-12 bg-slate-200 rounded-lg"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skeletonItems.map((_, i) => (
                <div key={i} className="skeleton bg-slate-200 rounded-xl h-48"></div>
              ))}
            </div>
            
            <div className="skeleton w-full h-12 bg-slate-200 rounded-lg mt-8"></div>
            
            <div className="space-y-3">
              {skeletonItems.map((_, i) => (
                <div key={i} className="skeleton bg-slate-200 rounded-lg h-16"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            ドキュメント
          </h1>
          <p className="text-slate-500 mt-1">
            組織のナレッジベースと情報共有
          </p>
        </div>
        
        <div className="flex gap-3">
      <Link href="/documents/categories">
        <Button
          variant="outline"
          className="border-indigo-200 hover:border-indigo-300 text-indigo-700"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          カテゴリ管理
        </Button>
      </Link>
      <Link href="/documents/create">
        <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          リンク登録
        </Button>
      </Link>
    </div>
      </div>
      
      {/* 開発中通知 */}
      <div className="mb-8 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
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
            <Info className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* サイドバー */}
        <div className="md:col-span-1 space-y-6">
          {/* 検索ボックス */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              type="search" 
              placeholder="ドキュメントを検索..." 
              className="w-full pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* カテゴリ一覧 - 変更なし */}
          <div>
            <h2 className="font-semibold mb-2 text-slate-900">カテゴリ</h2>
            <div className="space-y-1">
              <button 
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  selectedCategory === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <span className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  すべてのドキュメント
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {documents.length}
                </span>
              </button>
              
              {categoryDocCounts.map(category => (
                <button
                  key={category.id}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors ${
                    selectedCategory === category.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <span className="flex items-center">
                    <Folder className="w-4 h-4 mr-2" style={{ color: category.color || '#6366f1' }} />
                    {category.name}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {category.document_count}
                  </span>
                </button>
              ))}
            </div>
            
            {categories.length === 0 && (
              <div className="text-center py-4 px-2 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                <Folder className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">カテゴリがありません</p>
              </div>
            )}
          </div>
          
          {/* タグクラウド - 変更なし */}
          <div>
            <h2 className="font-semibold mb-2 text-slate-900">よく使われるタグ</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                マーケティング
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                デザイン
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                開発
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                提案書
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                レポート
              </span>
            </div>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="md:col-span-3">
          {/* ピン留めドキュメント - リンクカードに変更 */}
          {pinnedDocuments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-amber-500 mr-2" />
                ピン留め済みドキュメント
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedDocuments.map(doc => (
                  <Card key={doc.id} className="overflow-hidden border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 line-clamp-2 mb-2">
                          {doc.title}
                        </h3>
                        <Star className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" fill="currentColor" />
                      </div>
                      
                      {doc.summary && (
                        <p className="text-sm text-slate-500 mt-1 mb-3 line-clamp-2">
                          {doc.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-medium mr-1.5">
                            {doc.creator_name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-slate-500">{doc.creator_name || '不明'}</span>
                        </div>
                        
                        <span className="text-xs text-slate-400">
                          {new Date(doc.updated_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      
                      {/* 外部リンク部分を追加 */}
                      <a 
                        href={doc.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 mt-2 border-t pt-3 border-slate-100"
                      >
                        <div className="flex items-center">
                          {getFileIcon(doc.document_url)}
                          <span className="mx-1.5 truncate max-w-[180px]">
                            {getDomainFromUrl(doc.document_url)}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                      </a>
                      
                      <Link 
                        href={`/documents/${doc.id}`} 
                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center justify-end mt-2"
                      >
                        詳細
                        <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* すべてのドキュメント - リンク表示に変更 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <FileText className="w-5 h-5 text-indigo-600 mr-2" />
                {selectedCategory 
                  ? `${categories.find(c => c.id === selectedCategory)?.name || 'カテゴリ'} 内のドキュメント` 
                  : '最近のドキュメント'}
              </h2>
              
              <div className="flex items-center text-sm text-slate-500">
                <Filter className="w-4 h-4 mr-1" />
                <span>{filteredDocuments.length} 件</span>
              </div>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                {searchTerm || selectedCategory ? (
                  <>
                    <Search className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">該当するドキュメントはありません</h3>
                    <p className="text-slate-500">検索条件に一致するドキュメントが見つかりませんでした</p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory(null)
                      }}
                      className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      検索条件をリセット
                    </button>
                  </>
                ) : (
                  <>
                   <LinkIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">ドキュメントがありません</h3>
                    <p className="text-slate-500">まだドキュメント/リンクが登録されていません</p>
                    <Link href="/documents/create">
                      <button
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium flex items-center mx-auto"
                      >
                        <PlusCircle className="w-4 h-4 mr-1.5" />
                        リンクを登録する
                      </button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <h3 className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1">
                            {doc.title}
                          </h3>
                          
                          {doc.status === 'draft' && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">下書き</span>
                          )}
                        </div>
                        
                        {doc.summary && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1 pr-4">
                            {doc.summary}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 sm:mt-0 text-sm text-slate-500">
                        {doc.category_name && (
                          <span className="flex items-center">
                            <Folder className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {doc.category_name}
                          </span>
                        )}
                        
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {formatDate(doc.updated_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 外部リンク部分を追加 */}
                    <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <a 
                        href={doc.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <div className="flex items-center">
                          {getFileIcon(doc.document_url)}
                          <span className="mx-1.5">
                            {getDomainFromUrl(doc.document_url)}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </a>
                      
                      <Link 
                        href={`/documents/${doc.id}`} 
                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center"
                      >
                        詳細
                        <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            +{doc.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}