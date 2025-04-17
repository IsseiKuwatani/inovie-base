export type Hypothesis = {
  id: string;
  title: string;
  assumption?: string;
  solution?: string;
  expected_effect?: string;
  type: string;
  status: string;
  impact: number;
  uncertainty: number;
  confidence: number;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
};
