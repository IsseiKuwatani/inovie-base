'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Trophy, Star, CheckCircle, X, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// 仮説タイプ定義
type RoadmapHypothesis = {
  id: string;
  title: string;
  premise: string;
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
  const [allVerifications, setAllVerifications] = useState<Array<{
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
            premise,
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
        const { data: verifications, error: verificationsError } = await supabase
          .from('hypothesis_verifications')
          .select('*')
          .in('hypothesis_id', hypotheses.map((h: RoadmapHypothesis) => h.id));
          
        if (verificationsError) {
          console.error('検証データ取得エラー:', verificationsError);
          throw new Error('検証データの取得に失敗しました');
        }
        setAllVerifications(verifications || []);
          
        // 各仮説の検証数をカウント
        const hypothesesWithCounts = hypotheses.map((h: RoadmapHypothesis) => {
          const verificationCount = verifications 
            ? verifications.filter((v: {hypothesis_id: string}) => v.hypothesis_id === h.id).length 
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
  
  // 仮説のステータスに基づいて現在のステップを判断
  const getCurrentStepIndex = (): number => {
    const verifiedIndex = roadmapHypotheses.findIndex((h: RoadmapHypothesis) => 
      h.verifications_count !== undefined && h.verifications_count > 0
    );
    
    if (verifiedIndex === -1) return 0; // どの仮説も検証されていない場合は最初のステップ
    
    // 連続して検証されている最後のステップを探す
    let currentIndex = 0;
    for (let i = 0; i <= verifiedIndex; i++) {
      const hypothesis = roadmapHypotheses[i];
      if (hypothesis && hypothesis.verifications_count && hypothesis.verifications_count > 0) {
        currentIndex = i + 1;
        if (currentIndex >= roadmapHypotheses.length) {
          currentIndex = roadmapHypotheses.length - 1;
        }
      } else {
        break;
      }
    }
    
    return currentIndex;
  };
  
  // 仮説の検証ステータスを取得
  const getHypothesisStatus = (hypothesis: RoadmapHypothesis, index: number) => {
    const currentStep = getCurrentStepIndex();
    
    if (hypothesis.verifications_count && hypothesis.verifications_count > 0) {
      return 'completed'; // 検証済み
    } else if (index === currentStep) {
      return 'current'; // 現在のステップ
    } else if (index < currentStep) {
      return 'skipped'; // スキップされたステップ
    } else {
      return 'locked'; // まだ到達していないステップ
    }
  };
  
  // 進捗率の計算
  const calculateProgress = (): number => {
    if (roadmapHypotheses.length === 0) return 0;
    
    const verifiedCount = roadmapHypotheses.filter((h: RoadmapHypothesis) => 
      h.verifications_count !== undefined && h.verifications_count > 0
    ).length;
    
    return Math.round((verifiedCount / roadmapHypotheses.length) * 100);
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
                  {roadmapHypotheses.filter((h: RoadmapHypothesis) => h.verifications_count !== undefined && h.verifications_count > 0).length} / {roadmapHypotheses.length} ステップ完了
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">
                  {calculateProgress()}%
                </div>
                <div className="text-indigo-100 text-sm">完了率</div>
              </div>
            </div>
            
            {/* 進捗バー */}
            <div className="mt-4 bg-indigo-300 bg-opacity-30 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
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
                  stepStyle = "border-emerald-200 bg-emerald-50";
                  statusIcon = <CheckCircle className="w-10 h-10 text-emerald-500" />;
                  break;
                case 'current':
                  stepStyle = "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100";
                  statusIcon = <Star className="w-10 h-10 text-indigo-500" />;
                  break;
                case 'skipped':
                  stepStyle = "border-amber-200 bg-amber-50";
                  statusIcon = <ArrowRight className="w-10 h-10 text-amber-500" />;
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
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                        {hypothesis.type}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">前提:</h4>
                        <p className="text-sm text-slate-600">{hypothesis.premise}</p>
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
                          前のステップを完了させると解除されます
                        </div>
                      ) : stepStatus === 'completed' ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle size={16} />
                          <span>検証完了</span>
                          
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
                      ) : stepStatus === 'skipped' ? (
                        <div className="flex items-center gap-2 text-amber-600">
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
          
          {/* ロードマップに関する説明 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm text-slate-600 mt-8">
            <h3 className="font-medium text-slate-800 mb-2">仮説ロードマップについて</h3>
            <p className="mb-2">
              仮説ロードマップは、プロジェクト成功に必要な検証ステップを順序立てて整理したものです。
              各ステップの仮説を順番に検証していくことで、効率的にプロジェクトの不確実性を減らしていくことができます。
            </p>
            <p>
              上記の仮説は標準的な検証フローに沿って生成されています。
              各仮説の詳細ページでは、検証結果を記録したり、仮説をバージョンアップすることができます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
