'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ChevronRight, ArrowLeft, Loader2, AlertCircle, HelpCircle, History } from 'lucide-react'
import Link from 'next/link'
import { saveHypothesisVersion } from '@/utils/saveHypothesisVersion'
import { Hypothesis } from '@/types/hypothesis'

export default function EditHypothesisPage() {
  const { id: projectId, hid: hypothesisId } = useParams()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    assumption: '',
    solution: '',
    expected_effect: '',
    type: '課題仮説',
    status: '未検証',
    impact: 3,
    uncertainty: 3,
    confidence: 3, 
  })

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [existingHypothesis, setExistingHypothesis] = useState<Hypothesis | null>(null)
  
  // バージョン管理のための追加フィールド
  const [validations, setValidations] = useState<{id: string, method: string, learnings: string}[]>([])
  const [selectedValidationId, setSelectedValidationId] = useState<string>('')
  const [modificationReason, setModificationReason] = useState('')

  useEffect(() => {
    const fetchHypothesis = async () => {
      const { data, error } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .single()
  
      if (error) {
        setError('データ取得に失敗しました')
      } else if (data) {
        setForm({
          title: data.title ?? '',
          assumption: data.assumption ?? '',
          solution: data.solution ?? '',
          expected_effect: data.expected_effect ?? '',
          type: data.type ?? '課題仮説',
          status: data.status ?? '未検証',
          impact: data.impact ?? 3,
          uncertainty: data.uncertainty ?? 3,
          confidence: data.confidence ?? 3,
        })
        
        // 既存の仮説データを保存
        setExistingHypothesis(data as Hypothesis)
      }
  
      setLoading(false)
    }
    
    const fetchValidations = async () => {
      const { data, error } = await supabase
        .from('validations')
        .select('id, method, learnings')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setValidations(data)
      }
    }
  
    fetchHypothesis()
    fetchValidations()
  }, [hypothesisId, projectId])
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSlider = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // 現在のユーザーIDを取得
      const { data } = await supabase.auth.getUser()
      const currentUserId = data.user?.id
      
      if (!existingHypothesis) {
        throw new Error('既存のデータが取得できませんでした')
      }

      // 仮説バージョンを保存
      const versionError = await saveHypothesisVersion(
        existingHypothesis, 
        selectedValidationId || undefined, 
        modificationReason || undefined, 
        currentUserId || undefined
      )
      
      if (versionError) {
        throw new Error('バージョン履歴の保存に失敗しました: ' + versionError.message)
      }

      // 仮説を更新
      const { error } = await supabase
        .from('hypotheses')
        .update(form)
        .eq('id', hypothesisId)

      if (error) {
        throw new Error(error.message || '更新に失敗しました')
      } else {
        router.push(`/projects/${projectId}/hypotheses/${hypothesisId}`)
      }
    } catch (err: any) {
      setError('更新に失敗しました: ' + (err.message || ''))
      setIsSubmitting(false)
    }
  }

  // スコアに応じた色を取得
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-indigo-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-slate-600';
  }

  // ボタンの色を取得
  const getButtonColor = (name: string, buttonValue: number, currentValue: number) => {
    if (buttonValue !== currentValue) {
      return 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200';
    }
    
    if (name === 'impact' || name === 'uncertainty') {
      if (buttonValue >= 4) return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      if (buttonValue >= 3) return 'bg-amber-100 text-amber-700 border border-amber-200';
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
    
    // confidence は逆（高いほど良い）
    if (buttonValue >= 4) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (buttonValue >= 3) return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-rose-100 text-rose-700 border border-rose-200';
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href={`/projects/${projectId}/hypotheses/${hypothesisId}`}
          className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>仮説詳細に戻る</span>
        </Link>
        
        <Link
          href={`/projects/${projectId}/hypotheses/${hypothesisId}/history`}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <History size={16} />
          <span>修正履歴を見る</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">仮説を編集</h1>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <Input label="仮説タイトル" name="title" value={form.title} onChange={handleChange} required />
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Textarea 
              label="前提（なぜそう考えるか）" 
              name="assumption" 
              value={form.assumption} 
              onChange={handleChange} 
              placeholder="この仮説を立てた理由や根拠を記入してください"
            />
            
            <Textarea 
              label="解決策（solution）" 
              name="solution" 
              value={form.solution} 
              onChange={handleChange} 
              placeholder="どのように課題を解決するかを具体的に記入してください"
            />
          </div>
          
          <div className="space-y-6">
            <Textarea 
              label="期待される効果" 
              name="expected_effect" 
              value={form.expected_effect} 
              onChange={handleChange} 
              placeholder="この仮説が成立した場合に得られる効果や結果を記入してください"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select label="仮説タイプ" name="type" value={form.type} onChange={handleChange}>
                <option value="課題仮説">課題仮説</option>
                <option value="価値仮説">価値仮説</option>
                <option value="市場仮説">市場仮説</option>
                <option value="価格仮説">価格仮説</option>
                <option value="チャネル仮説">チャネル仮説</option>
              </Select>

              <Select label="ステータス" name="status" value={form.status} onChange={handleChange}>
                <option value="未検証">未検証</option>
                <option value="検証中">検証中</option>
                <option value="成立">成立</option>
                <option value="否定">否定</option>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
            <span>仮説の評価</span>
            <button 
              type="button"
              className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              title="影響度、不確実性、確信度の評価により、仮説の優先度を決定します。"
            >
              <HelpCircle size={14} className="mr-1" />
              <span>評価について</span>
            </button>
          </h3>
          <div className="space-y-6">
            <ScoreSelector 
              label="影響度" 
              description="この仮説が立証された場合のインパクト。市場規模、売上や収益へのインパクト、ユーザー体験の向上度合いなどを考慮します。" 
              name="impact" 
              value={form.impact} 
              onChange={handleSlider} 
              valueColor={getScoreColor(form.impact)}
              getButtonColor={(val) => getButtonColor('impact', val, form.impact)}
              numLabels={["非常に小さい", "小さい", "普通", "大きい", "非常に大きい"]}
            />
            <ScoreSelector 
              label="不確実性" 
              description="どれだけ未知の要素を含むか。技術的な実現可能性、市場の反応、競合状況など、予測が難しい要素の多さを評価します。" 
              name="uncertainty" 
              value={form.uncertainty} 
              onChange={handleSlider} 
              valueColor={getScoreColor(form.uncertainty)}
              getButtonColor={(val) => getButtonColor('uncertainty', val, form.uncertainty)}
              numLabels={["非常に低い", "低い", "普通", "高い", "非常に高い"]}
            />
            <ScoreSelector 
              label="確信度" 
              description="どの程度自信があるか。データや過去の経験、専門知識などに基づいてどの程度確信を持っているかを評価します。" 
              name="confidence" 
              value={form.confidence} 
              onChange={handleSlider} 
              valueColor={getScoreColor(form.confidence)}
              getButtonColor={(val) => getButtonColor('confidence', val, form.confidence)}
              numLabels={["非常に低い", "低い", "普通", "高い", "非常に高い"]}
            />
          </div>
        </div>
        
        {/* バージョン管理のためのセクション追加 */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">修正情報（バージョン管理）</h3>
          <div className="space-y-4">
            <Textarea
              label="修正理由"
              name="modificationReason"
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              placeholder="今回の修正理由を記入してください"
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">参照した検証ログ</label>
              <select
                value={selectedValidationId}
                onChange={(e) => setSelectedValidationId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg mt-1 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">検証ログを選択（任意）</option>
                {validations.map((validation) => (
                  <option key={validation.id} value={validation.id}>
                    {validation.method}: {validation.learnings.substring(0, 50)}...
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">この修正が特定の検証結果に基づいている場合は選択してください</p>
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
            {isSubmitting ? '更新中...' : '変更を保存'}
            {!isSubmitting && <ChevronRight size={16} />}
          </button>
        </div>
      </form>
    </div>
  )
}

/* UI Components */
function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  placeholder = '' 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input 
        name={name} 
        value={value} 
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-3 border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
      />
    </div>
  )
}

function Textarea({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  placeholder = '' 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea 
        name={name} 
        value={value} 
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-3 border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" 
        rows={4} 
      />
    </div>
  )
}

function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  children, 
  required = false 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select 
        name={name} 
        value={value} 
        onChange={onChange}
        required={required}
        className="w-full p-3 border border-slate-200 rounded-lg mt-1 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
      >
        {children}
      </select>
    </div>
  )
}

function ScoreSelector({ 
  label, 
  description, 
  name, 
  value, 
  onChange, 
  valueColor = 'text-slate-800',
  getButtonColor,
  numLabels = ["非常に低い", "低い", "普通", "高い", "非常に高い"]
}: { 
  label: string, 
  description: string,
  name: string, 
  value: number, 
  onChange: (name: string, value: number) => void,
  valueColor?: string,
  getButtonColor: (val: number) => string,
  numLabels?: string[]
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="block text-base font-medium text-slate-700">{label}</label>
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      
      {/* ボタンによる選択肢 */}
      <div className="grid grid-cols-5 gap-2">
        {numLabels.map((label, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(name, index + 1)}
            className={`py-2 px-1 rounded-md transition-colors ${getButtonColor(index + 1)} hover:shadow-sm`}
          >
            <div className="text-sm font-medium">{index + 1}</div>
            <div className="text-xs mt-1">{label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
