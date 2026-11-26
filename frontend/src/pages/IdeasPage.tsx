import { Lightbulb, SearchX } from 'lucide-react';
import {
  Idea,
  IdeaDetail,
  IdeaFiltersState,
  ResearchNote,
  ResearchNotePayload,
  ValidationStatus,
} from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { IdeaCard } from '../components/ideas/IdeaCard';
import { IdeaDetailView } from '../components/ideas/IdeaDetailView';
import { IdeaFilters } from '../components/ideas/IdeaFilters';

interface IdeasPageProps {
  ideas: Idea[];
  selectedIdea: IdeaDetail | null;
  filters: IdeaFiltersState;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  isUpdatingStatus: boolean;
  isUpdatingImprovement: boolean;
  isSubmittingNote: boolean;
  noteServerError: string | null;
  onFiltersChange: (next: IdeaFiltersState) => void;
  onCreateIdea: () => void;
  onSelectIdea: (idea: Idea) => void;
  onCloseDetail: () => void;
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (idea: Idea) => void;
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

export function IdeasPage({
  ideas,
  selectedIdea,
  filters,
  isLoadingList,
  isLoadingDetail,
  isUpdatingStatus,
  isUpdatingImprovement,
  isSubmittingNote,
  noteServerError,
  onFiltersChange,
  onCreateIdea,
  onSelectIdea,
  onCloseDetail,
  onEditIdea,
  onDeleteIdea,
  onChangeStatus,
  onUpdateImprovement,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: IdeasPageProps) {
  if (isLoadingDetail) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (selectedIdea) {
    return (
      <IdeaDetailView
        idea={selectedIdea}
        isUpdatingStatus={isUpdatingStatus}
        isUpdatingImprovement={isUpdatingImprovement}
        isSubmittingNote={isSubmittingNote}
        noteServerError={noteServerError}
        onBack={onCloseDetail}
        onEditIdea={() => onEditIdea(selectedIdea)}
        onDeleteIdea={() => onDeleteIdea(selectedIdea)}
        onChangeStatus={onChangeStatus}
        onUpdateImprovement={onUpdateImprovement}
        onCreateNote={onCreateNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
      />
    );
  }

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== 'All' ||
    filters.needsImprovementOnly;

  return (
    <div className="space-y-5">
      <IdeaFilters filters={filters} onChange={onFiltersChange} />

      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          Showing {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
        </span>
      </div>

      {isLoadingList ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={SearchX}
            title="No matching startup ideas"
            description="Try adjusting your search keywords, status filter, or improvement filter."
            actionLabel="Clear Filters"
            onAction={() =>
              onFiltersChange({
                search: '',
                status: 'All',
                needsImprovementOnly: false,
              })
            }
          />
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="Your idea pipeline is empty"
            description="Create a startup idea to define the problem statement, proposed solution, and target audience."
            actionLabel="Create Startup Idea"
            onAction={onCreateIdea}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
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
    </div>
  );
}
