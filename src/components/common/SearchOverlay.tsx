import { useEffect, useState } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useNavigation } from '../../context/NavigationContext';
import { taskService } from '../../services/db/taskService';
import { projectService } from '../../services/db/projectService';
import { ideaService } from '../../services/db/ideaService';
import type { Task, Project, Idea } from '../../types/models';
import { getRelativeDateLabel } from '../../utils/dateUtils';

function matchesQuery(text: string | undefined, query: string): boolean {
  return text?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUI();
  const { setCurrentPage } = useNavigation();
  const [query, setQuery] = useState('');
  const [taskResults, setTaskResults] = useState<Task[]>([]);
  const [projectResults, setProjectResults] = useState<Project[]>([]);
  const [ideaResults, setIdeaResults] = useState<Idea[]>([]);

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setTaskResults([]);
      setProjectResults([]);
      setIdeaResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setTaskResults([]);
      setProjectResults([]);
      setIdeaResults([]);
      return;
    }

    const run = async () => {
      const [tasks, projects, ideas] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
        ideaService.getAll(),
      ]);
      const q = query.toLowerCase();
      setTaskResults(tasks.filter((t) => 
        matchesQuery(t.title, q) || 
        matchesQuery(t.notes, q) || 
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      ).slice(0, 5));
      setProjectResults(projects.filter((p) => 
        matchesQuery(p.name, q) || 
        matchesQuery(p.description, q)
      ).slice(0, 5));
      setIdeaResults(ideas.filter((i) => 
        matchesQuery(i.title, q) || 
        matchesQuery(i.notes, q) || 
        i.tags?.some(tag => tag.toLowerCase().includes(q))
      ).slice(0, 5));
    };

    const timer = setTimeout(run, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (page: 'today' | 'tasks' | 'projects' | 'ideas') => {
    setCurrentPage(page);
    closeSearch();
  };

  if (!isSearchOpen) return null;

  const hasResults = taskResults.length + projectResults.length + ideaResults.length > 0;

  return (
    <div className="modal-overlay" onClick={closeSearch}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SearchIcon size={18} />
          <input
            className="form-input"
            autoFocus
            placeholder="Görev, proje veya fikir ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={closeSearch} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {query.trim() && !hasResults && (
          <div className="empty-state">
            <div className="empty-state-title">Sonuç bulunamadı</div>
          </div>
        )}

        {taskResults.length > 0 && (
          <div className="form-group">
            <div className="form-label">Görevler</div>
            {taskResults.map((t) => {
              const relativeDate = t.dueDate ? getRelativeDateLabel(t.dueDate) : null;
              return (
                <button
                  key={t.id}
                  className="card"
                  onClick={() => handleResultClick('tasks')}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <div className="card-body">
                    <div className="card-title">{t.title}</div>
                    {t.notes && <div className="card-meta" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{t.notes}</div>}
                    {relativeDate && (
                      <div className="card-meta">
                        <span className={`card-due-badge ${relativeDate.className}`}>{relativeDate.label}</span>
                      </div>
                    )}
                    {t.tags && t.tags.length > 0 && (
                      <div className="card-meta" style={{ marginTop: 4 }}>
                        {t.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {projectResults.length > 0 && (
          <div className="form-group">
            <div className="form-label">Projeler</div>
            {projectResults.map((p) => (
              <button
                key={p.id}
                className="card"
                onClick={() => handleResultClick('projects')}
                style={{ textAlign: 'left', width: '100%' }}
              >
                <div className="card-body">
                  <div className="card-title">{p.name}</div>
                  {p.description && <div className="card-meta" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{p.description}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {ideaResults.length > 0 && (
          <div className="form-group">
            <div className="form-label">Fikirler</div>
            {ideaResults.map((i) => (
              <button
                key={i.id}
                className="card"
                onClick={() => handleResultClick('ideas')}
                style={{ textAlign: 'left', width: '100%' }}
              >
                <div className="card-body">
                  <div className="card-title">{i.title}</div>
                  {i.notes && <div className="card-meta" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{i.notes}</div>}
                  {i.tags && i.tags.length > 0 && (
                    <div className="card-meta" style={{ marginTop: 4 }}>
                      {i.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
