import { Menu, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
  onCreateIdea: () => void;
}

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onCreateIdea,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateIdea}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="h-4 w-4" />
          <span>New Idea</span>
        </button>
      </div>
    </header>
  );
}
