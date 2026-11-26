import {
  Idea,
  IdeaDetail,
  IdeaFiltersState,
  IdeaPayload,
  ValidationStatus,
} from '../types';
import { apiRequest } from './client';

export function fetchIdeas(filters?: Partial<IdeaFiltersState>): Promise<Idea[]> {
  const params = new URLSearchParams();

  if (filters?.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters?.status && filters.status !== 'All') {
    params.set('status', filters.status);
  }
  if (filters?.needsImprovementOnly) {
    params.set('needs_improvement', 'true');
  }

  const query = params.toString();
  return apiRequest<Idea[]>(`/ideas${query ? `?${query}` : ''}`);
}

export function fetchIdeaDetail(ideaId: number): Promise<IdeaDetail> {
  return apiRequest<IdeaDetail>(`/ideas/${ideaId}`);
}

export function createIdea(payload: IdeaPayload): Promise<Idea> {
  return apiRequest<Idea>('/ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateIdea(
  ideaId: number,
  payload: Partial<IdeaPayload>,
): Promise<Idea> {
  return apiRequest<Idea>(`/ideas/${ideaId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateIdeaStatus(
  ideaId: number,
  status: ValidationStatus,
): Promise<Idea> {
  return apiRequest<Idea>(`/ideas/${ideaId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateIdeaImprovement(
  ideaId: number,
  needs_improvement: boolean,
  improvement_note?: string | null,
): Promise<Idea> {
  return apiRequest<Idea>(`/ideas/${ideaId}/improvement`, {
    method: 'PATCH',
    body: JSON.stringify({
      needs_improvement,
      improvement_note: needs_improvement ? improvement_note ?? null : null,
    }),
  });
}

export function deleteIdea(ideaId: number): Promise<void> {
  return apiRequest<void>(`/ideas/${ideaId}`, {
    method: 'DELETE',
  });
}
