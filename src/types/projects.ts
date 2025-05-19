// src/types/projects.ts
import { RefObject } from 'react';

export type Project = {
  id: string;
  name: string;
  status: string | null;
  description?: string | null;
  created_at: string;
  user_id: string;
  organization_id?: string | null;
  hypothesis_count?: number;
  is_favorite: boolean;
};

export type ProjectCategory = 'all' | 'owned' | 'member' | 'organization';

export type MenuRefType = RefObject<HTMLDivElement>;

export const STATUS_ICONS = {
  '未着手': 'CircleDashed',
  '進行中': 'Clock', 
  '完了': 'CheckCircle2'
};
