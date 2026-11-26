import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  Idea,
  IdeaPayload,
  VALIDATION_STATUSES,
  ValidationStatus,
} from '../../types';

interface IdeaFormModalProps {
  isOpen: boolean;
  initialIdea: Idea | null;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (payload: IdeaPayload) => Promise<void>;
  onClose: () => void;
}

export function IdeaFormModal({
  isOpen,
  initialIdea,
  isSubmitting,
  serverError,
  onSubmit,
  onClose,
}: IdeaFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState<ValidationStatus>('Not Started');
  const [needsImprovement, setNeedsImprovement] = useState(false);
  const [improvementNote, setImprovementNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    if (initialIdea) {
      setTitle(initialIdea.title);
      setDescription(initialIdea.description);
      setProblemStatement(initialIdea.problem_statement);
      setProposedSolution(initialIdea.proposed_solution);
      setTargetAudience(initialIdea.target_audience);
      setStatus(initialIdea.status);
      setNeedsImprovement(initialIdea.needs_improvement);
      setImprovementNote(initialIdea.improvement_note ?? '');
    } else {
      setTitle('');
      setDescription('');
      setProblemStatement('');
      setProposedSolution('');
      setTargetAudience('');
      setStatus('Not Started');
      setNeedsImprovement(false);
      setImprovementNote('');
    }
  }, [isOpen, initialIdea]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !title.trim() ||
      !description.trim() ||
      !problemStatement.trim() ||
      !proposedSolution.trim() ||
      !targetAudience.trim()
    ) {
      setValidationError(
        'Please complete all required startup idea fields before saving.',
      );
      return;
    }

    setValidationError(null);
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      problem_statement: problemStatement.trim(),
      proposed_solution: proposedSolution.trim(),
      target_audience: targetAudience.trim(),
      status,
      needs_improvement: needsImprovement,
      improvement_note: needsImprovement
        ? improvementNote.trim() || null
        : null,
    });
  };

  const activeError = validationError || serverError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idea-form-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="idea-form-title"
              className="text-lg font-semibold text-slate-900"
            >
              {initialIdea ? 'Edit Startup Idea' : 'Create New Startup Idea'}
            </h2>
            <p className="text-xs text-slate-500">
              Capture the problem, solution, target market, and validation stage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5">
          {activeError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Idea Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AI Compliance Copilot for Boutique Clinics"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Short Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                maxLength={3000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize what this startup does in 1–2 sentences."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Target Audience <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Independent dental clinics (5–20 staff)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Validation Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ValidationStatus)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {VALIDATION_STATUSES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Problem Statement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={3000}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="What painful, costly, or frequent problem does the customer face today?"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Proposed Solution <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={3000}
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                placeholder="How does your product solve this problem better than current workarounds?"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Separate Needs Improvement indicator */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={needsImprovement}
                  onChange={(e) => setNeedsImprovement(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    Flag as Needs Improvement
                  </span>
                  <p className="text-xs text-slate-500">
                    Tracked separately from validation status so you can mark
                    ideas needing refinement, pricing clarity, or a pivot.
                  </p>
                </div>
              </label>

              {needsImprovement && (
                <div className="mt-3">
                  <input
                    type="text"
                    maxLength={1000}
                    value={improvementNote}
                    onChange={(e) => setImprovementNote(e.target.value)}
                    placeholder="Optional: What needs improvement? (e.g., narrow ICP, validate willingness to pay)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting
                ? 'Saving...'
                : initialIdea
                  ? 'Save Changes'
                  : 'Create Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
