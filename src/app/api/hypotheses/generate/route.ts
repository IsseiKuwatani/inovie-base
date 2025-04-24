import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { context, project_id, count = 3, mode = 'balanced' } = body // モードパラメータを追加

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: '不正な入力です' }, { status: 400 })
    }

    // プロジェクト情報と既存の仮説を取得（変更なし）
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', project_id)
      .single()

    const { data: hypotheses } = await supabase
      .from('hypotheses')
      .select('title, type')
      .eq('project_id', project_id)

    const hypothesisList = (hypotheses || [])
      .map(h => `${h.title}（${h.type}）`).join(', ') || 'なし'

    // モードに基づいた指示テキストを作成
    let modeInstruction = '';
    switch (mode) {
      case 'high-impact':
        modeInstruction = `
          あなたの重要な役割は「インパクトが大きく、不確実性が高い仮説」を優先的に生成することです。
          以下の基準で評価してください：
          - 影響度（Impact）: 5段階で、その仮説が正しかった場合のビジネスへの影響度
          - 不確実性（Uncertainty）: 5段階で、その仮説の不確実さの度合い
          
          特に影響度と不確実性がともに高い（4以上）仮説を優先して提案してください。
          この組み合わせは、検証の価値が最も高い仮説です。
        `;
        break;
      case 'strategic':
        modeInstruction = `
          あなたの重要な役割は「仮説ツリーの根本となるような戦略的な基幹仮説」を生成することです。
          基幹仮説とは：
          - プロジェクトの根本的な成功要因や市場の本質に関わるもの
          - 複数の派生仮説を生み出す可能性が高いもの
          - 検証結果により大きな方向転換の判断ができるもの
          
          仮説には「この仮説は他の○○や△△といった仮説の検証につながる可能性があります」といった
          派生可能性の説明を expected_effect に含めてください。
        `;
        break;
      default: // balanced
        modeInstruction = `
          バランスの取れた多様な仮説を生成してください。
          以下の観点から様々なタイプの仮説を含めることが重要です：
          - 影響度と不確実性のバランス
          - 異なる仮説タイプ（課題、価値、市場、価格、チャネル）
          - 短期的・長期的な視点
        `;
        break;
    }

    // 改良されたプロンプト
    const prompt = `
    以下はプロジェクト「${project?.name || '名称未設定'}」に関する仮説検討です。
    
    【プロジェクト説明】
    ${project?.description || '説明が未登録です'}
    
    【既存の仮説（タイトル＋タイプ）】
    ${hypothesisList}
    
    【ユーザーが追加で検討したい内容】
    ${context}
    
    【仮説生成モード】
    ${modeInstruction}
    
    この情報をもとに、以下の形式で **異なるアプローチの仮説を${count}件** JSON配列形式で出力してください。
    各仮説は異なる視点や解決アプローチを持つようにしてください。
    
    【出力条件】
    - 必ず配列形式で出力してください（例：[ {...}, {...}, {...} ]）
    - 値・文章すべては日本語、キー名は英語としてください
    - 囲み記号（\`\`\`json など）や説明文は不要です
    - タイプはそれぞれ異なるものを含めるようにしてください
    
    【出力形式】
    [
      {
        "title": "...", // 端的なタイトル
        "premise": "...", // 前提となる課題や状況
        "solution": "...", // 提案する解決策
        "expected_effect": "...", // 期待される効果
        "type": "課題仮説 | 価値仮説 | 市場仮説 | 価格仮説 | チャネル仮説", // いずれか一つ
        "status": "未検証",
        "impact": 数値（1〜5）, // 実現時の影響度
        "uncertainty": 数値（1〜5）, // 不確実性の高さ
        "confidence": 数値（1〜5）, // 検証前の確信度
        "tree_level": "${mode === 'strategic' ? '基幹' : '通常'}" // 仮説ツリーでの位置づけ
      },
      // 合計${count}件の異なる仮説
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

    if (!content) {
      return NextResponse.json({ error: 'AI応答が不正です' }, { status: 500 })
    }

    try {
      const cleaned = content.replace(/```json|```/g, '').trim()
      let parsed: any = null
      
      try {
        // 配列をそのまま返すように変更
        parsed = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned
        if (!Array.isArray(parsed)) {
          parsed = [parsed] // 配列でない場合は配列に変換
        }
      } catch (err) {
        console.error('❌ JSONパース失敗:', err)
        return NextResponse.json({ error: '生成結果の形式が正しくありません' }, { status: 500 })
      }
      
      return NextResponse.json(parsed)
    } catch (err) {
      console.error('JSONパースエラー:', err)
      return NextResponse.json({ error: '生成結果の形式が正しくありません' }, { status: 500 })
    }
  } catch (err) {
    console.error('API処理中エラー:', err)
    return NextResponse.json({ error: '仮説生成に失敗しました' }, { status: 500 })
  }
}
