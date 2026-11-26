import type { LucideIcon } from 'lucide-react';

export type StatAccent = 'indigo' | 'blue' | 'emerald' | 'orange';

interface StatCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  accent: StatAccent;
  onClick?: () => void;
}

const ACCENT_MAP: Record<StatAccent, { iconBg: string; ring: string }> = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    ring: 'hover:border-indigo-300',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    ring: 'hover:border-blue-300',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    ring: 'hover:border-emerald-300',
  },
  orange: {
    iconBg: 'bg-orange-50 text-orange-600',
    ring: 'hover:border-orange-300',
  },
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
  onClick,
}: StatCardProps) {
  const styles = ACCENT_MAP[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group flex w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition ${
        onClick ? `cursor-pointer hover:shadow-md ${styles.ring}` : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </button>
  );
}
