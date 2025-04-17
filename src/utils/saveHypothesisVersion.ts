import { supabase } from '@/lib/supabaseClient'
import { Hypothesis } from '@/types/hypothesis'

export async function saveHypothesisVersion(oldHypothesis: Hypothesis, validationId?: string, reason?: string, userId?: string) {
  const { id: hypothesis_id } = oldHypothesis

  const { data: existingVersions } = await supabase
    .from('hypothesis_versions')
    .select('version_number')
    .eq('hypothesis_id', hypothesis_id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = existingVersions?.[0]?.version_number + 1 || 1

  // 変更点: オブジェクトを作成して、userId が存在する場合のみ updated_by に設定
  const versionData: any = {
    hypothesis_id,
    version_number: nextVersion,
    title: oldHypothesis.title,
    type: oldHypothesis.type,
    assumption: oldHypothesis.assumption,
    solution: oldHypothesis.solution,
    expected_effect: oldHypothesis.expected_effect,
    impact: oldHypothesis.impact,
    uncertainty: oldHypothesis.uncertainty,
    confidence: oldHypothesis.confidence,
    based_on_validation_id: validationId || null,
    reason: reason || '',
  }

  // userId が実際に存在する場合のみ更新
  if (userId) {
    versionData.updated_by = userId;
  }

  const { error } = await supabase.from('hypothesis_versions').insert(versionData)

  return error
}
