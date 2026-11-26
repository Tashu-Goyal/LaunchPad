import {
  Building2,
  ExternalLink,
  FileSearch,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ResearchNote } from '../../types';

interface ResearchNoteListProps {
  notes: ResearchNote[];
  onEdit: (note: ResearchNote) => void;
  onDelete: (note: ResearchNote) => void;
}

export function ResearchNoteList({
  notes,
  onEdit,
  onDelete,
}: ResearchNoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <FileSearch className="h-7 w-7 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-800">
          No research notes yet
        </p>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Add interview findings, market observations, and competitor links
          above to track validation evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const timestamp = new Date(note.updated_at).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={note.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                {note.note_content}
              </p>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                  title="Edit research note"
                  aria-label="Edit research note"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(note)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete research note"
                  aria-label="Delete research note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(note.competitor_name || note.competitor_url) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {note.competitor_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    {note.competitor_name}
                  </span>
                )}
                {note.competitor_url && (
                  <a
                    href={note.competitor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="max-w-[260px] truncate">
                      {note.competitor_url}
                    </span>
                  </a>
                )}
              </div>
            )}

            <p className="mt-2.5 text-[11px] text-slate-400">
              Updated {timestamp}
            </p>
          </div>
        );
      })}
    </div>
  );
}
