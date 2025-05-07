'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Trophy, Star, CheckCircle, X, Plus, ArrowRight, Settings, FlaskConical } from 'lucide-react'
import Link from 'next/link'


// 仮説タイプ定義
type RoadmapHypothesis = {
  id: string;
  title: string;
  assumption: string;
  solution: string;
  expected_effect: string;
  type: string;
  status: string;
  impact: number;
  uncertainty: number;
  confidence: number;
  verification_methods?: string[];
  success_criteria?: string;
  next_steps?: { success: string; failure: string };
  roadmap_order: number;
  roadmap_tag: string;
  created_at: string;
  // 計算フィールド
  verifications_count?: number;
  priority?: number;
}

export default function HypothesisRoadmapPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  
  // 状態変数
  const [isLoading, setIsLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState<{name: string, description: string} | null>(null);
  const [roadmapHypotheses, setRoadmapHypotheses] = useState<RoadmapHypothesis[]>([]);
  const [hasRoadmap, setHasRoadmap] = useState(false);
  const [allValidations, setAllValidations] = useState<Array<{
    id: string;
    hypothesis_id: string;
    result: string;
    evidence: string;
    created_at: string;
  }>>([]);
  
  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!projectId) {
          throw new Error('プロジェクトIDが取得できません');
        }

        // プロジェクト情報の取得
        const { data: project, error } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', projectId)
          .single();
          
        if (error) {
          console.error('プロジェクト情報取得エラー:', error);
          throw new Error('プロジェクト情報の取得に失敗しました');
        }
        setProjectInfo(project);
        
        // ロードマップ用の仮説を取得
        const { data: hypotheses, error: hypothesesError } = await supabase
          .from('hypotheses')
          .select(`
            id,
            title,
            assumption,
            solution,
            expected_effect,
            type,
            status,
            impact,
            uncertainty,
            confidence,
            verification_methods,
            success_criteria,
            next_steps,
            roadmap_order,
            roadmap_tag,
            created_at
          `)
          .eq('project_id', projectId)
          .eq('roadmap_tag', 'roadmap')
          .order('roadmap_order', { ascending: true });
          
        if (hypothesesError) {
          console.error('仮説データ取得エラー - 詳細:', {
            error: hypothesesError,
            query: `project_id=eq.${projectId}&roadmap_tag=eq.roadmap`,
            table: 'hypotheses'
          });
          throw new Error(`仮説データの取得に失敗しました: ${hypothesesError.message}`);
        }
        
        if (!hypotheses || hypotheses.length === 0) {
          setHasRoadmap(false);
          setIsLoading(false);
          return;
        }

        setHasRoadmap(true);
        
        // 検証記録の取得（各仮説の検証数をカウントするため）
        const { data: validations, error: validationsError } = await supabase
          .from('validations')
          .select('*')
          .in('hypothesis_id', hypotheses.map((h: RoadmapHypothesis) => h.id));
          
        if (validationsError) {
          console.error('検証データ取得エラー:', validationsError);
          throw new Error('検証データの取得に失敗しました');
        }
        setAllValidations(validations || []);
          
        // 各仮説の検証数をカウント
        const hypothesesWithCounts = hypotheses.map((h: RoadmapHypothesis) => {
          const verificationCount = validations 
            ? validations.filter((v) => v.hypothesis_id === h.id).length 
            : 0;
            
          // 優先度の計算（影響度×不確実性）
          const priority = h.impact * h.uncertainty;
          
          return {
            ...h,
            verifications_count: verificationCount,
            priority
          };
        });
        
        setRoadmapHypotheses(hypothesesWithCounts);
      } catch (err) {
        console.error('データ取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      fetchData();
    }
  }, [projectId]);
  
  // 仮説ステータスを視覚的に表示するためのヘルパー関数を追加
  const getHypothesisStatusBadge = (status: string) => {
    switch (status) {
      case '成立':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">成立</span>;
      case '否定':
        return <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-700 border border-rose-200">否定</span>;
      case '検証中':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">検証中</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">未検証</span>;
    }
  };
  
  // 仮説のステータスに基づいて現在のステップを判断
  const getCurrentStepIndex = (): number => {
    // すべての検証が始まっている仮説（成立、否定または検証中）のインデックスを取得
    const activeIndices = roadmapHypotheses
      .map((h, index) => ({ 
        index, 
        active: h.verifications_count && h.verifications_count > 0 
      }))
      .filter(item => item.active)
      .map(item => item.index);
    
    if (activeIndices.length === 0) return 0; // アクティブな仮説がない場合は最初のステップ
    
    // 最後のアクティブな仮説の次のステップを現在のステップとする
    const lastActiveIndex = Math.max(...activeIndices);
    let nextIndex = lastActiveIndex + 1;
    
    // 範囲内に収める
    if (nextIndex >= roadmapHypotheses.length) {
      nextIndex = roadmapHypotheses.length - 1;
    }
    
    return nextIndex;
  };
  
  // 仮説の検証ステータスを取得
  const getHypothesisStatus = (hypothesis: RoadmapHypothesis, index: number) => {
    const currentStep = getCurrentStepIndex();
    
    // 仮説が「成立」または「否定」の場合のみ完了とみなす
    if ((hypothesis.status === '成立' || hypothesis.status === '否定') && 
        hypothesis.verifications_count && hypothesis.verifications_count > 0) {
      return 'completed'; // 検証済み
    } else if (hypothesis.verifications_count && hypothesis.verifications_count > 0) {
      // 検証はされているが、まだ成立/否定になっていない（検証中）
      return 'inProgress'; // 追加した状態
    } else if (index === currentStep) {
      return 'current'; // 現在のステップ
    } else if (index < currentStep) {
      return 'skipped'; // スキップされたステップ
    } else {
      return 'locked'; // まだ到達していないステップ
    }
  };
  
  // 進捗率の計算 (成立または否定の仮説のみ完了とカウント)
  const calculateProgress = (): number => {
    if (roadmapHypotheses.length === 0) return 0;
    
    const completedCount = roadmapHypotheses.filter((h: RoadmapHypothesis) => 
      (h.status === '成立' || h.status === '否定') &&
      h.verifications_count !== undefined && h.verifications_count > 0
    ).length;
    
    return Math.round((completedCount / roadmapHypotheses.length) * 100);
  };
  
  // 検証中の仮説の割合を計算
  const calculateInProgressPercentage = (): number => {
    if (roadmapHypotheses.length === 0) return 0;
    
    const inProgressCount = roadmapHypotheses.filter((h: RoadmapHypothesis) => 
      h.status !== '成立' && h.status !== '否定' &&
      h.verifications_count !== undefined && h.verifications_count > 0
    ).length;
    
    return Math.round((inProgressCount / roadmapHypotheses.length) * 100);
  };
  
  // AIサポートページに移動して仮説ロードマップを作成
  const createRoadmap = () => {
    if (!projectId) {
      console.error('プロジェクトIDが取得できません');
      return;
    }
    // 直接AIサポートページに移動し、ロードマップモードを選択するよう案内
    router.push(`/projects/${projectId}/hypotheses/ai?mode=roadmap`);
  };
  
  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">仮説ロードマップ</h1>
      
      {projectInfo && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-3 hover:shadow-md transition-all duration-300 mb-8">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{projectInfo.name}</h2>
          {projectInfo.description && (
            <p className="text-slate-600 text-sm">{projectInfo.description}</p>
          )}
         <div className="flex justify-end">
          <Link
            href={`/projects/${projectId}/roadmap/manual`}
            className="border border-violet-300 bg-violet-50 text-violet-700 text-sm px-5 py-2 rounded-full hover:bg-violet-100 transition-all duration-300 flex items-center gap-2 shadow-sm"
          >
            <Settings className="text-violet-500 w-5 h-5" />
            <span className="font-medium">マニュアルで作成</span>
          </Link>
        </div>
        </div>
        
      )}

      
      {/* ロードマップがない場合の作成ガイド */}
      {!hasRoadmap && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-20 w-20 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">仮説ロードマップがまだ作成されていません</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            仮説ロードマップは、プロジェクト成功のために検証すべき重要な仮説を
            段階的に整理したものです。AIサポートを使って簡単に作成できます。
          </p>
          <button
            onClick={createRoadmap}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg transition-all"
          >
            <Star size={18} />
            AIで仮説ロードマップを作成
          </button>
        </div>
      )}
      
      {/* ロードマップの表示 */}
      {hasRoadmap && (
        <div className="space-y-8">
          {/* 進捗サマリー */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">プロジェクト検証ロードマップ</h3>
                <p className="text-indigo-100">
                  {/* 成立または否定の仮説数 */}
                  <span className="font-medium">
                    {roadmapHypotheses.filter((h: RoadmapHypothesis) => 
                      (h.status === '成立' || h.status === '否定') &&
                      h.verifications_count !== undefined && h.verifications_count > 0
                    ).length}
                  </span>
                  {" / "}
                  {roadmapHypotheses.length} ステップ完了
                  {/* 検証中の仮説数 */}
                  <span className="ml-2">
                    (検証中: {roadmapHypotheses.filter((h: RoadmapHypothesis) => 
                      h.status !== '成立' && h.status !== '否定' &&
                      h.verifications_count !== undefined && h.verifications_count > 0
                    ).length}件)
                  </span>
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">
                  {calculateProgress()}%
                </div>
                <div className="text-indigo-100 text-sm">完了率</div>
              </div>
            </div>
            
            {/* 進捗バー - 進行中も視覚的に表示 */}
            <div className="mt-4 bg-indigo-300 bg-opacity-30 h-2 rounded-full overflow-hidden relative">
              {/* 完了した部分 */}
              <div 
                className="absolute top-0 left-0 bottom-0 bg-white rounded-full"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
              
              {/* 検証中の部分（別の色で表示） */}
              <div
                className="absolute top-0 bottom-0 bg-amber-300"
                style={{ 
                  width: `${calculateInProgressPercentage()}%`,
                  left: `${calculateProgress()}%`
                }}
              ></div>
            </div>
            
            {/* 進捗バーの凡例 */}
            <div className="mt-2 flex items-center justify-end text-xs">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-white rounded-full mr-1"></div>
                <span>完了</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-300 rounded-full mr-1"></div>
                <span>検証中</span>
              </div>
            </div>
          </div>
          
          {/* ロードマップステップ表示 */}
          <div className="relative">
            {/* 左側の進捗線 */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200"></div>
            
            {roadmapHypotheses.map((hypothesis, index) => {
              // 仮説の状態を判断
              const stepStatus = getHypothesisStatus(hypothesis, index);
              
              // ステップの状態に基づくスタイルとアイコンの決定
              let stepStyle = "";
              let statusIcon = null;
              
              switch (stepStatus) {
                case 'completed':
                  // 成立と否定で色を分ける
                  if (hypothesis.status === '成立') {
                    stepStyle = "border-emerald-200 bg-emerald-50";
                    statusIcon = <CheckCircle className="w-10 h-10 text-emerald-500" />;
                  } else { // 否定
                    stepStyle = "border-rose-200 bg-rose-50";
                    statusIcon = <CheckCircle className="w-10 h-10 text-rose-500" />;
                  }
                  break;
                case 'inProgress': // 検証中の状態を追加
                  stepStyle = "border-amber-200 bg-amber-50";
                  statusIcon = <FlaskConical className="w-10 h-10 text-amber-500" />;
                  break;
                case 'current':
                  stepStyle = "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100";
                  statusIcon = <Star className="w-10 h-10 text-indigo-500" />;
                  break;
                case 'skipped':
                  stepStyle = "border-slate-300 bg-slate-50";
                  statusIcon = <ArrowRight className="w-10 h-10 text-slate-500" />;
                  break;
                case 'locked':
                  stepStyle = "border-slate-200 bg-slate-50 opacity-70";
                  statusIcon = <Loader2 className="w-10 h-10 text-slate-400" />;
                  break;
              }
              
              return (
                <div key={hypothesis.id} className="relative ml-16 mb-8">
                  {/* ステップアイコン (進捗線上に配置) */}
                  <div className="absolute -left-12 top-4 bg-white rounded-full p-1">
                    {statusIcon}
                  </div>
                  
                  {/* ステップカード */}
                  <div className={`border rounded-xl p-6 ${stepStyle}`}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        {index + 1}. {hypothesis.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getHypothesisStatusBadge(hypothesis.status)}
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                          {hypothesis.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">前提:</h4>
                        <p className="text-sm text-slate-600">{hypothesis.assumption}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">解決策:</h4>
                        <p className="text-sm text-slate-600">{hypothesis.solution}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">期待される効果:</h4>
                        <p className="text-sm text-slate-600">{hypothesis.expected_effect}</p>
                      </div>
                    </div>
                    
                    {/* 検証方法 */}
                    {hypothesis.verification_methods && hypothesis.verification_methods.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">推奨される検証方法:</h4>
                        <div className="flex flex-wrap gap-2">
                          {hypothesis.verification_methods.map((method, i) => (
                            <span key={i} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 成功基準 */}
                    {hypothesis.success_criteria && (
                      <div className="mb-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-amber-800 mb-1">成功基準:</h4>
                        <p className="text-sm text-amber-700">{hypothesis.success_criteria}</p>
                      </div>
                    )}
                    
                    {/* 次のステップ情報 */}
                    {hypothesis.next_steps && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-emerald-800 mb-1">検証成功時:</h4>
                          <p className="text-sm text-emerald-700">{hypothesis.next_steps.success}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-rose-800 mb-1">検証失敗時:</h4>
                          <p className="text-sm text-rose-700">{hypothesis.next_steps.failure}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* アクションボタン - 状態によって表示を変える */}
                    <div className="mt-4 flex gap-3">
                      {stepStatus === 'locked' ? (
                        <div className="text-sm text-slate-500 italic">
                          前のステップを検証すると解除されます
                        </div>
                      ) : stepStatus === 'completed' ? (
                        <div className={`flex items-center gap-2 ${hypothesis.status === '成立' ? "text-emerald-600" : "text-rose-600"}`}>
                          <CheckCircle size={16} />
                          <span>{hypothesis.status === '成立' ? '成立' : '否定'}</span>
                          
                          {projectId ? (
                            <Link 
                              href={`/projects/${projectId}/hypotheses/${hypothesis.id}`}
                              className="ml-auto text-indigo-600 hover:text-indigo-800"
                            >
                              詳細を見る →
                            </Link>
                          ) : (
                            <span className="ml-auto text-slate-400 cursor-not-allowed">
                              詳細を見る →
                            </span>
                          )}
                        </div>
                      ) : stepStatus === 'inProgress' ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <FlaskConical size={16} />
                          <span>検証中</span>
                          
                          <Link 
                            href={`/projects/${projectId}/hypotheses/${hypothesis.id}`}
                            className="ml-auto text-indigo-600 hover:text-indigo-800"
                          >
                            詳細を見る →
                          </Link>
                        </div>
                      ) : stepStatus === 'skipped' ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <ArrowRight size={16} />
                          <span>このステップはスキップされました</span>
                          
                          <Link 
                            href={`/projects/${projectId}/hypotheses/${hypothesis.id}`}
                            className="ml-auto text-indigo-600 hover:text-indigo-800"
                          >
                            詳細を見る →
                          </Link>
                        </div>
                      ) : (
                        <>
                          {/* 現在のステップの場合 */}
                          <Link
                            href={`/projects/${projectId}/hypotheses/${hypothesis.id}`}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            この仮説を検証する
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* ゴール表示 - すべてのステップが完了した場合 */}
            {calculateProgress() === 100 && (
              <div className="relative ml-16 mb-8">
                <div className="absolute -left-12 top-4 bg-white rounded-full p-1">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
                
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-amber-800 mb-2">検証完了！</h3>
                  <p className="text-amber-700">
                    おめでとうございます！全ての仮説検証ステップが完了しました。
                    これらの検証結果を基に、プロジェクトを自信を持って進めることができます。
                  </p>
                  
                  <div className="mt-4">
                    <Link
                      href={`/projects/${projectId}/hypotheses`}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                    >
                      すべての仮説を確認する →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 仮説ステータスの説明 */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 mb-6">
            <h3 className="font-medium text-slate-800">仮説ステータスの説明</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-700"><strong className="text-emerald-700">成立</strong>: 仮説が検証され正しいと確認された状態</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-slate-700"><strong className="text-rose-700">否定</strong>: 仮説が検証され誤りだと確認された状態</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-slate-700"><strong className="text-amber-700">検証中</strong>: 検証が進行中で結論が出ていない状態</span>
              </div>
            </div>
          </div>
          
          {/* ロードマップに関する説明 */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
            <h3 className="font-medium text-slate-800 mb-2">仮説ロードマップについて</h3>
            <p className="mb-2 text-sm text-slate-600">
              仮説ロードマップは、プロジェクト成功に必要な検証ステップを順序立てて整理したものです。
              各ステップの仮説を順番に検証していくことで、効率的にプロジェクトの不確実性を減らしていくことができます。
            </p>
            <p className="text-sm text-slate-600">
            上記の仮説は標準的な検証フローに沿って生成されています。
              各仮説の詳細ページでは、検証結果を記録したり、仮説をバージョンアップすることができます。
              検証が開始されると次のステップに進めますが、最終的な判断（成立または否定）が行われることで仮説が完了したとみなされます。
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-700">ロードマップの進め方のヒント:</strong> 各ステップは単に順番に検証するだけでなく、
                得られた学びを次の仮説検証に活かしていくことが重要です。
                否定された仮説からも貴重な学びが得られ、それが次の成功につながることがあります。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}