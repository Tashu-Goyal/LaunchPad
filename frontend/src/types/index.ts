export const VALIDATION_STATUSES = [
  'Not Started',
  'Researching',
  'Validating',
  'Validated',
  'Rejected',
] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export interface ResearchNote {
  id: number;
  idea_id: number;
  note_content: string;
  competitor_name: string | null;
  competitor_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchNotePayload {
  note_content: string;
  competitor_name?: string | null;
  competitor_url?: string | null;
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  status: ValidationStatus;
  needs_improvement: boolean;
  improvement_note: string | null;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface IdeaDetail extends Idea {
  notes: ResearchNote[];
}

export interface IdeaPayload {
  title: string;
  description: string;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  status: ValidationStatus;
  needs_improvement: boolean;
  improvement_note?: string | null;
}

export interface DashboardStats {
  total_ideas: number;
  under_research: number;
  validated: number;
  needs_improvement: number;
  status_breakdown: Record<ValidationStatus, number>;
}

export interface IdeaFiltersState {
  search: string;
  status: ValidationStatus | 'All';
  needsImprovementOnly: boolean;
}
