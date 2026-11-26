import {
  CheckCircle2,
  Compass,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  Rocket,
  Wrench,
  X,
} from 'lucide-react';
import { DashboardStats, ValidationStatus } from '../../types';

export type ActiveNav = 'dashboard' | 'ideas';

interface SidebarProps {
  activeNav: ActiveNav;
  activeStatusFilter: ValidationStatus | 'All';
  needsImprovementOnly: boolean;
  stats: DashboardStats | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigateDashboard: () => void;
  onNavigateIdeas: (options?: {
    status?: ValidationStatus | 'All';
    needsImprovementOnly?: boolean;
  }) => void;
}

export function Sidebar({
  activeNav,
  activeStatusFilter,
  needsImprovementOnly,
  stats,
  mobileOpen,
  onCloseMobile,
  onNavigateDashboard,
  onNavigateIdeas,
}: SidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Brand header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">
              LaunchPad
            </p>
            <p className="text-[11px] text-slate-400">
              Idea Validation Platform
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onNavigateDashboard();
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateIdeas({ status: 'All', needsImprovementOnly: false });
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'ideas' &&
                activeStatusFilter === 'All' &&
                !needsImprovementOnly
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Lightbulb className="h-4 w-4" />
                All Ideas
              </span>
              {stats && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs tabular-nums text-slate-300">
                  {stats.total_ideas}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pipeline quick views */}
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quick Views
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onNavigateIdeas({
                  status: 'Researching',
                  needsImprovementOnly: false,
                });
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'ideas' &&
                activeStatusFilter === 'Researching' &&
                !needsImprovementOnly
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Compass className="h-4 w-4 text-blue-400" />
                Researching
              </span>
              <span className="text-xs tabular-nums text-slate-400">
                {stats?.status_breakdown['Researching'] ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateIdeas({
                  status: 'Validating',
                  needsImprovementOnly: false,
                });
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'ideas' &&
                activeStatusFilter === 'Validating' &&
                !needsImprovementOnly
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FlaskConical className="h-4 w-4 text-amber-400" />
                Validating
              </span>
              <span className="text-xs tabular-nums text-slate-400">
                {stats?.status_breakdown['Validating'] ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateIdeas({
                  status: 'Validated',
                  needsImprovementOnly: false,
                });
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'ideas' &&
                activeStatusFilter === 'Validated' &&
                !needsImprovementOnly
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Validated
              </span>
              <span className="text-xs tabular-nums text-slate-400">
                {stats?.validated ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateIdeas({
                  status: 'All',
                  needsImprovementOnly: true,
                });
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeNav === 'ideas' && needsImprovementOnly
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4 text-orange-400" />
                Needs Improvement
              </span>
              <span className="text-xs tabular-nums text-slate-400">
                {stats?.needs_improvement ?? 0}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer note */}
      <div className="border-t border-slate-800 px-5 py-4">
        <p className="text-xs font-medium text-slate-400">
          SQLite Persistence Active
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          FastAPI REST API • Real-time metrics
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800 lg:block">
        {navContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] shrink-0">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
