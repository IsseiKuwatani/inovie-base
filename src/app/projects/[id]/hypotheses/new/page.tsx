'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { XCircle, Lightbulb, GripHorizontal, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react'

export default function NewHypothesisPage() {
  const { id: projectId } = useParams()
  const searchParams = useSearchParams()
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

  const [error, setError] = useState('')
  const [showHints, setShowHints] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hintRef = useRef<HTMLDivElement>(null)

  // クエリからAI生成データを受け取ってフォームに反映
  useEffect(() => {
    const aiData = searchParams.get('from_ai')
    if (aiData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(aiData))
        setForm((prev) => ({
          ...prev,
          title: parsed.title || '',
          assumption: parsed.premise || '',
          solution: parsed.solution || '',
          expected_effect: parsed.expected_effect || '',
          type: parsed.type || '課題仮説',
          status: parsed.status || '未検証',
          impact: parsed.impact ?? 3,
          uncertainty: parsed.uncertainty ?? 3,
          confidence: parsed.confidence ?? 3,
        }))
      } catch (e) {
        console.error('仮説データの読み込みに失敗しました', e)
      }
    }
  }, [searchParams])


  useEffect(() => {
    const hint = hintRef.current
    if (!hint) return

    const headerElement = hint.querySelector('.drag-header') as HTMLElement | null
    if (!headerElement) return

    const onMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent
      const startX = mouseEvent.clientX
      const startY = mouseEvent.clientY
      const rect = hint.getBoundingClientRect()
      const offsetX = startX - rect.left
      const offsetY = startY - rect.top

      const onMouseMove = (e: MouseEvent) => {
        hint.style.left = `${e.clientX - offsetX}px`
        hint.style.top = `${e.clientY - offsetY}px`
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    headerElement.addEventListener('mousedown', onMouseDown)
    return () => {
      headerElement.removeEventListener('mousedown', onMouseDown)
    }
  }, [showHints])

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
  
    const payload = {
      title: form.title,
      type: form.type,
      status: form.status,
      impact: Number(form.impact),
      uncertainty: Number(form.uncertainty),
      confidence: Number(form.confidence),
      assumption: form.assumption || '',
      solution: form.solution || '',
      expected_effect: form.expected_effect || '',
      project_id: projectId,
    }
  
    try {
      const { error: insertError } = await supabase.from('hypotheses').insert([payload])
      if (insertError) throw new Error(insertError.message)
  
      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError('仮説の作成に失敗しました: ' + (err.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeHints: Record<string, { description: string, examples: string[], tips: string[] }> = {
    '課題仮説': {
      description: 'ユーザーや市場に存在する問題点や課題についての仮説',
      examples: [
        '若手社員はリモートワーク環境でのコミュニケーション不足を感じている',
        '小規模飲食店のオーナーはデジタル予約システムの導入コストと複雑さに悩んでいる',
        '30代の共働き夫婦は平日の夕食準備に十分な時間を確保できていない'
      ],
      tips: [
        'ユーザーインタビューやアンケートデータに基づいて課題を特定する',
        '問題の深刻度と発生頻度を考慮する',
        '課題の裏にある本質的なニーズを探る',
        'すでに存在する解決策があるなら、なぜそれでは不十分なのかを考える'
      ]
    },
    '価値仮説': {
      description: '提供する製品・サービスがユーザーにもたらす価値についての仮説',
      examples: [
        'AIを活用した自動文書要約ツールによって、ビジネスパーソンの情報処理時間を30％削減できる',
        'サブスクリプション型の子供服サービスは、成長に合わせた衣替えの手間とコストを削減する',
        'フードデリバリーの定期便サービスは共働き家庭の夕食準備の負担を週3日分軽減する'
      ],
      tips: [
        '提供する価値は定量的に示せるとより説得力が増す',
        'ユーザーにとっての時間・お金・手間・心理的負担などの軽減効果を考える',
        '既存の解決策と比較した際の優位性を明確にする',
        '価値を実感できるまでの時間（価値実現までの期間）も考慮する'
      ]
    },
    '市場仮説': {
      description: 'ターゲット市場の規模や特性、成長性についての仮説',
      examples: [
        '国内のサイドビジネス実践者は約500万人存在し、年10％の成長率で増加している',
        '健康志向の高い40-50代女性は、パーソナライズされた栄養サプリメントに月5,000円以上を支出する傾向がある',
        'リモートワーク定着により、郊外の住宅需要は今後5年間で15％増加する'
      ],
      tips: [
        '市場規模は公開データと独自調査の両方から推計すると良い',
        'ターゲットユーザーをデモグラフィックだけでなく、行動や価値観でも定義する',
        '市場の成長要因と阻害要因の両方を検討する',
        '競合が見落としているニッチ市場や新興市場に注目する'
      ]
    },
    '価格仮説': {
      description: '製品・サービスの価格設定と顧客の支払い意欲についての仮説',
      examples: [
        'フリーランスのデザイナーは、クラウドデザインツールに月額3,000円までなら支払う意欲がある',
        '高品質な食材の定期宅配サービスは、一般的なスーパーより20％高くても受け入れられる',
        '企業向けデータ分析ツールは、導入コスト削減効果を示せれば年間100万円の価格設定でも受け入れられる'
      ],
      tips: [
        '異なる価格帯でのユーザー反応をテストする（価格弾力性）',
        '競合製品との価格差をどこまで許容するかを検証する',
        '価格だけでなく、支払い方法（サブスク、一括など）の選好も確認する',
        '価値と価格のバランスをどう伝えるかも重要（価値訴求）'
      ]
    },
    'チャネル仮説': {
      description: '顧客獲得や製品・サービス提供の経路についての仮説',
      examples: [
        '美容に関心の高い20代女性はインスタグラムからの流入が最も高いコンバージョン率を示す',
        'BtoBサービスはウェビナーからのリード獲得が最も費用対効果が高い',
        '50代以上のユーザーはLINEを通じた情報提供と予約が最も使いやすいと感じる'
      ],
      tips: [
        '複数のチャネルを組み合わせた総合的な獲得戦略を検討する',
        '各チャネルの顧客獲得コスト（CAC）と顧客生涯価値（LTV）の比率を計算する',
        'チャネルごとの顧客像やニーズの違いを理解する',
        '競合が手薄なチャネルを見つけて差別化する機会を探る'
      ]
    }
  }

  // スコアに応じた色を取得
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-indigo-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-slate-600';
  }

  // スライダーの色を取得
  const getSliderAccentColor = (name: string, value: number) => {
    if (name === 'impact' || name === 'uncertainty') {
      return value >= 4 ? 'accent-indigo-600' : value >= 3 ? 'accent-amber-500' : 'accent-slate-500';
    }
    // confidence は逆（高いほど良い）
    return value >= 4 ? 'accent-emerald-600' : value >= 3 ? 'accent-amber-500' : 'accent-rose-500';
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-6">新規事業向けの仮説を追加</h1>

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
                {Object.keys(typeHints).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
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
              onClick={() => setShowHints(true)}
              className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <HelpCircle size={14} className="mr-1" />
              <span>評価の目安を見る</span>
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
        
        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-5 py-2.5 text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full hover:shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '仮説を作成'}
            {!isSubmitting && <ChevronRight size={16} />}
          </button>
        </div>
      </form>

      {!showHints && (
        <button 
          onClick={() => setShowHints(true)} 
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Lightbulb size={18} />
          <span>ヒントを表示</span>
        </button>
      )}

      {/* フローティングヒント */}
      {showHints && (
        <div
          ref={hintRef}
          className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-32px)] bg-white border border-indigo-100 rounded-xl shadow-lg p-5 z-50 cursor-default animate-fadeIn max-h-[80vh] overflow-y-auto"
        >
          <div className="drag-header flex justify-between items-center cursor-move mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              <span>{form.type} のヒント</span>
            </h2>
            <div className="flex items-center gap-1">
              <GripHorizontal size={14} className="text-slate-400" />
              <button 
                onClick={() => setShowHints(false)} 
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <p className="text-sm text-slate-600 mb-3">{typeHints[form.type].description}</p>
              
              <h3 className="text-sm font-semibold text-slate-700 mb-2">例文:</h3>
              <ul className="text-sm text-slate-700 space-y-2 mb-4">
                {typeHints[form.type].examples.map((example, i) => (
                  <li key={i} className="flex items-start gap-2 pb-2 border-b border-slate-50">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="text-sm font-semibold text-slate-700 mb-2">検討のヒント:</h3>
              <ul className="text-sm text-slate-700 space-y-2">
                {typeHints[form.type].tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 pb-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">評価指標の目安:</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">影響度</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-1">
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">5:</span> 事業全体の成否を左右する非常に大きな影響</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">4:</span> 主要な収益・成長に直結する大きな影響</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">3:</span> 一定の事業成果に貢献する中程度の影響</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">2:</span> 補助的な改善をもたらす小さな影響</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">1:</span> ごく限定的な影響</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-700">不確実性</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-1">
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">5:</span> ほぼ未知領域で検証データが極めて少ない</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">4:</span> 多くの未知要素があり予測が難しい</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">3:</span> いくつかの不確実な要素がある</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">2:</span> 大部分は予測可能だが一部不確実性がある</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">1:</span> 高い確度で予測可能</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-700">確信度</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-1">
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">5:</span> 確固たるデータや経験に基づく強い確信</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">4:</span> 相当なデータや経験に基づく高い確信</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">3:</span> ある程度のデータや経験に基づく中程度の確信</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">2:</span> 限定的なデータや経験に基づく弱い確信</li>
                    <li className="flex gap-2"><span className="text-indigo-600 font-semibold">1:</span> 直感的な推測に基づく非常に弱い確信</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
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
