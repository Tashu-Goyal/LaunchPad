import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api/client';
import { fetchDashboardStats } from './api/dashboard';
import {
  createIdea,
  deleteIdea,
  fetchIdeaDetail,
  fetchIdeas,
  updateIdea,
  updateIdeaImprovement,
  updateIdeaStatus,
} from './api/ideas';
import {
  createResearchNote,
  deleteResearchNote,
  updateResearchNote,
} from './api/notes';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import {
  ToastContainer,
  ToastMessage,
  ToastVariant,
} from './components/common/Toast';
import { IdeaFormModal } from './components/ideas/IdeaFormModal';
import { Header } from './components/layout/Header';
import { ActiveNav, Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { IdeasPage } from './pages/IdeasPage';
import {
  DashboardStats,
  Idea,
  IdeaDetail,
  IdeaFiltersState,
  IdeaPayload,
  ResearchNote,
  ResearchNotePayload,
  ValidationStatus,
} from './types';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function App() {
  const [activeNav, setActiveNav] = useState<ActiveNav>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaDetail | null>(null);

  const [filters, setFilters] = useState<IdeaFiltersState>({
    search: '',
    status: 'All',
    needsImprovementOnly: false,
  });
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Form Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [ideaServerError, setIdeaServerError] = useState<string | null>(null);

  // Detail mutations
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingImprovement, setIsUpdatingImprovement] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteServerError, setNoteServerError] = useState<string | null>(null);

  // Delete confirmation state
  const [ideaPendingDelete, setIdeaPendingDelete] = useState<Idea | null>(null);
  const [notePendingDelete, setNotePendingDelete] =
    useState<ResearchNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((variant: ToastVariant, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, variant, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    try {
      const [nextStats, allIdeas] = await Promise.all([
        fetchDashboardStats(),
        fetchIdeas(),
      ]);
      setStats(nextStats);
      setRecentIdeas(allIdeas);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to load dashboard metrics.';
      pushToast('error', message);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [pushToast]);

  const refreshFilteredIdeas = useCallback(async () => {
    setIsLoadingIdeas(true);
    try {
      const result = await fetchIdeas({
        search: debouncedSearch,
        status: filters.status,
        needsImprovementOnly: filters.needsImprovementOnly,
      });
      setIdeas(result);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load startup ideas.';
      pushToast('error', message);
    } finally {
      setIsLoadingIdeas(false);
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.needsImprovementOnly,
    pushToast,
  ]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    if (activeNav === 'ideas') {
      void refreshFilteredIdeas();
    }
  }, [activeNav, refreshFilteredIdeas]);

  const openIdeaDetail = async (idea: Idea) => {
    setActiveNav('ideas');
    setIsLoadingDetail(true);
    setNoteServerError(null);
    try {
      const detail = await fetchIdeaDetail(idea.id);
      setSelectedIdea(detail);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to load idea details.';
      pushToast('error', message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openCreateModal = () => {
    setEditingIdea(null);
    setIdeaServerError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (idea: Idea) => {
    setEditingIdea(idea);
    setIdeaServerError(null);
    setFormModalOpen(true);
  };

  const handleSaveIdea = async (payload: IdeaPayload) => {
    setIsSubmittingIdea(true);
    setIdeaServerError(null);
    try {
      if (editingIdea) {
        const updated = await updateIdea(editingIdea.id, payload);
        pushToast('success', `"${updated.title}" updated.`);
        if (selectedIdea && selectedIdea.id === updated.id) {
          const refreshedDetail = await fetchIdeaDetail(updated.id);
          setSelectedIdea(refreshedDetail);
        }
      } else {
        const created = await createIdea(payload);
        pushToast('success', `"${created.title}" added to LaunchPad.`);
      }
      setFormModalOpen(false);
      await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to save startup idea.';
      setIdeaServerError(message);
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const handleStatusChange = async (status: ValidationStatus) => {
    if (!selectedIdea) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateIdeaStatus(selectedIdea.id, status);
      setSelectedIdea((prev) => (prev ? { ...prev, ...updated } : null));
      pushToast('success', `Validation stage set to "${status}".`);
      await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update validation status.';
      pushToast('error', message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleImprovementChange = async (
    needsImprovement: boolean,
    improvementNote: string | null,
  ) => {
    if (!selectedIdea) return;
    setIsUpdatingImprovement(true);
    try {
      const updated = await updateIdeaImprovement(
        selectedIdea.id,
        needsImprovement,
        improvementNote,
      );
      setSelectedIdea((prev) => (prev ? { ...prev, ...updated } : null));
      pushToast(
        'success',
        needsImprovement
          ? 'Idea flagged as needing improvement.'
          : 'Improvement flag cleared.',
      );
      await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update improvement flag.';
      pushToast('error', message);
    } finally {
      setIsUpdatingImprovement(false);
    }
  };

  const handleCreateNote = async (payload: ResearchNotePayload) => {
    if (!selectedIdea) return;
    setIsSubmittingNote(true);
    setNoteServerError(null);
    try {
      await createResearchNote(selectedIdea.id, payload);
      const refreshed = await fetchIdeaDetail(selectedIdea.id);
      setSelectedIdea(refreshed);
      pushToast('success', 'Research note added.');
      await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to add research note.';
      setNoteServerError(message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateNote = async (
    noteId: number,
    payload: ResearchNotePayload,
  ) => {
    if (!selectedIdea) return;
    setIsSubmittingNote(true);
    setNoteServerError(null);
    try {
      await updateResearchNote(noteId, payload);
      const refreshed = await fetchIdeaDetail(selectedIdea.id);
      setSelectedIdea(refreshed);
      pushToast('success', 'Research note updated.');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update research note.';
      setNoteServerError(message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (ideaPendingDelete) {
        const deletedId = ideaPendingDelete.id;
        const deletedTitle = ideaPendingDelete.title;
        await deleteIdea(deletedId);
        if (selectedIdea && selectedIdea.id === deletedId) {
          setSelectedIdea(null);
        }
        setIdeaPendingDelete(null);
        pushToast('success', `"${deletedTitle}" deleted.`);
        await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
      } else if (notePendingDelete && selectedIdea) {
        await deleteResearchNote(notePendingDelete.id);
        const refreshed = await fetchIdeaDetail(selectedIdea.id);
        setSelectedIdea(refreshed);
        setNotePendingDelete(null);
        pushToast('success', 'Research note deleted.');
        await Promise.all([refreshDashboard(), refreshFilteredIdeas()]);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Delete operation failed.';
      pushToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToIdeas = (options?: {
    status?: ValidationStatus | 'All';
    needsImprovementOnly?: boolean;
  }) => {
    setSelectedIdea(null);
    setActiveNav('ideas');
    setFilters((prev) => ({
      ...prev,
      status: options?.status ?? prev.status,
      needsImprovementOnly:
        options?.needsImprovementOnly ?? prev.needsImprovementOnly,
    }));
  };

  const pageMeta =
    activeNav === 'dashboard'
      ? {
          title: 'Validation Dashboard',
          subtitle:
            'Real-time overview of your startup ideas, validation stages, and research progress.',
        }
      : selectedIdea
        ? {
            title: selectedIdea.title,
            subtitle:
              'Manage validation stage, improvement status, and market research evidence.',
          }
        : {
            title: 'Startup Ideas',
            subtitle:
              'Search, filter, and organize your startup validation pipeline.',
          };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activeNav={activeNav}
        activeStatusFilter={filters.status}
        needsImprovementOnly={filters.needsImprovementOnly}
        stats={stats}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNavigateDashboard={() => {
          setSelectedIdea(null);
          setActiveNav('dashboard');
          void refreshDashboard();
        }}
        onNavigateIdeas={navigateToIdeas}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onCreateIdea={openCreateModal}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeNav === 'dashboard' ? (
            <DashboardPage
              stats={stats}
              recentIdeas={recentIdeas}
              isLoading={isLoadingDashboard}
              onCreateIdea={openCreateModal}
              onSelectIdea={(idea) => void openIdeaDetail(idea)}
              onEditIdea={openEditModal}
              onDeleteIdea={(idea) => setIdeaPendingDelete(idea)}
              onOpenIdeasWithFilter={navigateToIdeas}
            />
          ) : (
            <IdeasPage
              ideas={ideas}
              selectedIdea={selectedIdea}
              filters={filters}
              isLoadingList={isLoadingIdeas}
              isLoadingDetail={isLoadingDetail}
              isUpdatingStatus={isUpdatingStatus}
              isUpdatingImprovement={isUpdatingImprovement}
              isSubmittingNote={isSubmittingNote}
              noteServerError={noteServerError}
              onFiltersChange={setFilters}
              onCreateIdea={openCreateModal}
              onSelectIdea={(idea) => void openIdeaDetail(idea)}
              onCloseDetail={() => setSelectedIdea(null)}
              onEditIdea={openEditModal}
              onDeleteIdea={(idea) => setIdeaPendingDelete(idea)}
              onChangeStatus={handleStatusChange}
              onUpdateImprovement={handleImprovementChange}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={(note) => setNotePendingDelete(note)}
            />
          )}
        </main>
      </div>

      {/* Create / Edit Startup Idea Modal */}
      <IdeaFormModal
        isOpen={formModalOpen}
        initialIdea={editingIdea}
        isSubmitting={isSubmittingIdea}
        serverError={ideaServerError}
        onSubmit={handleSaveIdea}
        onClose={() => setFormModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(ideaPendingDelete || notePendingDelete)}
        title={
          ideaPendingDelete ? 'Delete Startup Idea?' : 'Delete Research Note?'
        }
        message={
          ideaPendingDelete
            ? `Are you sure you want to delete "${ideaPendingDelete.title}"? All associated research notes will also be permanently removed.`
            : 'Are you sure you want to delete this research note? This action cannot be undone.'
        }
        isSubmitting={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          setIdeaPendingDelete(null);
          setNotePendingDelete(null);
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
