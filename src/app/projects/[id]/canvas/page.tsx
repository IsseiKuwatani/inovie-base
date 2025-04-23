'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { use } from 'react'
import { 
  ArrowLeft, Save, AlertCircle, Loader2, Info, Eye, EyeOff, 
  HelpCircle, ChevronRight, Maximize2, Minimize2, LucideIcon
} from 'lucide-react'

type CanvasData = {
  id?: string
  project_id: string
  customer_problem: string
  unique_value_proposition: string
  solution: string
  key_metrics: string
  unfair_advantage: string
  channels: string
  customer_segments: string
  cost_structure: string
  revenue_streams: string
  updated_at?: string
}

type Project = {
  id: string
  name: string
}

// sectionConfigsのキー型を明示的に定義
type SectionConfigKey = 'customer_problem' | 'unique_value_proposition' | 'solution' | 
                       'key_metrics' | 'unfair_advantage' | 'channels' | 
                       'customer_segments' | 'cost_structure' | 'revenue_streams';

type CanvasSectionConfig = {
  title: string
  field: SectionConfigKey
  placeholder: string
  color: string
  icon?: LucideIcon
  questions: string[]
  description: string
  category: 'problem' | 'solution' | 'value' | 'market' | 'business'
}

export default function CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  // React.use で params をアンラップする (Next.js 14の新仕様)
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [canvas, setCanvas] = useState<CanvasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savingStatus, setSavingStatus] = useState('未保存')
  const [dbSyncError, setDbSyncError] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [expandedSection, setExpandedSection] = useState<SectionConfigKey | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<SectionConfigKey | null>(null)
  const [isModified, setIsModified] = useState(false) // 変更があったかどうか
  
  // ツールチップ用のref
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // ツールチップ外クリックでクローズするためのuseEffect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // テキストエリア内のクリックはツールチップを閉じないように変更
      const isTextareaClick = (event.target as HTMLElement).tagName === 'TEXTAREA';
      
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && activeTooltip && !isTextareaClick) {
        setActiveTooltip(null);
      }
    }
  
    // ESCキーでツールチップを閉じる
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && activeTooltip) {
        setActiveTooltip(null);
      }
    }
  
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [activeTooltip]);
  
  // プロジェクト情報とキャンバスデータの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // プロジェクト情報の取得
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', projectId)
          .single()
        
        if (projectError) {
          console.error('プロジェクト取得エラー:', projectError)
          setError('プロジェクト情報の取得に失敗しました')
          setLoading(false)
          return
        }
        
        setProject(projectData)
        
        // エラーが発生しても使えるように初期化しておく
        const initialCanvas: CanvasData = {
          project_id: projectId,
          customer_problem: '',
          unique_value_proposition: '',
          solution: '',
          key_metrics: '',
          unfair_advantage: '',
          channels: '',
          customer_segments: '',
          cost_structure: '',
          revenue_streams: ''
        }
        
        setCanvas(initialCanvas)
        
        try {
          // キャンバスデータの取得を試みる
          const { data: canvasData, error: canvasError } = await supabase
            .from('canvas')
            .select('*')
            .eq('project_id', projectId)
            .single()
          
          if (!canvasError && canvasData) {
            // 既存のキャンバスデータがある場合はそれを使用
            setCanvas(canvasData)
            setSavingStatus('保存済み')
          } else if (canvasError && canvasError.code === 'PGRST116') {
            // データが見つからない場合は新規作成を試みる
            const { data: newCanvas, error: createError } = await supabase
              .from('canvas')
              .insert(initialCanvas)
              .select('*')
              .single()
            
            if (createError) {
              console.warn('キャンバスデータの作成に失敗しました:', createError)
              setDbSyncError(true)
              // エラーが発生しても初期化したcanvasを使用するため、処理は続行
            } else if (newCanvas) {
              setCanvas(newCanvas)
              setSavingStatus('保存済み')
            }
          } else {
            console.warn('キャンバスデータの取得に失敗しました:', canvasError)
            setDbSyncError(true)
            // エラーが発生しても初期化したcanvasを使用するため、処理は続行
          }
        } catch (err) {
          console.error('キャンバスデータ処理エラー:', err)
          setDbSyncError(true)
          // エラーが発生しても初期化したcanvasを使用するため、処理は続行
        }
      } catch (err) {
        console.error('データ取得エラー:', err)
        setError('データの読み込み中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [projectId])

  // キャンバスデータの更新処理
  const updateCanvas = async (updates: Partial<CanvasData>, saveImmediately = false) => {
    if (!canvas) return
    
    // UI状態のみを更新（変更フラグを立てない）
    setCanvas(prev => prev ? { ...prev, ...updates } : null)
    
    // 即時保存しない場合はここで終了
    if (!saveImmediately) {
      return;
    }
    
    // 以下は明示的に保存する場合の処理
    setSaving(true);
    setSavingStatus('保存中...');
    
    try {
      if (canvas.id) {
        // 既存のキャンバスデータを更新
        const { error } = await supabase
          .from('canvas')
          .update({...canvas, ...updates})
          .eq('id', canvas.id)
        
        if (error) {
          console.error('キャンバス更新エラー:', error)
          setSavingStatus('保存に失敗しました')
          setDbSyncError(true)
          return
        }
      } else {
        // 新規作成を試みる
        const { data, error } = await supabase
          .from('canvas')
          .insert({ ...canvas, ...updates })
          .select('id')
          .single()
        
        if (error) {
          console.error('キャンバス作成エラー:', error)
          setSavingStatus('保存に失敗しました')
          setDbSyncError(true)
          return
        }
        
        if (data && data.id) {
          setCanvas(prev => prev ? { ...prev, id: data.id } : null)
        }
      }
      
      setSavingStatus('保存済み')
      setDbSyncError(false)
    } catch (err) {
      console.error('キャンバス更新中のエラー:', err)
      setSavingStatus('保存に失敗しました')
      setDbSyncError(true)
    } finally {
      setSaving(false)
    }
  }
  
  // セクションの内容変更ハンドラ - 修正
  const handleSectionChange = (field: keyof CanvasData, value: string) => {
    if (!canvas) return
    
    // 単純に状態を更新するだけ（変更フラグを使わない）
    updateCanvas({ [field]: value }, false)
  }
  
  // すべての変更を保存する関数 - 修正
  const saveAllChanges = async () => {
    if (!canvas) return;
    
    setSaving(true);
    
    try {
      // 現在の canvas データを丸ごと保存
      if (canvas.id) {
        const { error } = await supabase
          .from('canvas')
          .update(canvas)
          .eq('id', canvas.id)
          
        if (error) {
          console.error('保存エラー:', error);
          setDbSyncError(true);
        } else {
          setSavingStatus('保存済み');
          setDbSyncError(false);
        }
      } else {
        // IDがない場合は新規作成
        const { data, error } = await supabase
          .from('canvas')
          .insert(canvas)
          .select('id')
          .single()
          
        if (error) {
          console.error('作成エラー:', error);
          setDbSyncError(true);
        } else if (data) {
          setCanvas(prev => prev ? { ...prev, id: data.id } : null);
          setSavingStatus('保存済み');
          setDbSyncError(false);
        }
      }
    } catch (err) {
      console.error('保存処理エラー:', err);
      setDbSyncError(true);
    } finally {
      setSaving(false);
    }
  }

  // 拡張モードの切り替え
  const toggleExpandSection = (field: SectionConfigKey) => {
    if (expandedSection === field) {
      setExpandedSection(null)
    } else {
      setExpandedSection(field)
    }
  }

  // ツールチップの表示/非表示
  const toggleTooltip = (field: SectionConfigKey | null) => {
    setActiveTooltip(field)
  }

  // セクション設定
  const sectionConfigs: Record<SectionConfigKey, CanvasSectionConfig> = {
    customer_problem: {
      title: "顧客の課題",
      field: "customer_problem",
      placeholder: "顧客が抱える課題や解決したいニーズを記入...",
      color: "bg-rose-100 border-rose-200",
      questions: [
        "顧客が解決したい最大の課題は何ですか？",
        "現在、顧客はどのようにその課題を解決していますか？",
        "現状のソリューションの不満点は何ですか？"
      ],
      description: "顧客が抱える主要な課題や解決したいニーズを特定します。最低3つの課題を挙げると良いでしょう。",
      category: "problem"
    },
    unique_value_proposition: {
      title: "独自の価値提案",
      field: "unique_value_proposition",
      placeholder: "あなたのソリューションがどのように顧客の課題を解決するのか...",
      color: "bg-violet-100 border-violet-200",
      questions: [
        "顧客にとってあなたのソリューションはなぜ価値があるのですか？",
        "あなたのソリューションがなぜ顧客に選ばれるのですか？",
        "シンプルで明確な一文で表現できますか？"
      ],
      description: "顧客に提供する独自の価値を明確に表現します。あなたの製品やサービスが顧客の課題をどのように解決するのかを簡潔に説明します。",
      category: "value"
    },
    solution: {
      title: "解決策",
      field: "solution",
      placeholder: "具体的な解決方法や提供する製品・サービス...",
      color: "bg-emerald-100 border-emerald-200",
      questions: [
        "どのように顧客の課題を解決しますか？",
        "主要な機能や特徴は何ですか？",
        "最小限の機能で価値を提供できる方法は？"
      ],
      description: "特定した顧客の課題に対する解決策を具体的に記述します。MVPに含めるべき最小限の機能を考えましょう。",
      category: "solution"
    },
    key_metrics: {
      title: "重要な指標",
      field: "key_metrics",
      placeholder: "成功を測定するための指標...",
      color: "bg-amber-100 border-amber-200",
      questions: [
        "ビジネスの成功を測る主要な指標は何ですか？",
        "顧客獲得やエンゲージメントをどう測定しますか？",
        "収益や成長を表す数値は何ですか？"
      ],
      description: "ビジネスの成功を測定するための主要な指標を定義します。例えば、ユーザー数、顧客獲得コスト、売上などが含まれます。",
      category: "business"
    },
    unfair_advantage: {
      title: "独自の優位性",
      field: "unfair_advantage",
      placeholder: "競合に真似できないあなたの強み...",
      color: "bg-violet-100 border-violet-200",
      questions: [
        "他社が簡単に複製できない強みは何ですか？",
        "特許、独自技術、専門知識などはありますか？",
        "顧客との強い関係性はありますか？"
      ],
      description: "競合企業が容易に複製できない、あなたのビジネスだけが持つ強みを特定します。これは真の差別化要因です。",
      category: "value"
    },
    channels: {
      title: "チャネル",
      field: "channels",
      placeholder: "顧客へのリーチ方法、販売経路...",
      color: "bg-sky-100 border-sky-200",
      questions: [
        "どのように顧客にリーチしますか？",
        "販売やマーケティングの経路は何ですか？",
        "最も効率的なチャネルは何ですか？"
      ],
      description: "顧客に製品やサービスを届けるための経路を計画します。オンライン/オフラインの販売チャネル、マーケティング手法などを含みます。",
      category: "market"
    },
    customer_segments: {
      title: "顧客セグメント",
      field: "customer_segments",
      placeholder: "ターゲットとする顧客層、ユーザー像...",
      color: "bg-sky-100 border-sky-200",
      questions: [
        "あなたの製品/サービスを最も必要としているのは誰ですか？",
        "ターゲット顧客の特徴や属性は何ですか？",
        "初期に集中すべきセグメントはどこですか？"
      ],
      description: "ビジネスがターゲットとする具体的な顧客グループを特定します。人口統計、行動特性、ニーズなどでセグメント化します。",
      category: "market"
    },
    cost_structure: {
      title: "コスト構造",
      field: "cost_structure",
      placeholder: "主なコスト項目、固定費と変動費...",
      color: "bg-amber-100 border-amber-200",
      questions: [
        "主なコスト項目は何ですか？",
        "固定費と変動費の内訳は？",
        "事業拡大に伴いどのコストが増加しますか？"
      ],
      description: "ビジネスを運営するために必要な主要なコストを特定します。固定費と変動費を区別し、スケーラビリティを考慮します。",
      category: "business"
    },
    revenue_streams: {
      title: "収益の流れ",
      field: "revenue_streams",
      placeholder: "収益モデル、価格設定...",
      color: "bg-amber-100 border-amber-200",
      questions: [
        "どのように収益を生み出しますか？",
        "価格設定モデルは何ですか？",
        "顧客は何に対していくら支払うのですか？"
      ],
      description: "ビジネスがどのように収益を生み出すかを記述します。価格設定モデル、支払い方法、顧客の支払い意欲など。",
      category: "business"
    }
  }

// テキストエリアコンポーネント (リッチバージョン)
const CanvasSection = ({ 
  config,
  value,
  onChange,
  expanded = false,
  onExpand
}: { 
  config: CanvasSectionConfig,
  value: string, 
  onChange: (field: keyof CanvasData, value: string) => void,
  expanded?: boolean,
  onExpand?: () => void
}) => {
  const isEditing = viewMode === 'edit'
  const hasContent = value && value.trim().length > 0
  
  // ローカルステートで値を管理して、スムーズな入力を可能にする
  const [localValue, setLocalValue] = useState(value || '');
  // フォーカス状態を管理
  const [isFocused, setIsFocused] = useState(false);
  // テキストエリアの参照
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 外部からの値が変更された場合にローカル値も更新
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);
  
  // テキストエリアの高さを自動調整する関数
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, 80); // 最小高さは80px
      textarea.style.height = `${newHeight}px`;
    }
  };
  
  // 値が変更されたときに高さを調整
  useEffect(() => {
    if (isFocused) {
      adjustTextareaHeight();
    }
  }, [localValue, isFocused]);
  
  // フォーカスが外れた時にのみ親コンポーネントを更新
  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== value) {
      onChange(config.field, localValue);
    }
  };
  
  // フォーカス時の処理
  const handleFocus = () => {
    setIsFocused(true);
    // 少し遅延させてから高さ調整を行うことで、フォーカス後のアニメーションをスムーズにする
    setTimeout(adjustTextareaHeight, 50);
  };
  
  return (
    <div className={`
      flex flex-col h-full rounded-lg overflow-hidden transition-all duration-300
      ${config.color} ${expanded ? 'col-span-3 row-span-2' : ''}
      ${isEditing ? 'shadow-sm hover:shadow' : 'shadow-none'}
    `}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-opacity-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-700">
            {config.title}
          </h3>
          <button
            type="button"
            className="p-1 text-slate-500 hover:text-slate-700 rounded"
            onClick={() => toggleTooltip(activeTooltip === config.field ? null : config.field)}
            aria-label="ヘルプ"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {onExpand && (
            <button
              type="button"
              className="p-1 text-slate-500 hover:text-slate-700 rounded"
              onClick={onExpand}
              aria-label={expanded ? "縮小" : "拡大"}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className={`
              flex-grow w-full p-2 text-sm bg-white bg-opacity-70 border border-opacity-50 rounded
              resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all duration-300 ease-in-out
              ${isFocused ? 'min-h-[150px]' : 'min-h-[80px]'}
            `}
            placeholder={config.placeholder}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        ) : (
          <div className="flex-grow p-2 text-sm overflow-auto whitespace-pre-wrap">
            {hasContent ? value : (
              <span className="text-slate-400 italic">内容がまだ入力されていません</span>
            )}
          </div>
        )}
        
        {expanded && (
          <div className="mt-3 text-xs text-slate-500">
            <p className="font-medium mb-1">ガイド:</p>
            <ul className="space-y-1 list-disc pl-4">
              {config.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

  // ビジュアルマップのレイアウト決定
  const getCategoryArea = (category: CanvasSectionConfig['category']) => {
    switch (category) {
      case 'problem': return 'col-span-1 row-span-1 md:col-start-1 md:row-start-1';
      case 'value': return 'col-span-1 row-span-1 md:col-start-2 md:row-start-1';
      case 'solution': return 'col-span-1 row-span-1 md:col-start-3 md:row-start-1';
      case 'market': return 'col-span-1 row-span-1 md:col-start-1 md:row-start-2';
      case 'business': return 'col-span-1 row-span-1 md:col-start-3 md:row-start-2';
      default: return '';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600">リーンキャンバスを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md">
          <div className="flex justify-center mb-4 text-rose-500">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">エラーが発生しました</h2>
          <p className="text-slate-600 text-center mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              プロジェクトに戻る
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  // カテゴリー別のセクションをグループ化
  const categorizedSections = Object.values(sectionConfigs).reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<CanvasSectionConfig['category'], CanvasSectionConfig[]>);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6">
        {/* ヘッダー部分 */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center text-sm text-slate-500 mb-2">
                <Link href="/projects" className="hover:text-indigo-600 hover:underline">プロジェクト</Link>
                <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
                <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 hover:underline">
                  {project?.name || 'プロジェクト'}
                </Link>
                <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
                <span className="text-slate-700 font-medium">リーンキャンバス</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">
                リーンキャンバスモデル
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {viewMode === 'edit' ? (
                  <>
                    <Eye className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">プレビュー</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">編集モード</span>
                  </>
                )}
              </button>
              
              {/* 保存ボタン */}
              <button
                onClick={saveAllChanges}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                {saving ? (
                    <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">保存中...</span>
                    </>
                ) : (
                    <>
                    <Save className="h-4 w-4" />
                    <span className="text-sm">保存</span>
                    </>
                )}
                </button>
              
              <Link
                href={`/projects/${projectId}`}
                className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>戻る</span>
              </Link>
            </div>
          </div>
          
          <p className="text-slate-500 mt-2">
            ビジネスモデルを構築するためのフレームワークです。各セクションにアイデアを入力してください。
          </p>
          
          {/* 未保存の変更がある場合の通知 */}
          {isModified && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <Info size={14} />
              <span>未保存の変更があります。「変更を保存」ボタンをクリックして保存してください。</span>
            </div>
          )}
          
          {/* データベース同期エラー通知 */}
          {dbSyncError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <Info className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm text-amber-800 font-medium">データベースとの同期に問題があります</p>
                <p className="text-xs text-amber-700 mt-1">
                  入力内容はこのページを開いている間は保持されますが、データベースに保存されていない可能性があります。
                  後ほど再試行するか、管理者にお問い合わせください。
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* ツールチップ（固定位置表示） - 修正 */}
        {activeTooltip && sectionConfigs[activeTooltip] && (
          <div 
            ref={tooltipRef}
            className="fixed z-50 top-1/4 left-1/2 transform -translate-x-1/2 p-4 bg-white rounded-lg shadow-lg border border-slate-200 w-80 text-xs text-slate-700"
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-sm text-slate-800">{sectionConfigs[activeTooltip].title}について</h4>
              <button
                onClick={() => toggleTooltip(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-full w-6 h-6 flex items-center justify-center transition-colors ml-2 -mt-1 -mr-1"
                aria-label="閉じる"
              >
                <span className="text-base font-medium">×</span>
              </button>
            </div>
            <p className="mb-3">{sectionConfigs[activeTooltip].description}</p>
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <h5 className="font-medium text-slate-700 mb-1">ヒントになる質問:</h5>
              <ul className="space-y-1.5 mt-1 list-disc pl-4">
                {sectionConfigs[activeTooltip].questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
             {/* 閉じるボタン（フッター部分） - 削除または修正
             以下のボタンは上部の×ボタンと機能が重複するため、要望に応じて削除 */}
             {/* <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => toggleTooltip(null)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                閉じる
              </button>
            </div> */}
          </div>
        )}
        
        {/* モバイル表示の注意（必要に応じて） */}
        <div className="md:hidden px-4 sm:px-6 mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              画面を横向きにするか、より大きな画面で閲覧すると、リーンキャンバスをより見やすく表示できます。
            </p>
          </div>
        </div>
        
        {/* リーンキャンバスの説明 */}
        <div className="hidden md:block px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex justify-between text-xs text-slate-500">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-rose-200"></div>
                <span>課題領域</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-violet-200"></div>
                <span>価値提案</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-200"></div>
                <span>解決策</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-sky-200"></div>
                <span>市場</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-200"></div>
                <span>ビジネスモデル</span>
              </div>
            </div>
            <div className="italic">
              ℹ️ 各セクションの <HelpCircle size={12} className="inline" /> アイコンをクリックすると詳細情報が表示されます
            </div>
          </div>
        </div>

        {/* 拡張モードのセクション（展開中のセクションがある場合） */}
        {expandedSection && sectionConfigs[expandedSection] && canvas && (
          <div className="px-4 sm:px-6 lg:px-8 mb-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <CanvasSection
                config={sectionConfigs[expandedSection]}
                value={canvas[expandedSection] || ''}
                onChange={handleSectionChange}
                expanded={true}
                onExpand={() => toggleExpandSection(expandedSection)}
              />
            </div>
          </div>
        )}
        
        {/* キャンバスグリッド（拡張モードでない場合のみ表示） */}
        {!expandedSection && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* 問題エリア */}
              <div className={`${getCategoryArea('problem')}`}>
                {canvas && (
                  <CanvasSection
                    config={sectionConfigs.customer_problem}
                    value={canvas.customer_problem || ''}
                    onChange={handleSectionChange}
                    onExpand={() => toggleExpandSection('customer_problem')}
                  />
                )}
              </div>
              
              {/* 価値提案エリア */}
              <div className={`${getCategoryArea('value')}`}>
                {canvas && (
                  <CanvasSection
                    config={sectionConfigs.unique_value_proposition}
                    value={canvas.unique_value_proposition || ''}
                    onChange={handleSectionChange}
                    onExpand={() => toggleExpandSection('unique_value_proposition')}
                  />
                )}
              </div>
              
              {/* 解決策エリア */}
              <div className={`${getCategoryArea('solution')}`}>
                {canvas && (
                  <CanvasSection
                    config={sectionConfigs.solution}
                    value={canvas.solution || ''}
                    onChange={handleSectionChange}
                    onExpand={() => toggleExpandSection('solution')}
                  />
                )}
              </div>
              
              {/* 市場エリア - 左下 */}
              <div className="col-span-1 row-span-1 md:col-start-1 md:row-start-2">
                <div className="grid grid-cols-1 gap-4">
                  {canvas && (
                    <>
                      <CanvasSection
                        config={sectionConfigs.customer_segments}
                        value={canvas.customer_segments || ''}
                        onChange={handleSectionChange}
                        onExpand={() => toggleExpandSection('customer_segments')}
                      />
                      <CanvasSection
                        config={sectionConfigs.channels}
                        value={canvas.channels || ''}
                        onChange={handleSectionChange}
                        onExpand={() => toggleExpandSection('channels')}
                      />
                    </>
                  )}
                </div>
              </div>
              
              {/* 価値提案の補完 - 中央下 */}
              <div className="col-span-1 row-span-1 md:col-start-2 md:row-start-2">
                {canvas && (
                  <CanvasSection
                    config={sectionConfigs.unfair_advantage}
                    value={canvas.unfair_advantage || ''}
                    onChange={handleSectionChange}
                    onExpand={() => toggleExpandSection('unfair_advantage')}
                  />
                )}
              </div>
              
              {/* ビジネスモデルエリア - 右下 */}
              <div className="col-span-1 row-span-1 md:col-start-3 md:row-start-2">
                <div className="grid grid-cols-1 gap-4">
                  {canvas && (
                    <>
                      <CanvasSection
                        config={sectionConfigs.key_metrics}
                        value={canvas.key_metrics || ''}
                        onChange={handleSectionChange}
                        onExpand={() => toggleExpandSection('key_metrics')}
                      />
                      <CanvasSection
                        config={sectionConfigs.cost_structure}
                        value={canvas.cost_structure || ''}
                        onChange={handleSectionChange}
                        onExpand={() => toggleExpandSection('cost_structure')}
                      />
                      <CanvasSection
                        config={sectionConfigs.revenue_streams}
                        value={canvas.revenue_streams || ''}
                        onChange={handleSectionChange}
                        onExpand={() => toggleExpandSection('revenue_streams')}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 説明セクション */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">リーンキャンバスモデルについて</h2>
            <p className="text-slate-600 mb-4">
              リーンキャンバスは、アッシュ・マウリャによって考案されたビジネスモデルを簡潔に表現するためのフレームワークです。
              このフレームワークを使用することで、ビジネスの主要な側面を整理し、検証すべき重要な仮説を特定することができます。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                <h3 className="font-medium text-slate-800 mb-2">問題の理解</h3>
                <p className="text-slate-600">
                  顧客の課題を深く理解することからスタートします。優先順位の高い3つの問題を特定し、現在の解決策も調査しましょう。
                </p>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-100">
                <h3 className="font-medium text-slate-800 mb-2">差別化と価値提案</h3>
                <p className="text-slate-600">
                  あなたの製品やサービスが顧客に提供する独自の価値を明確に定義します。それは競合とどう違うのか、なぜ顧客はあなたを選ぶのかを説明します。
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h3 className="font-medium text-slate-800 mb-2">解決策の設計</h3>
                <p className="text-slate-600">
                  特定した問題に対する具体的な解決策を提案します。MVPに含めるべき最小限の機能セットを考えて、早期に市場検証できるようにします。
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-center text-slate-500">
              <p>
                リーンキャンバスは、ビジネスプランの作成よりも、仮説の検証に重点を置いています。
                各セクションは検証すべき仮説であり、実験と顧客フィードバックを通じて継続的に改善していくことが重要です。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}