import { VALIDATION_STATUSES, ValidationStatus } from '../../types';

interface StatusBreakdownProps {
  totalIdeas: number;
  breakdown: Record<ValidationStatus, number>;
  onSelectStatus: (status: ValidationStatus) => void;
}

const BAR_COLORS: Record<ValidationStatus, string> = {
  'Not Started': 'bg-slate-400',
  Researching: 'bg-blue-500',
  Validating: 'bg-amber-500',
  Validated: 'bg-emerald-500',
  Rejected: 'bg-rose-500',
};

export function StatusBreakdown({
  totalIdeas,
  breakdown,
  onSelectStatus,
}: StatusBreakdownProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Validation Pipeline Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Click any stage to filter your startup ideas
          </p>
        </div>
        <span className="text-xs font-medium tabular-nums text-slate-500">
          {totalIdeas} total {totalIdeas === 1 ? 'idea' : 'ideas'}
        </span>
      </div>

      {/* Stacked progress bar */}
      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {totalIdeas > 0 &&
          VALIDATION_STATUSES.map((status) => {
            const count = breakdown[status] ?? 0;
            if (count === 0) return null;
            const widthPct = (count / totalIdeas) * 100;
            return (
              <div
                key={status}
                style={{ width: `${widthPct}%` }}
                className={`${BAR_COLORS[status]} transition-all`}
                title={`${status}: ${count}`}
              />
            );
          })}
      </div>

      {/* Stage breakdown list */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {VALIDATION_STATUSES.map((status) => {
          const count = breakdown[status] ?? 0;
          const pct = totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onSelectStatus(status)}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-indigo-300 hover:bg-white"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${BAR_COLORS[status]}`} />
                <span className="truncate text-xs font-medium text-slate-600">
                  {status}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold tabular-nums text-slate-900">
                  {count}
                </span>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
