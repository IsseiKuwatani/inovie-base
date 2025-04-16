import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, status, description, autoGenerateHypotheses } = body

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user

  if (!user) {
    return NextResponse.json({ error: 'ユーザー認証に失敗しました' }, { status: 401 })
  }

  // プロジェクト登録
  const { data: projectData, error: insertError } = await supabase
    .from('projects')
    .insert([{ name, status, description, user_id: user.id }])
    .select()
    .single()

  if (insertError || !projectData) {
    return NextResponse.json({ error: 'プロジェクトの作成に失敗しました' }, { status: 500 })
  }

  // 仮説自動生成がONの場合、DeepSeekで生成
  if (autoGenerateHypotheses) {
    try {
      const prompt = `
以下は新規事業のプロジェクト情報です。

【プロジェクト名】
${name}

【概要】
${description}

この情報をもとに、以下の形式で検証すべき仮説を5つ提案してください。

- タイトル
- 前提（根拠や背景）
- 解決策（対処法）
- 期待される効果
- 仮説タイプ（課題／解決策／価値など）
- ステータス（未検証など）
- 影響度（1〜5）
- 不確実性（1〜5）
- 確信度（1〜5）

出力はJSON形式でお願いします。
`.trim()

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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

      const result = await response.json()
      const hypotheses = JSON.parse(result.choices[0].message.content)

      // Supabaseに仮説を保存
      const inserts = hypotheses.map((h: any) => ({
        project_id: projectData.id,
        title: h.title,
        premise: h.premise,
        solution: h.solution,
        effect: h.effect,
        type: h.type,
        status: h.status,
        impact: h.impact,
        uncertainty: h.uncertainty,
        confidence: h.confidence
      }))

      await supabase.from('hypotheses').insert(inserts)
    } catch (error) {
      console.error('仮説の自動生成に失敗しました', error)
      // エラーがあってもプロジェクト作成だけは成功とする
    }
  }

  return NextResponse.json({ message: 'プロジェクト作成成功' })
}
