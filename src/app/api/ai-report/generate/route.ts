// src/app/api/ai-report/generate/route.ts


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 参照されたロードマップ生成と同様に、createClientを直接使用
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,// または必要に応じてSUPABASE_SERVICE_ROLE_KEY!

);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectIdが必要です' }, 
        { status: 400 }
      );
    }

    console.log('Processing request for project ID:', projectId);
    
    // プロジェクト情報を取得
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();
      if (projectError) {
        console.error('Project fetch error:', projectError);
        return NextResponse.json(
          { error: `プロジェクト情報の取得に失敗しました: ${projectError.message}` },
          { status: 500 }
        );
      }
      
      if (!project) {
        return NextResponse.json(
          { error: '指定されたプロジェクトが存在しないか、閲覧権限がありません' },
          { status: 404 }
        );
      }
      
      if (projectError) {
        console.error('Project fetch error:', projectError);
        return NextResponse.json(
          { error: `プロジェクト情報の取得に失敗しました: ${(projectError as any).message}` },
          { status: 500 }
        );
      }

    if (!project) {
      return NextResponse.json(
        { error: '指定されたプロジェクトが見つかりません' },
        { status: 404 }
      );
    }
    
    // 最もシンプルなHTMLレポートを返す
    const reportHtml = `
      <div>
        <h1>テストレポート - ${project.name}</h1>
        <p>プロジェクトID: ${projectId}</p>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
        <p>ステータス: ${project.status || '不明'}</p>
        <p>説明: ${project.description || '説明なし'}</p>
      </div>
    `;

    return NextResponse.json({ html: reportHtml });
  } catch (error) {
    console.error('AI Report generation error:', error);
    return NextResponse.json(
      { error: 'レポート生成中にエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
