import { ResearchNote, ResearchNotePayload } from '../types';
import { apiRequest } from './client';

export function createResearchNote(
  ideaId: number,
  payload: ResearchNotePayload,
): Promise<ResearchNote> {
  return apiRequest<ResearchNote>(`/ideas/${ideaId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateResearchNote(
  noteId: number,
  payload: Partial<ResearchNotePayload>,
): Promise<ResearchNote> {
  return apiRequest<ResearchNote>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteResearchNote(noteId: number): Promise<void> {
  return apiRequest<void>(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}
