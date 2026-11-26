import { Search, Wrench, X } from 'lucide-react';
import {
  IdeaFiltersState,
  VALIDATION_STATUSES,
  ValidationStatus,
} from '../../types';

interface IdeaFiltersProps {
  filters: IdeaFiltersState;
  onChange: (next: IdeaFiltersState) => void;
}

const STATUS_OPTIONS: Array<ValidationStatus | 'All'> = [
  'All',
  ...VALIDATION_STATUSES,
];

export function IdeaFilters({ filters, onChange }: IdeaFiltersProps) {
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== 'All' ||
    filters.needsImprovementOnly;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search ideas by title, problem, solution, or audience..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Improvement filter toggle */}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...filters,
              needsImprovementOnly: !filters.needsImprovementOnly,
            })
          }
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
            filters.needsImprovementOnly
              ? 'border-orange-300 bg-orange-50 text-orange-800'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Needs Improvement</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({
                search: '',
                status: 'All',
                needsImprovementOnly: false,
              })
            }
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Reset
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((status) => {
          const isActive = filters.status === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onChange({ ...filters, status })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
