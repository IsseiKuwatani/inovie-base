'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ChevronRight,
  BookOpen,
  ArrowRight,
  BarChart,
  Calendar,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react'

export default function EditValidationPage() {
  const { id: projectId, hid: hypothesisId, vid: validationId } = useParams()
  const router = useRouter()
  const [validation, setValidation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    validation_type: '定性',
    method: '',
    description: '',
    success_criteria: '',
    actual_metrics: '',
    result: '',
    confidence_level: 3,
    learnings: '',
    next_steps: ''
  })

  useEffect(() => {
    const fetchValidation = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('validations')
        .select('*')
        .eq('id', validationId)
        .single()

      if (error) {
        console.error('読み込みエラー:', error)
        setError('検証データの取得に失敗しました')
      } else {
        setValidation(data)
        setForm({
          validation_type: data.validation_type || '定性',
          method: data.method || '',
          description: data.description || '',
          success_criteria: data.success_criteria || '',
          actual_metrics: data.actual_metrics || '',
          result: data.result || '',
          confidence_level: data.confidence_level || 3,
          learnings: data.learnings || '',
          next_steps: data.next_steps || ''
        })
      }
      setLoading(false)
    }

    fetchValidation()
  }, [validationId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleConfidenceChange = (value: number) => {
    setForm((prev) => ({ ...prev, confidence_level: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('validations')
        .update({
          validation_type: form.validation_type,
          method: form.method,
          description: form.description,
          success_criteria: form.success_criteria,
          actual_metrics: form.actual_metrics,
          result: form.result,
          confidence_level: form.confidence_level,
          learnings: form.learnings,
          next_steps: form.next_steps
        })
        .eq('id', validationId)

      if (error) throw new Error(error.message)
      router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
    } catch (err: any) {
      setError('検証の更新に失敗しました: ' + (err.message || ''))
      setIsSubmitting(false)
    }
  }

  // 確信度に応じた色を取得
  const getConfidenceColor = (level: number) => {
    if (level >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (level >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!validation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 text-center">
          <h2 className="text-xl font-semibold mb-2">検証データが見つかりません</h2>
          <p className="text-sm">この検証は削除されたか、アクセス権がありません</p>
          <Link href={`/projects/${projectId}/hypotheses/${hypothesisId}`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
            仮説詳細に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
        className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>仮説詳細に戻る</span>
      </Link>

      <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">
        検証を編集
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">検証タイプ</label>
            <select
              name="validation_type"
              value={form.validation_type}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="定性">定性的検証（インタビュー・観察など）</option>
              <option value="定量">定量的検証（アンケート・データ分析など）</option>
              <option value="実験">実験（プロトタイプ・A/Bテストなど）</option>
              <option value="PoC">概念実証（PoC）</option>
              <option value="その他">その他</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">検証手段</label>
            <input
              type="text"
              name="method"
              value={form.method}
              onChange={handleChange}
              placeholder="例: ユーザーインタビュー、アンケート調査、プロトタイプテスト"
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">検証内容</label>
          <textarea
                       name="description"
                       value={form.description}
                       onChange={handleChange}
                       placeholder="どのような検証を行ったか、詳細に記述してください。"
                       rows={4}
                       className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                     />
                   </div>
           
                   <div className="grid md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1.5">成功基準</label>
                       <textarea
                         name="success_criteria"
                         value={form.success_criteria}
                         onChange={handleChange}
                         placeholder="この検証が成功と言えるための基準は何ですか？"
                         rows={3}
                         className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1.5">実際の指標結果</label>
                       <textarea
                         name="actual_metrics"
                         value={form.actual_metrics}
                         onChange={handleChange}
                         placeholder="検証で得られた数値や定量的な結果があれば記入してください。"
                         rows={3}
                         className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                       />
                     </div>
                   </div>
           
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1.5">結果・気づき</label>
                     <textarea
                       name="result"
                       value={form.result}
                       onChange={handleChange}
                       placeholder="検証結果から得られた洞察や気づきを記入してください。"
                       rows={4}
                       className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                     />
                   </div>
           
                   <div className="border-t border-slate-100 pt-6">
                     <div className="mb-6">
                       <label className="block text-sm font-medium text-slate-700 mb-3">確信度</label>
                       <p className="text-xs text-slate-500 mb-4">この検証結果に基づいて、仮説について自信を持てる度合いを選択してください。</p>
                       
                       <div className="grid grid-cols-5 gap-2">
                         {[1, 2, 3, 4, 5].map((level) => (
                           <button
                             key={level}
                             type="button"
                             onClick={() => handleConfidenceChange(level)}
                             className={`py-3 px-1 rounded-md transition-colors border ${
                               form.confidence_level === level
                                 ? getConfidenceColor(level)
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                             } hover:shadow-sm`}
                           >
                             <div className="text-sm font-medium">{level}</div>
                             <div className="text-xs mt-1">
                               {level === 1 && '非常に低い'}
                               {level === 2 && '低い'}
                               {level === 3 && '中程度'}
                               {level === 4 && '高い'}
                               {level === 5 && '非常に高い'}
                             </div>
                           </button>
                         ))}
                       </div>
                     </div>
           
                     <div className="grid md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1.5">学び</label>
                         <textarea
                           name="learnings"
                           value={form.learnings}
                           onChange={handleChange}
                           placeholder="この検証から得られた学びは何ですか？"
                           rows={3}
                           className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1.5">次のアクション</label>
                         <textarea
                           name="next_steps"
                           value={form.next_steps}
                           onChange={handleChange}
                           placeholder="この検証結果を踏まえて、次に何をしますか？"
                           rows={3}
                           className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                         />
                       </div>
                     </div>
                   </div>
           
                   <div className="flex items-center justify-end gap-4 pt-4">
                     <Link
                       href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
                       className="px-5 py-2.5 text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
                     >
                       キャンセル
                     </Link>
                     <button
                       type="submit"
                       disabled={isSubmitting}
                       className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                       {isSubmitting ? '更新中...' : '検証を更新'}
                       {!isSubmitting && <ChevronRight size={16} />}
                     </button>
                   </div>
                 </form>
               </div>
             )
           }
           
