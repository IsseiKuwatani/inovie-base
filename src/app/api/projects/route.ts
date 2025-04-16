import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { name, status, description, autoGenerateHypotheses } = body

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token!)

  if (userError || !user) {
    return NextResponse.json({ error: 'ユーザー認証に失敗しました' }, { status: 401 })
  }

  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert([{ name, status, description, user_id: user.id }])
    .select()
    .single()

  if (insertError || !project) {
    return NextResponse.json({ error: 'プロジェクトの作成に失敗しました' }, { status: 500 })
  }

  if (autoGenerateHypotheses) {
    try {
      const prompt = `
以下は新規事業プロジェクトの情報です。

【プロジェクト名】
${name}

【概要】
${description}

このプロジェクトにおいて、今後の事業検証や構想に役立つ「仮説」を5つ提案してください。

【条件】
- 顧客課題、提供価値、実現可能性、成長性、収益性など様々な観点から仮説を出してください
- 特に「影響度が高い」仮説を優先してください
- 仮説タイプ（課題仮説、価値仮説、市場仮説、価格仮説、チャネル仮説）はバラけさせてください
- 数値に関しては必ず1~5の内で評価してください。

【出力形式】
以下の形式で、JSON配列として英語のキーで出力してください（囲み記号や説明文は不要です）：以下の形式で、JSON配列で出力してください。  
キー名は英語。値・文章すべて日本語で記載してください。 
囲み記号や説明文は不要です。

以下は形式は上から
title=仮説タイトル
premise=前提(なぜそう考えるか)
solution=解決策
expected_effect=期待される効果
type=仮説タイプ(課題仮説、価値仮説、市場仮説、価格仮説、チャネル仮説のどれか)
status=ステータス
impact=影響度
uncertainty=不確実性
confidence=確信度です。

[
  {
    "title": "...",
    "premise": "...",
    "solution": "...",
    "expected_effect": "...",
    "type": "...",
    "status": "未検証",
 "影響度": 数値（1〜5）,
    "不確実性": 数値（1〜5）,
    "確信度": 数値（1〜5）
  },
  ...
]
      `.trim()

      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const result = await res.json()
      const content = result.choices?.[0]?.message?.content
      console.log('🧠 DeepSeek Response:', content)

      if (!content) {
        return NextResponse.json({ error: 'AI応答が不正です' }, { status: 500 })
      }

      let hypotheses = []
      try {
        const cleaned = content.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        hypotheses = Array.isArray(parsed) ? parsed : parsed.hypotheses
      } catch (err) {
        console.error('❌ JSONパースエラー:', err)
        console.error('🔍 返答内容:', content)
        return NextResponse.json({ error: 'AIの返答が正しい形式ではありません' }, { status: 500 })
      }

      const normalizeScore = (val: any) => {
        const num = Number(val)
        if (isNaN(num)) return 3
        return Math.min(5, Math.max(1, Math.round(num)))
      }

      const normalizeHypothesis = (h: any) => ({
        title: h.title ?? h['タイトル'],
        assumption: h.premise ?? h['前提'],
        solution: h.solution ?? h['解決策'],
        expected_effect: h.expected_effect ?? h['期待される効果'] ?? '',
        type: h.type ?? h['仮説タイプ'],
        status: h.status ?? h['ステータス'] ?? '未検証',
        impact: normalizeScore(h.impact ?? h['影響度']),
        uncertainty: normalizeScore(h.uncertainty ?? h['不確実性']),
        confidence: normalizeScore(h.confidence ?? h['確信度'])
      })

      const inserts = hypotheses.map((h: any) => ({
        project_id: project.id,
        ...normalizeHypothesis(h)
      }))

      console.log('📝 仮説保存内容:', inserts)

      const { error: insertHypothesisError } = await supabase
        .from('hypotheses')
        .insert(inserts)

      if (insertHypothesisError) {
        console.error('❌ 仮説保存に失敗:', insertHypothesisError)
        return NextResponse.json({ error: '仮説の保存に失敗しました' }, { status: 500 })
      }
    } catch (err) {
      console.error('❌ 仮説自動生成中にエラー:', err)
      return NextResponse.json({ error: '仮説生成中にエラーが発生しました' }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'プロジェクト作成成功' })
}
