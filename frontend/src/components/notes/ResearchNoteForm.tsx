import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Plus, Save, X } from 'lucide-react';
import { ResearchNote, ResearchNotePayload } from '../../types';

interface ResearchNoteFormProps {
  editingNote: ResearchNote | null;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (payload: ResearchNotePayload) => Promise<void>;
  onCancelEdit: () => void;
}

export function ResearchNoteForm({
  editingNote,
  isSubmitting,
  serverError,
  onSubmit,
  onCancelEdit,
}: ResearchNoteFormProps) {
  const [noteContent, setNoteContent] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValidationError(null);
    if (editingNote) {
      setNoteContent(editingNote.note_content);
      setCompetitorName(editingNote.competitor_name ?? '');
      setCompetitorUrl(editingNote.competitor_url ?? '');
    } else {
      setNoteContent('');
      setCompetitorName('');
      setCompetitorUrl('');
    }
  }, [editingNote]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      setValidationError('Please enter your research findings or note content.');
      return;
    }

    const trimmedUrl = competitorUrl.trim();
    if (trimmedUrl) {
      try {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setValidationError('Competitor URL must start with http:// or https://');
          return;
        }
      } catch {
        setValidationError('Please enter a valid URL (e.g., https://example.com).');
        return;
      }
    }

    setValidationError(null);
    await onSubmit({
      note_content: noteContent.trim(),
      competitor_name: competitorName.trim() || null,
      competitor_url: trimmedUrl || null,
    });

    if (!editingNote) {
      setNoteContent('');
      setCompetitorName('');
      setCompetitorUrl('');
    }
  };

  const activeError = validationError || serverError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {editingNote ? 'Edit Research Entry' : 'Add Research Note & Competitor'}
        </h3>
        {editingNote && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Cancel edit
          </button>
        )}
      </div>

      {activeError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Research Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            maxLength={5000}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Record customer interview quotes, market sizing, pricing benchmarks, or competitor gaps..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Competitor Name (optional)
            </label>
            <input
              type="text"
              maxLength={150}
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="e.g., FreshBooks"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Competitor URL (optional)
            </label>
            <input
              type="url"
              maxLength={500}
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {editingNote ? (
            <>
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Updating...' : 'Update Note'}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Research Note'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
