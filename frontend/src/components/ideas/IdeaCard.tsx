import {
  ArrowRight,
  FileText,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import { Idea } from '../../types';
import { ImprovementBadge, StatusBadge } from './StatusBadge';

interface IdeaCardProps {
  idea: Idea;
  onSelect: (idea: Idea) => void;
  onEdit: (idea: Idea) => void;
  onDelete: (idea: Idea) => void;
}

export function IdeaCard({
  idea,
  onSelect,
  onEdit,
  onDelete,
}: IdeaCardProps) {
  const formattedDate = new Date(idea.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <div>
        {/* Status & Improvement badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={idea.status} />
            {idea.needs_improvement && <ImprovementBadge />}
          </div>
          <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(idea);
              }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
              title="Edit idea"
              aria-label={`Edit ${idea.title}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea);
              }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Delete idea"
              aria-label={`Delete ${idea.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title and summary */}
        <button
          type="button"
          onClick={() => onSelect(idea)}
          className="mt-3 block w-full text-left"
        >
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition group-hover:text-indigo-600">
            {idea.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {idea.description}
          </p>
        </button>

        {/* Target audience */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate font-medium">{idea.target_audience}</span>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            {idea.notes_count} {idea.notes_count === 1 ? 'note' : 'notes'}
          </span>
          <span>Updated {formattedDate}</span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(idea)}
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          <span>Open</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
