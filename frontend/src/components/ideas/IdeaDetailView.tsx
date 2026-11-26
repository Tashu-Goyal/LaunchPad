import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileText,
  Lightbulb,
  Pencil,
  Target,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import {
  IdeaDetail,
  ResearchNote,
  ResearchNotePayload,
  VALIDATION_STATUSES,
  ValidationStatus,
} from '../../types';
import { ResearchNoteForm } from '../notes/ResearchNoteForm';
import { ResearchNoteList } from '../notes/ResearchNoteList';
import { ImprovementBadge, StatusBadge } from './StatusBadge';

interface IdeaDetailViewProps {
  idea: IdeaDetail;
  isUpdatingStatus: boolean;
  isUpdatingImprovement: boolean;
  isSubmittingNote: boolean;
  noteServerError: string | null;
  onBack: () => void;
  onEditIdea: () => void;
  onDeleteIdea: () => void;
  onChangeStatus: (status: ValidationStatus) => Promise<void>;
  onUpdateImprovement: (
    needsImprovement: boolean,
    improvementNote: string | null,
  ) => Promise<void>;
  onCreateNote: (payload: ResearchNotePayload) => Promise<void>;
  onUpdateNote: (
    noteId: number,
    payload: ResearchNotePayload,
  ) => Promise<void>;
  onDeleteNote: (note: ResearchNote) => void;
}

const STAGE_ACTIVE_STYLES: Record<ValidationStatus, string> = {
  'Not Started': 'border-slate-500 bg-slate-900 text-white shadow-sm',
  Researching: 'border-blue-600 bg-blue-600 text-white shadow-sm',
  Validating: 'border-amber-500 bg-amber-500 text-white shadow-sm',
  Validated: 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
  Rejected: 'border-rose-600 bg-rose-600 text-white shadow-sm',
};

export function IdeaDetailView({
  idea,
  isUpdatingStatus,
  isUpdatingImprovement,
  isSubmittingNote,
  noteServerError,
  onBack,
  onEditIdea,
  onDeleteIdea,
  onChangeStatus,
  onUpdateImprovement,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: IdeaDetailViewProps) {
  const [editingNote, setEditingNote] = useState<ResearchNote | null>(null);
  const [improvementDraft, setImprovementDraft] = useState(
    idea.improvement_note ?? '',
  );

  useEffect(() => {
    setImprovementDraft(idea.improvement_note ?? '');
    setEditingNote(null);
  }, [idea.id, idea.improvement_note]);

  const handleNoteSubmit = async (payload: ResearchNotePayload) => {
    if (editingNote) {
      await onUpdateNote(editingNote.id, payload);
      setEditingNote(null);
    } else {
      await onCreateNote(payload);
    }
  };

  const handleSaveImprovementNote = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdateImprovement(true, improvementDraft.trim() || null);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ideas</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onEditIdea}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit Idea</span>
          </button>
          <button
            type="button"
            onClick={onDeleteIdea}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Idea overview card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={idea.status} size="md" />
          {idea.needs_improvement && <ImprovementBadge />}
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {idea.title}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {idea.description}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Target className="h-4 w-4 text-rose-500" />
              <span>Problem Statement</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {idea.problem_statement}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Proposed Solution</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {idea.proposed_solution}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Target Audience</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {idea.target_audience}
            </p>
          </div>
        </div>
      </section>

      {/* Validation Tracker + Improvement Indicator */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Validation Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Assign or advance the validation stage for this startup idea.
              </p>
            </div>
            {isUpdatingStatus && (
              <span className="text-xs font-medium text-indigo-600">
                Saving status...
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {VALIDATION_STATUSES.map((stage) => {
              const isSelected = idea.status === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    if (!isSelected) {
                      void onChangeStatus(stage);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:opacity-60 ${
                    isSelected
                      ? STAGE_ACTIVE_STYLES[stage]
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span>{stage}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Independent Improvement Indicator */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Wrench className="h-4 w-4 text-orange-500" />
                <span>Improvement Flag</span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Independent of validation stage.
              </p>
            </div>
            <button
              type="button"
              disabled={isUpdatingImprovement}
              onClick={() =>
                void onUpdateImprovement(
                  !idea.needs_improvement,
                  !idea.needs_improvement ? improvementDraft.trim() || null : null,
                )
              }
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                idea.needs_improvement
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {idea.needs_improvement ? 'Flagged' : 'Mark Needed'}
            </button>
          </div>

          {idea.needs_improvement ? (
            <form onSubmit={handleSaveImprovementNote} className="mt-4 space-y-2.5">
              <input
                type="text"
                maxLength={1000}
                value={improvementDraft}
                onChange={(e) => setImprovementDraft(e.target.value)}
                placeholder="Note what needs improvement..."
                className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isUpdatingImprovement}
                  onClick={() => void onUpdateImprovement(false, null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear flag
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingImprovement}
                  className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                >
                  Save Note
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              No improvement flag set. Click{' '}
              <span className="font-medium text-slate-700">Mark Needed</span> if
              this concept requires refinement or pivoting.
            </p>
          )}
        </section>
      </div>

      {/* Research Notes & Competitors Section */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Research Notes & Competitors</span>
            </h3>
            <p className="text-xs text-slate-500">
              Document customer discovery findings and track direct or indirect
              competitors.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tabular-nums text-slate-700">
            {idea.notes.length} {idea.notes.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <ResearchNoteForm
          editingNote={editingNote}
          isSubmitting={isSubmittingNote}
          serverError={noteServerError}
          onSubmit={handleNoteSubmit}
          onCancelEdit={() => setEditingNote(null)}
        />

        <ResearchNoteList
          notes={idea.notes}
          onEdit={(note) => setEditingNote(note)}
          onDelete={onDeleteNote}
        />
      </section>
    </div>
  );
}
