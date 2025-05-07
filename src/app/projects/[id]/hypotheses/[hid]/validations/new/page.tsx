'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  ArrowLeft,
  FlaskConical,
  CheckCircle,
  HelpCircle,
  Info,
  Lightbulb,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronRight,
  BarChart
} from 'lucide-react'

export default function NewValidationPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()
  const [hypothesis, setHypothesis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showHelpContent, setShowHelpContent] = useState(false)
  
  const [form, setForm] = useState({
    validation_type: '定性',
    method: '',
    description: '',
    success_criteria: '',
    actual_metrics: '',
    result: '',
    confidence_level: 3,
    learnings: '',
    next_steps: '',
    // 仮説ステータスの明示的な変更はしない
  })

  useEffect(() => {
    const fetchHypothesis = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()

      if (error) {
        console.error('読み込みエラー:', error)
        setError('仮説データの取得に失敗しました')
      } else {
        setHypothesis(data)
      }
      setLoading(false)
    }

    fetchHypothesis()
  }, [hypothesisId])

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
      const { error } = await supabase.from('validations').insert([
        {
          hypothesis_id: hypothesisId,
          validation_type: form.validation_type,
          method: form.method,
          description: form.description,
          success_criteria: form.success_criteria,
          actual_metrics: form.actual_metrics,
          result: form.result,
          confidence_level: form.confidence_level,
          learnings: form.learnings,
          next_steps: form.next_steps
        }
      ])

      if (error) throw new Error(error.message)
      
      // 仮説ステータス更新ダイアログは表示しない
      // 検証登録後は詳細ページに戻るだけ
      router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
    } catch (err: any) {
      setError('検証の保存に失敗しました: ' + (err.message || ''))
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

  if (!hypothesis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 text-center">
          <h2 className="text-xl font-semibold mb-2">仮説が見つかりません</h2>
          <p className="text-sm">この仮説は削除されたか、アクセス権がありません</p>
          <Link href={`/projects/${projectId}/hypotheses`} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
            仮説一覧に戻る
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          検証を追加
        </h1>
        <button
          type="button"
          onClick={() => setShowHelpContent(!showHelpContent)}
          className="flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:border-indigo-200 hover:text-indigo-600 transition-colors"
        >
          <Lightbulb size={16} className="text-amber-500" />
          <span>{showHelpContent ? 'ヒントを隠す' : '検証のヒントを見る'}</span>
        </button>
      </div>

      {showHelpContent && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-amber-800">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Lightbulb className="text-amber-500" />
            <span>効果的な検証のヒント</span>
          </h3>
          <div className="space-y-4 text-sm">
            <p>
              <strong>検証は仮説を強くするために行う重要なステップです。</strong> 以下のポイントを意識すると、より効果的な検証ができます。
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>明確な成功基準を設定する：</strong> 何をもって成功とみなすか、あらかじめ決めておきましょう。</li>
              <li><strong>小さく始める：</strong> 大がかりな検証よりも、小さく素早く検証を繰り返す方が効果的です。</li>
              <li><strong>数値化できる部分は数値化する：</strong> 主観だけでなく、客観的な指標も取り入れましょう。</li>
              <li><strong>予想外の発見も記録する：</strong> 検証過程で見つかった予想外の気づきも重要なデータです。</li>
              <li><strong>次のアクションを明確にする：</strong> 検証結果を踏まえて次に何をするか決めておきましょう。</li>
            </ul>
          </div>
        </div>
      )}

      {/* 対象の仮説情報 */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-slate-500 mb-1">検証対象の仮説</div>
            <h2 className="text-lg font-semibold text-slate-800">{hypothesis.title}</h2>
          </div>
          <Link
            href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            詳細を見る
          </Link>
        </div>
      </div>

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
            {isSubmitting ? '保存中...' : '検証を保存'}
            {!isSubmitting && <ChevronRight size={16} />}
          </button>
        </div>
      </form>
      
      {/* 検証の重要性解説パネル */}
      <div className="mt-10 bg-slate-50 border border-slate-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Info className="text-indigo-500" size={20} />
          <span>効果的な仮説検証のサイクル</span>
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-medium">
              <FlaskConical size={18} />
              <span>1. マップ</span>
            </div>
            <p className="text-slate-600">
              仮説の全体像を把握し、検証すべき重要な部分を特定します。不確実性が高く影響度の大きい部分を優先的に検証しましょう。
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-amber-600 font-medium">
              <BarChart size={18} />
              <span>2. ループ</span>
            </div>
            <p className="text-slate-600">
              検証と学びのループを回して仮説を磨きます。素早く検証を繰り返し、各検証から学びを得ることが重要です。
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-medium">
              <CheckCircle size={18} />
              <span>3. リープ</span>
            </div>
            <p className="text-slate-600">
              十分な検証ができたら決断して前に進みます。すべてが100%確信を持てるまで待つのではなく、適切なタイミングで意思決定することも大切です。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}