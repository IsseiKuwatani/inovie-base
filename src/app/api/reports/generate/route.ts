import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// レポートセクションの型定義
type ReportSection = {
  type: string;
  content: {
    title: string;
    text: string;
    [key: string]: any;
  };
  id?: string;
}

// レポートコンテンツの型定義
type ReportContent = {
  sections: ReportSection[];
}

export async function POST(req: Request) {
    try {
      // Supabase クライアントを直接作成
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // セッション情報を取得（token を使用）
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')
      const { data: userData, error: userError } = await supabase.auth.getUser(token!)
      
      if (userError || !userData.user) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      }
      
      const user = userData.user;
      const body = await req.json()
      const { projectId, reportType } = body

      // プロジェクト情報を取得
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .single();

      if (projectError) {
        return NextResponse.json({ error: 'プロジェクトの取得に失敗しました' }, { status: 404 });
      }

      // レポートタイプに基づいてデータを取得
      let reportTitle = "";
      let reportContent: ReportContent = { sections: [] };
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    switch (reportType) {
      case 'hypothesis_validation':
        // 仮説検証レポートの場合
        const { data: hypotheses, error: hypothesesError } = await supabase
          .from('hypotheses')
          .select(`
            id, title, type, assumption, solution, expected_effect, 
            status, impact, uncertainty, confidence
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (hypothesesError) {
          return NextResponse.json({ error: '仮説データの取得に失敗しました' }, { status: 500 });
        }

        // 検証済み仮説の検証データを取得
        const validatedHypotheses = hypotheses?.filter(h => h.status === '成立' || h.status === '否定') || [];
        
        if (validatedHypotheses.length > 0) {
          const { data: validations, error: validationsError } = await supabase
            .from('validations')
            .select(`*`)
            .in('hypothesis_id', validatedHypotheses.map(h => h.id));

          if (validationsError) {
            return NextResponse.json({ error: '検証データの取得に失敗しました' }, { status: 500 });
          }

          // レポートコンテンツを生成
          reportTitle = `${project.name} 仮説検証レポート (${today})`;
          reportContent = {
            sections: [
              {
                type: 'text',
                content: {
                  title: '概要',
                  text: `このレポートは${project.name}プロジェクトの仮説検証結果をまとめたものです。\n\n${project.description || ''}`
                }
              },
              {
                type: 'text',
                content: {
                  title: '仮説検証サマリー',
                  text: `全${hypotheses?.length || 0}件の仮説のうち、${validatedHypotheses.length}件が検証済みです。\n\n` +
                        `成立: ${validatedHypotheses.filter(h => h.status === '成立').length}件\n` +
                        `否定: ${validatedHypotheses.filter(h => h.status === '否定').length}件\n` +
                        `未検証: ${(hypotheses?.length || 0) - validatedHypotheses.length}件`
                }
              },
              ...validatedHypotheses.map(hypothesis => {
                const hypothesisValidations = validations?.filter(v => v.hypothesis_id === hypothesis.id) || [];
                return {
                  type: 'text',
                  content: {
                    title: `仮説: ${hypothesis.title}`,
                    text: `状態: ${hypothesis.status}\n\n` +
                          `前提: ${hypothesis.assumption || 'なし'}\n\n` +
                          `解決策: ${hypothesis.solution || 'なし'}\n\n` +
                          `期待される効果: ${hypothesis.expected_effect || 'なし'}\n\n` +
                          `検証回数: ${hypothesisValidations.length}回\n\n` +
                          `検証詳細:\n${
                            hypothesisValidations.map((v, i) => 
                              `${i + 1}. ${v.method || ''}：${v.result || ''}`
                            ).join('\n')
                          }`
                  }
                };
              }),
              {
                type: 'text',
                content: {
                  title: '結論と次のステップ',
                  text: 'ここに結論と次のステップを入力してください。'
                }
              }
            ]
          };
        } else {
          // 検証済み仮説がない場合
          reportTitle = `${project.name} 仮説検証レポート (${today})`;
          reportContent = {
            sections: [
              {
                type: 'text',
                content: {
                  title: '概要',
                  text: `このレポートは${project.name}プロジェクトの仮説検証状況をまとめたものです。\n\n${project.description || ''}`
                }
              },
              {
                type: 'text',
                content: {
                  title: '仮説検証サマリー',
                  text: `現在、検証済みの仮説はありません。全${hypotheses?.length || 0}件の仮説が未検証状態です。\n\n` +
                        `仮説を検証するには、各仮説の詳細ページから検証を追加してください。`
                }
              },
              {
                type: 'text',
                content: {
                  title: '未検証の仮説',
                  text: hypotheses?.map(h => `・${h.title}`).join('\n') || 'なし'
                }
              },
              {
                type: 'text',
                content: {
                  title: '次のステップ',
                  text: 'ここに次のステップを入力してください。'
                }
              }
            ]
          };
        }
        break;

      case 'roadmap':
        // ロードマップレポートの場合
        const { data: roadmapHypotheses, error: roadmapError } = await supabase
          .from('hypotheses')
          .select(`
            id, title, type, assumption, solution, expected_effect, 
            status, impact, uncertainty, confidence, roadmap_order
          `)
          .eq('project_id', projectId)
          .eq('roadmap_tag', 'roadmap')
          .order('roadmap_order', { ascending: true });

        if (roadmapError) {
          return NextResponse.json({ error: 'ロードマップデータの取得に失敗しました' }, { status: 500 });
        }

        if (roadmapHypotheses && roadmapHypotheses.length > 0) {
          // ロードマップ仮説の検証データを取得
          const { data: roadmapValidations, error: validationsError } = await supabase
            .from('validations')
            .select(`*`)
            .in('hypothesis_id', roadmapHypotheses.map(h => h.id));

          if (validationsError) {
            return NextResponse.json({ error: '検証データの取得に失敗しました' }, { status: 500 });
          }

          // 各仮説の検証数をカウント
          const hypothesesWithCounts = roadmapHypotheses.map(h => {
            const validationCount = roadmapValidations 
              ? roadmapValidations.filter(v => v.hypothesis_id === h.id).length 
              : 0;
              
            return {
              ...h,
              verifications_count: validationCount
            };
          });
          
          // 完了した仮説（成立または否定かつ検証あり）のカウント
          const completedCount = hypothesesWithCounts.filter(h => 
            (h.status === '成立' || h.status === '否定') && h.verifications_count > 0
          ).length;
          
          // 検証中の仮説（成立・否定でないが検証あり）のカウント
          const inProgressCount = hypothesesWithCounts.filter(h => 
            h.status !== '成立' && h.status !== '否定' && h.verifications_count > 0
          ).length;
          
          const progress = Math.round((completedCount / roadmapHypotheses.length) * 100);

          // レポートコンテンツを生成
          reportTitle = `${project.name} ロードマップレポート (${today})`;
          reportContent = {
            sections: [
              {
                type: 'text',
                content: {
                  title: '概要',
                  text: `このレポートは${project.name}プロジェクトの仮説ロードマップの進捗状況をまとめたものです。\n\n${project.description || ''}`
                }
              },
              {
                type: 'text',
                content: {
                  title: 'ロードマップ進捗サマリー',
                  text: `全${roadmapHypotheses.length}ステップのうち、${completedCount}ステップが完了しています（進捗率${progress}%）。\n\n` +
                        `- 完了ステップ: ${completedCount}件\n` +
                        `- 検証中ステップ: ${inProgressCount}件\n` +
                        `- 未着手ステップ: ${roadmapHypotheses.length - completedCount - inProgressCount}件`
                }
              },
              ...hypothesesWithCounts.map((hypothesis, index) => {
                const statusText = hypothesis.verifications_count > 0 
                  ? hypothesis.status === '成立' || hypothesis.status === '否定' 
                    ? `✅ ${hypothesis.status}`
                    : '🔄 検証中' 
                  : '⏱ 未着手';
                
                return {
                  type: 'text',
                  content: {
                    title: `ステップ ${index + 1}: ${hypothesis.title}`,
                    text: `状態: ${statusText}\n\n` +
                          `内容: ${hypothesis.assumption || 'なし'}\n\n` +
                          `解決策: ${hypothesis.solution || 'なし'}\n\n` +
                          `期待される効果: ${hypothesis.expected_effect || 'なし'}\n\n` +
                          `検証回数: ${hypothesis.verifications_count}回`
                  }
                };
              }),
              {
                type: 'text',
                content: {
                  title: '今後の課題と方向性',
                  text: 'ここに今後の課題と方向性を入力してください。'
                }
              }
            ]
          };
        } else {
          // ロードマップがない場合
          reportTitle = `${project.name} ロードマップレポート (${today})`;
          reportContent = {
            sections: [
              {
                type: 'text',
                content: {
                  title: '概要',
                  text: `このレポートは${project.name}プロジェクトのロードマップに関するものです。\n\n${project.description || ''}`
                }
              },
              {
                type: 'text',
                content: {
                  title: 'ロードマップ状況',
                  text: `現在、ロードマップが設定されていません。\n\n` +
                        `ロードマップを作成するには、ロードマップページから「AIでロードマップを作成」または「マニュアルで作成」を選択してください。`
                }
              },
              {
                type: 'text',
                content: {
                  title: '次のステップ',
                  text: 'プロジェクトの仮説ロードマップを作成し、段階的に検証を進めることをお勧めします。'
                }
              }
            ]
          };
        }
        break;

      case 'progress':
        // 進捗レポート
        const { data: projectHypotheses, error: projectHypothesesError } = await supabase
          .from('hypotheses')
          .select(`
            id, title, type, status, created_at
          `)
          .eq('project_id', projectId);

        if (projectHypothesesError) {
          return NextResponse.json({ error: 'プロジェクトデータの取得に失敗しました' }, { status: 500 });
        }

        // KPI指標を取得（ある場合）
        const { data: kpiMetrics, error: kpiError } = await supabase
          .from('kpi_metrics')
          .select(`
            id, name, description, current_value, target_value, unit, status
          `)
          .eq('project_id', projectId);

        // 直近1ヶ月の検証データを取得
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const { data: recentValidations, error: recentValidationsError } = await supabase
          .from('validations')
          .select(`
            id, hypothesis_id, method, result, created_at
          `)
          .in('hypothesis_id', projectHypotheses?.map(h => h.id) || [])
          .gte('created_at', oneMonthAgo.toISOString());

        // レポートコンテンツを生成
        reportTitle = `${project.name} 進捗レポート (${today})`;
        reportContent = {
          sections: [
            {
              type: 'text',
              content: {
                title: '概要',
                text: `このレポートは${project.name}プロジェクトの進捗状況をまとめたものです。\n\n${project.description || ''}`
              }
            },
            {
              type: 'text',
              content: {
                title: 'プロジェクト進捗サマリー',
                text: `仮説総数: ${projectHypotheses?.length || 0}件\n` +
                      `検証済み仮説: ${projectHypotheses?.filter(h => h.status === '成立' || h.status === '否定').length || 0}件\n` +
                      `進行中仮説: ${projectHypotheses?.filter(h => h.status === '検証中').length || 0}件\n\n` +
                      `直近の検証アクティビティ: ${recentValidations?.length || 0}件\n\n` +
                      `${kpiMetrics && kpiMetrics.length > 0 ? 
                        'KPI指標達成状況:\n' + 
                        kpiMetrics.map(kpi => `- ${kpi.name}: ${kpi.current_value || '未設定'} ${kpi.unit || ''} / 目標 ${kpi.target_value || '未設定'} ${kpi.unit || ''}`).join('\n') : 
                        ''}`
              }
            },
            {
              type: 'text',
              content: {
                title: '今月の主な成果',
                text: 'ここに今月の主な成果を入力してください。'
              }
            },
            {
              type: 'text',
              content: {
                title: '現在の課題',
                text: 'ここに現在の課題を入力してください。'
              }
            },
            {
              type: 'text',
              content: {
                title: '次月のアクション',
                text: 'ここに次月のアクションを入力してください。'
              }
            }
          ]
        };
        break;

      case 'final':
        // 最終報告書
        const { data: allHypotheses, error: allHypothesesError } = await supabase
          .from('hypotheses')
          .select(`
            id, title, type, assumption, solution, expected_effect, 
            status, impact, uncertainty, confidence
          `)
          .eq('project_id', projectId);

        if (allHypothesesError) {
          return NextResponse.json({ error: 'プロジェクトデータの取得に失敗しました' }, { status: 500 });
        }

        // 重要な検証データを取得
        const { data: keyValidations, error: keyValidationsError } = await supabase
          .from('validations')
          .select(`
            id, hypothesis_id, method, result, created_at
          `)
          .in('hypothesis_id', allHypotheses?.filter(h => h.status === '成立').map(h => h.id) || [])
          .order('created_at', { ascending: false })
          .limit(10);

        // レポートコンテンツを生成
        reportTitle = `${project.name} 最終報告書 (${today})`;
        reportContent = {
          sections: [
            {
              type: 'text',
              content: {
                title: 'エグゼクティブサマリー',
                text: `このレポートは${project.name}プロジェクトの成果と学びをまとめた最終報告書です。\n\n${project.description || ''}\n\n` +
                      `プロジェクト期間を通じて、全${allHypotheses?.length || 0}件の仮説を検証し、` +
                      `${allHypotheses?.filter(h => h.status === '成立').length || 0}件が成立、` +
                      `${allHypotheses?.filter(h => h.status === '否定').length || 0}件が否定されました。`
              }
            },
            {
              type: 'text',
              content: {
                title: '主要な発見と検証結果',
                text: `プロジェクトから得られた主要な発見と洞察は以下の通りです：\n\n` +
                      `${keyValidations?.map((v, i) => 
                        `${i + 1}. ${allHypotheses?.find(h => h.id === v.hypothesis_id)?.title || ''}：${v.result || '結果なし'}`
                      ).join('\n\n') || '該当する検証結果がありません。'}`
              }
            },
            {
              type: 'text',
              content: {
                title: '市場機会と可能性',
                text: 'ここに市場機会と可能性について入力してください。'
              }
            },
            {
              type: 'text',
              content: {
                title: '結論と推奨アクション',
                text: 'ここに結論と推奨アクションについて入力してください。'
              }
            },
            {
              type: 'text',
              content: {
                title: '次のステップ',
                text: 'ここに次のステップについて入力してください。'
              }
            }
          ]
        };
        break;

      default:
        return NextResponse.json({ error: '不明なレポートタイプです' }, { status: 400 });
    }

   // レポートを新規作成
   const { data, error } = await supabase
   .from('reports')
   .insert([
     {
       project_id: projectId,
       title: reportTitle,
       report_type: reportType,
       status: 'draft',
       content: reportContent,
       created_by: user.id  
     }
   ])
   .select('id')
   .single();

 if (error) {
   return NextResponse.json({ error: 'レポートの作成に失敗しました' }, { status: 500 });
 }

 return NextResponse.json({ 
   success: true, 
   reportId: data.id,
   message: 'レポートが正常に作成されました' 
 });

} catch (error: any) {
 console.error('レポート生成エラー:', error);
 return NextResponse.json({ error: error.message || '不明なエラーが発生しました' }, { status: 500 });
}
}