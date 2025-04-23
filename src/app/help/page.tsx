// app/help/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  BookOpen, 
  Beaker, 
  MapPin, 
  Users2, 
  BrainCircuit, 
  HelpCircle, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpenCheck,
  MessagesSquare,
  HardDriveDownload,
  Info,
  LightbulbIcon,
  LayoutDashboard,
  Target,
  FileCheck,
  AlertTriangle,
  BookMarked,
  ChevronRight
} from 'lucide-react'

// テキストコンテンツの分離 - 実際の実装では別ファイルに移動することも可能
const helpContent = {
  basic: {
    icon: <LayoutDashboard size={22} className="text-indigo-600" />,
    title: "基本操作ガイド",
    sections: [
      {
        id: "login",
        title: "ログイン方法",
        content: [
          "登録済みのメールアドレスとパスワードを入力し、ログインしてください。",
          "初回ログイン時にはパスワードの再設定を求められることがあります。",
          "サインアップは原則管理者のみ可能です（クローズド環境のため）。"
        ]
      },
      {
        id: "project-create",
        title: "プロジェクトの作成",
        content: [
          "ダッシュボード右上の「＋ 新規プロジェクト」ボタンをクリック。",
          "以下の項目を入力：",
          {
            type: "list",
            items: [
              "プロジェクト名（例：SaaS営業支援ツール検証）",
              "プロジェクトの目的（例：営業現場の工数削減に寄与するSaaSモデルの市場ニーズ把握）",
              "仮説自動生成のON/OFF（ONにするとAIが初期仮説を生成）"
            ]
          },
          "作成後はプロジェクト一覧に表示され、クリックで詳細に移動可能。"
        ]
      },
      {
        id: "project-delete",
        title: "プロジェクトの削除",
        content: [
          "現在は管理者のみ削除可能です。",
          "誤操作防止のため、確認モーダルが表示されます。"
        ]
      }
    ]
  },
  hypothesis: {
    icon: <Target size={22} className="text-indigo-600" />,
    title: "仮説作成・管理",
    sections: [
      {
        id: "hypothesis-create",
        title: "仮説の新規作成",
        content: [
          "プロジェクト内の「＋ 仮説を追加」ボタンをクリック。",
          "以下を入力：",
          {
            type: "list",
            items: [
              "タイトル（例：中小企業の営業はCRM入力に時間を取られすぎている）",
              "前提（例：CRMへの情報入力がマネジメント評価指標として重視されている）",
              "期待される効果（例：工数削減による営業成果向上、営業満足度の向上）",
              "タイプ（例：課題／解決策／価値提案／市場仮説）",
              "ステータス（例：未検証／検証中／反証済み／妥当性あり）",
              "影響度・不確実性・確信度をスライダーで設定"
            ]
          },
          {
            type: "tip",
            title: "入力のヒント",
            content: [
              "前提：「なぜこの仮説が成り立つのか？」を明文化しましょう。",
              "期待される効果：「この仮説が正しければ、どんな変化が起きるか？」を想像して書いてください。",
              "影響度・不確実性は、意思決定の優先順位付けに直結します。"
            ]
          }
        ]
      },
      {
        id: "hypothesis-edit",
        title: "仮説の編集",
        content: [
          "仮説カードまたは詳細ページから「編集」ボタンで変更可能です。",
          "変更履歴は保存されますが、現時点では過去バージョンには戻せません。"
        ]
      }
    ]
  },
  // 他のセクションも同様に定義...
};

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('basic')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basic: true,
    hypothesis: false,
    verification: false,
    map: false,
    collaboration: false,
    evaluation: false,
    troubleshooting: false,
    security: false
  })

  // カテゴリーのアイコンマッピング
  const categoryIcons: Record<string, React.ReactNode> = {
    'basic': <BookOpen size={22} />,
    'hypothesis': <BookOpenCheck size={22} />,
    'verification': <Beaker size={22} />,
    'map': <MapPin size={22} />,
    'collaboration': <Users2 size={22} />,
    'evaluation': <BrainCircuit size={22} />,
    'troubleshooting': <HelpCircle size={22} />,
    'security': <ShieldCheck size={22} />,
  }

  // カテゴリーの展開/折りたたみを切り替える
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // セクションのアクティブ状態を切り替える
  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId)
  }

  // 検索処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 実際の検索処理はここに実装
    console.log('検索語句:', searchTerm)
  }

  // コンテンツをレンダリングする関数
  const renderContent = (content: any[]) => {
    return content.map((item, index) => {
      if (typeof item === 'string') {
        return <p key={index} className="mb-3">{item}</p>
      } else if (item.type === 'list') {
        return (
          <ul key={index} className="list-disc pl-5 mb-4 space-y-1">
            {item.items.map((listItem: string, i: number) => (
              <li key={i}>{listItem}</li>
            ))}
          </ul>
        );
      } else if (item.type === 'tip') {
        return (
          <div key={index} className="bg-indigo-50 p-4 rounded-lg my-4 border-l-4 border-indigo-400">
            <div className="flex items-start">
              <LightbulbIcon size={20} className="text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-indigo-700 mb-2">{item.title}</h4>
                <ul className="space-y-1.5 text-gray-700">
                  {item.content.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <ChevronRight size={16} className="text-indigo-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }
      return null;
    });
  };

  return (

    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* サイドナビゲーション */}
          <nav className="md:w-64 flex-shrink-0 mb-6 md:mb-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-800">カテゴリー</h2>
              </div>
              
              <div className="p-2">
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => {
                        setActiveCategory('basic')
                        toggleCategory('basic')
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left ${
                        activeCategory === 'basic' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${activeCategory === 'basic' ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {categoryIcons.basic}
                        </span>
                        <span className="font-medium">基本操作ガイド</span>
                      </div>
                      <span>
                        {expandedCategories.basic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    
                    {expandedCategories.basic && (
                      <ul className="pl-9 pr-2 py-2 space-y-1">
                        {helpContent.basic.sections.map(section => (
                          <li key={section.id}>
                            <button 
                              onClick={() => toggleSection(section.id)}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                                activeSection === section.id 
                                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {section.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  
                  <li>
                    <button
                      onClick={() => {
                        setActiveCategory('hypothesis')
                        toggleCategory('hypothesis')
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left ${
                        activeCategory === 'hypothesis' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${activeCategory === 'hypothesis' ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {categoryIcons.hypothesis}
                        </span>
                        <span className="font-medium">仮説作成・管理</span>
                      </div>
                      <span>
                        {expandedCategories.hypothesis ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    
                    {expandedCategories.hypothesis && (
                      <ul className="pl-9 pr-2 py-2 space-y-1">
                        {helpContent.hypothesis.sections.map(section => (
                          <li key={section.id}>
                            <button 
                              onClick={() => toggleSection(section.id)}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                                activeSection === section.id 
                                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {section.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  
                  {/* 他のカテゴリーも同様に定義... */}
                </ul>
              </div>
              
              <div className="p-4 bg-indigo-50 mt-2">
                <div className="flex items-start">
                  <HelpCircle size={18} className="text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-indigo-700 text-sm">サポートが必要ですか？</h4>
                    <p className="text-xs text-gray-600 mt-1 mb-2">
                      解決しない問題がありましたら、運営者にお問い合わせください。
                    </p>
                    
                  </div>
                </div>
              </div>
            </div>
          </nav>
          
          {/* メインコンテンツ */}
          <main className="flex-1">
            {/* ウェルカムカード */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white p-6 mb-8 shadow-lg">
              <div className="flex items-center mb-4">
                <Info size={24} className="mr-3" />
                <h2 className="text-xl font-bold">Inovie Base ヘルプセンターへようこそ</h2>
              </div>
              <p className="opacity-90 leading-relaxed">
                Inovie Baseの使い方や機能について詳しく解説します。
                サービスをより快適にご利用いただくために、ご不明点があればこちらをご参照ください。
              </p>
            </div>
            
            {/* アクティブなコンテンツを表示 */}
            {activeSection && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center">
                    {/* カテゴリーに応じたアイコンを表示 */}
                    <div className="p-2 bg-indigo-50 rounded-lg mr-4">
                      {activeCategory === 'basic' && helpContent.basic.icon}
                      {activeCategory === 'hypothesis' && helpContent.hypothesis.icon}
                      {/* 他のカテゴリーに応じたアイコン */}
                    </div>
                    
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {activeCategory === 'basic' && 
                          helpContent.basic.sections.find(s => s.id === activeSection)?.title}
                        {activeCategory === 'hypothesis' && 
                          helpContent.hypothesis.sections.find(s => s.id === activeSection)?.title}
                        {/* 他のカテゴリーの処理 */}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {activeCategory === 'basic' ? '基本操作ガイド' : ''}
                        {activeCategory === 'hypothesis' ? '仮説作成・管理' : ''}
                        {/* 他のカテゴリー名 */}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-indigo max-w-none text-gray-700">
                    {activeCategory === 'basic' && 
                      renderContent(helpContent.basic.sections.find(s => s.id === activeSection)?.content || [])}
                    {activeCategory === 'hypothesis' && 
                      renderContent(helpContent.hypothesis.sections.find(s => s.id === activeSection)?.content || [])}
                    {/* 他のカテゴリーのコンテンツレンダリング */}
                  </div>
                  
                  {/* 役に立ちましたか？フィードバックセクション */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">この情報は役に立ちましたか？</h4>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors">
                        はい、役立ちました
                      </button>
                      <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        いいえ、改善が必要です
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* セクションが選択されていない場合は、カテゴリー概要を表示 */}
            {!activeSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                        {categoryIcons.basic}
                      </div>
                      <h3 className="font-bold text-gray-800">基本操作ガイド</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-2">
                      {helpContent.basic.sections.map(section => (
                        <li key={section.id}>
                          <button 
                            onClick={() => {
                              setActiveCategory('basic')
                              toggleCategory('basic')
                              toggleSection(section.id)
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-left flex items-center gap-1 font-medium"
                          >
                            <ChevronRight size={16} />
                            <span>{section.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                        {categoryIcons.hypothesis}
                      </div>
                      <h3 className="font-bold text-gray-800">仮説作成・管理</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-2">
                      {helpContent.hypothesis.sections.map(section => (
                        <li key={section.id}>
                          <button 
                            onClick={() => {
                              setActiveCategory('hypothesis')
                              toggleCategory('hypothesis')
                              toggleSection(section.id)
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-left flex items-center gap-1 font-medium"
                          >
                            <ChevronRight size={16} />
                            <span>{section.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* 他のカテゴリーカードも同様に定義... */}
              </div>
            )}
            
            {/* よく閲覧されるトピック */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">よく閲覧されるトピック</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    setActiveCategory('basic')
                    toggleCategory('basic')
                    toggleSection('project-create')
                  }}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow transition-all text-left"
                >
                  <div className="flex items-center text-indigo-600 mb-2">
                    <FileCheck size={16} className="mr-2" />
                    <span className="font-medium">プロジェクトの作成</span>
                  </div>
                  <p className="text-sm text-gray-600">新しいプロジェクトを作成して仮説検証を始める方法</p>
                </button>
                
                <button 
                  onClick={() => {
                    setActiveCategory('hypothesis')
                    toggleCategory('hypothesis')
                    toggleSection('hypothesis-create')
                  }}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow transition-all text-left"
                >
                  <div className="flex items-center text-indigo-600 mb-2">
                    <Target size={16} className="mr-2" />
                    <span className="font-medium">仮説の新規作成</span>
                  </div>
                  <p className="text-sm text-gray-600">効果的な仮説の立て方と必要な情報の入力方法</p>
                </button>
                
                <button 
                  onClick={() => {
                    setActiveCategory('troubleshooting')
                    toggleCategory('troubleshooting')
                    toggleSection('trouble-map')
                  }}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow transition-all text-left"
                >
                  <div className="flex items-center text-indigo-600 mb-2">
                    <AlertTriangle size={16} className="mr-2" />
                    <span className="font-medium">マップ表示の問題</span>
                  </div>
                  <p className="text-sm text-gray-600">仮説マップに表示されない場合の確認点と解決方法</p>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    
  )
}
