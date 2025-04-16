'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  Pencil,
  ArrowLeft,
  FlaskConical,
  Calendar,
  AlertTriangle,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  FileText,
  ArrowRightLeft,
  Lightbulb,
  Loader2,
  BookOpen,
  ArrowRight,
  BarChart,
  Info
} from 'lucide-react'

export default function HypothesisDetailPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()
  const [hypothesis, setHypothesis] = useState<any>(null)
  const [validations, setValidations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null)

  useEffect(() => {
    const fetchHypothesis = async () => {
      const { data } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()
      setHypothesis(data)
    }

    const fetchValidations = async () => {
      const { data } = await supabase
        .from('validations')
        .select('*')
        .eq('hypothesis_id', hypothesisId)
        .order('created_at', { ascending: false })
      setValidations(data || [])
    }

    Promise.all([fetchHypothesis(), fetchValidations()]).finally(() =>
      setLoading(false)
    )
  }, [hypothesisId])

  const handleDelete = async (validationId: string) => {
    const confirm = window.confirm('この検証を削除してもよろしいですか？')
    if (!confirm) return

    setDeleteInProgress(validationId)
    
    try {
      const { error } = await supabase
        .from('validations')
        .delete()
        .eq('id', validationId)

      if (!error) {
        setValidations((prev) => prev.filter((v) => v.id !== validationId))
      }
    } finally {
      setDeleteInProgress(null)
    }
  }

  const getStatusDetails = (status: string) => {
    switch (status) {
      case '未検証':
        return { 
          color: 'bg-slate-500', 
          hoverColor: 'hover:bg-slate-600',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: <HelpCircle size={16} /> 
        };
      case '検証中':
        return { 
          color: 'bg-amber-500', 
          hoverColor: 'hover:bg-amber-600',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: <AlertTriangle size={16} /> 
        };
      case '成立':
        return { 
          color: 'bg-emerald-500', 
          hoverColor: 'hover:bg-emerald-600',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: <CheckCircle size={16} /> 
        };
      case '否定':
        return { 
          color: 'bg-rose-500', 
          hoverColor: 'hover:bg-rose-600',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          icon: <XCircle size={16} /> 
        };
      default:
        return { 
          color: 'bg-slate-300', 
          hoverColor: 'hover:bg-slate-400',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: <HelpCircle size={16} /> 
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }
  
  if (!hypothesis) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 text-center">
          <h2 className="text-xl font-semibold mb-2">仮説が見つかりません</h2>
          <p className="text-sm">この仮説は削除されたか、アクセス権がありません</p>
          <Link href={`/projects/${projectId}/hypotheses`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
            仮説一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const statusDetails = getStatusDetails(hypothesis.status);
  const priority = hypothesis.impact * hypothesis.uncertainty;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* ヘッダー */}
      <div>
        <Link
          href={`/projects/${projectId}/hypotheses`}
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>仮説一覧に戻る</span>
        </Link>
        
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{hypothesis.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 ${statusDetails.color}`}>
                {statusDetails.icon}
                {hypothesis.status}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                <FileText size={14} />
                {hypothesis.type}
              </span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                <ArrowRightLeft size={14} />
                優先度: {priority}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/projects/${projectId}/hypotheses/${hypothesisId}/edit`}
              className="flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-full hover:border-indigo-200 hover:text-indigo-600 transition-colors"
            >
              <Pencil size={16} />
              <span>編集</span>
            </Link>
            <Link
              href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/new`}
              className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-full hover:shadow-md transition-all duration-300"
            >
              <FlaskConical size={16} />
              <span>検証を追加</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 詳細表示 */}
      <div className="grid md:grid-cols-2 gap-6">
        <DetailBlock 
          label="前提" 
          value={hypothesis.assumption} 
          icon={<Lightbulb size={16} className="text-amber-500" />}
        />
        <DetailBlock 
          label="解決策" 
          value={hypothesis.solution} 
          icon={<FileText size={16} className="text-indigo-500" />}
        />
        <DetailBlock 
          label="期待される効果" 
          value={hypothesis.expected_effect} 
          icon={<CheckCircle size={16} className="text-emerald-500" />}
        />
        <div className="flex flex-col space-y-3">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-indigo-500" />
            影響度 × 不確実性マップ
          </p>
          <div className={`bg-white border border-slate-200 rounded-xl p-4 ${statusDetails.bgColor}`}>
            <MiniMap impact={hypothesis.impact} uncertainty={hypothesis.uncertainty} />
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">影響度</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{hypothesis.impact}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">不確実性</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{hypothesis.uncertainty}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">確信度</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{hypothesis.confidence}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 検証履歴 */}
      <div className="border-t border-slate-100 pt-8">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <FlaskConical size={20} className="text-indigo-500" />
          <span>検証履歴</span>
        </h2>

        {validations.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
            <FlaskConical className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-700">検証が記録されていません</h3>
            <p className="mt-2 text-slate-500">「検証を追加」ボタンから新しい検証を記録しましょう</p>
            <Link
              href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/new`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:shadow-lg transition-all duration-300 text-sm"
            >
              <FlaskConical size={16} />
              <span>検証を追加する</span>
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {validations.map((v) => (
              <li key={v.id} className="bg-white border border-slate-100 rounded-xl shadow-sm relative group hover:border-indigo-200 transition-all duration-300">
{/* ヘッダー部分 */}
<div className="p-5 border-b border-slate-100 relative">
  {/* 操作アイコン - 絶対位置で右上に配置 */}
  <div className="absolute top-4 right-4 flex gap-2 z-10">
    <Link
      href={`/projects/${projectId}/hypotheses/${hypothesisId}/validations/${v.id}/edit`}
      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
      title="編集"
    >
      <Edit2 size={16} />
    </Link>
    <button
      onClick={() => handleDelete(v.id)}
      disabled={deleteInProgress === v.id}
      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
      title="削除"
    >
      {deleteInProgress === v.id ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  </div>

  {/* メイン情報エリア - 右側に十分なマージンを確保 */}
  <div className="mr-20"> {/* 右側に大きめのマージンを設定 */}
    <div className="flex items-start gap-2 mb-3">
      {/* 検証タイプに応じたアイコン */}
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
        v.validation_type === '定性' ? 'bg-indigo-100 text-indigo-600' :
        v.validation_type === '定量' ? 'bg-emerald-100 text-emerald-600' :
        v.validation_type === '実験' ? 'bg-amber-100 text-amber-600' :
        v.validation_type === 'PoC' ? 'bg-violet-100 text-violet-600' :
        'bg-slate-100 text-slate-600'
      }`}>
        {v.validation_type === '定性' && <FileText size={16} />}
        {v.validation_type === '定量' && <BarChart size={16} />}
        {v.validation_type === '実験' && <FlaskConical size={16} />}
        {v.validation_type === 'PoC' && <CheckCircle size={16} />}
        {!['定性', '定量', '実験', 'PoC'].includes(v.validation_type) && <HelpCircle size={16} />}
      </span>
      
      <div>
        <div className="text-sm font-medium text-slate-800">{v.validation_type ? `${v.validation_type}的検証: ` : ''}{v.method}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
          <Calendar size={14} className="text-indigo-500" />
          <span>{new Date(v.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="text-slate-300 mx-1">|</span>
          <Clock size={12} className="text-indigo-400" />
          <span>{new Date(v.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
    
    {/* 確信度バッジ - 別の行に配置 */}
    {v.confidence_level && (
      <div className="mt-2">
        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${
          v.confidence_level >= 4 ? 'bg-emerald-100 text-emerald-700' :
          v.confidence_level >= 3 ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          確信度: {v.confidence_level}
        </span>
      </div>
    )}
  </div>
</div>

                   
                {/* コンテンツ部分 */}
                <div className="p-5">
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                        <FileText size={16} className="text-indigo-500" />
                        検証内容
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {v.description || '（未入力）'}
                      </p>
                    </div>
                    
                    {(v.success_criteria || v.actual_metrics) && (
                      <div className="grid md:grid-cols-2 gap-5">
                        {v.success_criteria && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                              <CheckCircle size={16} className="text-emerald-500" />
                              成功基準
                            </h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {v.success_criteria}
                            </p>
                          </div>
                        )}
                        
                        {v.actual_metrics && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                              <BarChart size={16} className="text-violet-500" />
                              実際の指標結果
                            </h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {v.actual_metrics}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                        <Lightbulb size={16} className="text-amber-500" />
                        結果・気づき
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {v.result || '（未入力）'}
                      </p>
                    </div>
                    
                    {(v.learnings || v.next_steps) && (
                      <div className="grid md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-4">
                        {v.learnings && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                              <BookOpen size={16} className="text-indigo-500" />
                              学び
                            </h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {v.learnings}
                            </p>
                          </div>
                        )}
                        
                        {v.next_steps && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                              <ArrowRight size={16} className="text-emerald-500" />
                              次のアクション
                            </h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">
                              {v.next_steps}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {/* 検証プロセスの説明（オプショナル） */}
        {validations.length > 0 && (
          <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
              <Info size={16} className="text-indigo-500" />
              <span>検証の積み重ねが仮説を強化します</span>
            </div>
            <p className="text-sm text-slate-600">
              検証は仮説の信頼性を高めるための重要なステップです。複数の方法で繰り返し検証することで、仮説はより強固になります。
              検証結果から得られた学びを活かして、次のアクションにつなげていきましょう。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailBlock({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <div className="text-sm text-slate-600 whitespace-pre-wrap bg-white border border-slate-200 p-4 rounded-xl h-full">
        {value || '―'}
      </div>
    </div>
  )
}

function ValidationField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="pt-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
      <p className="text-sm text-slate-600 whitespace-pre-wrap ml-6">
        {value || '（未入力）'}
      </p>
    </div>
  )
}

function MiniMap({ impact, uncertainty }: { impact: number; uncertainty: number }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex">
        <div className="flex flex-col justify-center mr-2 text-xs text-slate-500 space-y-2">
          {[5, 4, 3, 2, 1].map((i) => (
            <div key={`impact-${i}`} className="h-5 flex items-center justify-end w-6">
              {i}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
          {[5, 4, 3, 2, 1].map((i) =>
            [1, 2, 3, 4, 5].map((u) => {
              const active = i === impact && u === uncertainty;
              const isHighPriority = i * u >= 20;
              const isMediumPriority = i * u >= 15 && i * u < 20;
              
              let bgColor = 'bg-slate-200';
              if (isHighPriority) {
                bgColor = active ? 'bg-indigo-600' : 'bg-indigo-100';
              } else if (isMediumPriority) {
                bgColor = active ? 'bg-indigo-600' : 'bg-indigo-50';
              }
              
              return (
                <div
                  key={`${i}-${u}`}
                  className={`h-5 w-5 rounded-md ${active ? 'bg-indigo-600 ring-2 ring-indigo-300' : bgColor} transition-colors`}
                  title={`影響度 ${i} / 不確実性 ${u} / 優先度 ${i * u}`}
                />
              )
            })
          )}
        </div>
      </div>
      <div className="flex justify-center mt-2 ml-8 gap-2 text-xs text-slate-500">
        {[1, 2, 3, 4, 5].map((u) => (
          <div key={`uncertainty-${u}`} className="w-5 text-center">
            {u}
          </div>
        ))}
      </div>
    </div>
  )
}
