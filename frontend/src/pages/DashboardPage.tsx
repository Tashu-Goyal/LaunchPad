import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Lightbulb,
  Wrench,
} from 'lucide-react';
import { DashboardStats, Idea, ValidationStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusBreakdown } from '../components/dashboard/StatusBreakdown';
import { IdeaCard } from '../components/ideas/IdeaCard';

interface DashboardPageProps {
  stats: DashboardStats | null;
  recentIdeas: Idea[];
  isLoading: boolean;
  onCreateIdea: () => void;
  onSelectIdea: (idea: Idea) => void;
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (idea: Idea) => void;
  onOpenIdeasWithFilter: (options: {
    status?: ValidationStatus | 'All';
    needsImprovementOnly?: boolean;
  }) => void;
}

export function DashboardPage({
  stats,
  recentIdeas,
  isLoading,
  onCreateIdea,
  onSelectIdea,
  onEditIdea,
  onDeleteIdea,
  onOpenIdeasWithFilter,
}: DashboardPageProps) {
  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  const safeStats: DashboardStats = stats ?? {
    total_ideas: 0,
    under_research: 0,
    validated: 0,
    needs_improvement: 0,
    status_breakdown: {
      'Not Started': 0,
      Researching: 0,
      Validating: 0,
      Validated: 0,
      Rejected: 0,
    },
  };

  return (
    <div className="space-y-6">
      {/* 4 Dynamic KPI Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Ideas"
          value={safeStats.total_ideas}
          subtitle="All startup concepts in LaunchPad"
          icon={Lightbulb}
          accent="indigo"
          onClick={() =>
            onOpenIdeasWithFilter({ status: 'All', needsImprovementOnly: false })
          }
        />

        <StatCard
          label="Under Research"
          value={safeStats.under_research}
          subtitle="Currently in Researching or Validating"
          icon={Compass}
          accent="blue"
          onClick={() =>
            onOpenIdeasWithFilter({
              status: 'Researching',
              needsImprovementOnly: false,
            })
          }
        />

        <StatCard
          label="Validated Ideas"
          value={safeStats.validated}
          subtitle="Confirmed market & problem-solution fit"
          icon={CheckCircle2}
          accent="emerald"
          onClick={() =>
            onOpenIdeasWithFilter({
              status: 'Validated',
              needsImprovementOnly: false,
            })
          }
        />

        <StatCard
          label="Needs Improvement"
          value={safeStats.needs_improvement}
          subtitle="Flagged for refinement or pivot"
          icon={Wrench}
          accent="orange"
          onClick={() =>
            onOpenIdeasWithFilter({
              status: 'All',
              needsImprovementOnly: true,
            })
          }
        />
      </section>

      {/* Pipeline Distribution */}
      <StatusBreakdown
        totalIdeas={safeStats.total_ideas}
        breakdown={safeStats.status_breakdown}
        onSelectStatus={(status) =>
          onOpenIdeasWithFilter({ status, needsImprovementOnly: false })
        }
      />

      {/* Recent Startup Ideas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Startup Ideas
            </h2>
            <p className="text-xs text-slate-500">
              Jump directly into an idea to update its validation stage or
              research notes.
            </p>
          </div>
          {recentIdeas.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onOpenIdeasWithFilter({
                  status: 'All',
                  needsImprovementOnly: false,
                })
              }
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {recentIdeas.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No startup ideas tracked yet"
            description="Add your first startup concept to start tracking validation status, customer discovery notes, and competitors."
            actionLabel="Create Your First Idea"
            onAction={onCreateIdea}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentIdeas.slice(0, 6).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onSelect={onSelectIdea}
                onEdit={onEditIdea}
                onDelete={onDeleteIdea}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
