import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Lightbulb, Trash2, Edit2, X, MoreVertical, CheckSquare, FolderKanban, Plus } from 'lucide-react';
import { ideaService } from '../services/db/ideaService';
import { taskService } from '../services/db/taskService';
import { projectService } from '../services/db/projectService';
import { useDataRefresh } from '../context/DataRefreshContext';
import { useToast } from '../context/ToastContext';
import type { Idea } from '../types/models';
import { SearchBar } from '../components/common/SearchBar';

interface IdeaFormData {
  title: string;
  notes: string;
  tags: string;
}

interface SwipeState {
  ideaId: string | null;
  offsetX: number;
  isOpen: boolean;
}

export function IdeasPage() {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const { showToast, hideToast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [contextMenu, setContextMenu] = useState<{ ideaId: string; x: number; y: number } | null>(null);
  const [formData, setFormData] = useState<IdeaFormData>({ title: '', notes: '', tags: '' });
  const [swipeState, setSwipeState] = useState<SwipeState>({ ideaId: null, offsetX: 0, isOpen: false });

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');

  const sortOptions = [
    { value: 'title-asc', label: 'A-Z' },
    { value: 'title-desc', label: 'Z-A' },
    { value: 'date-desc', label: 'Oluşturulma (Yeni → Eski)' },
    { value: 'date-asc', label: 'Oluşturulma (Eski → Yeni)' },
  ];

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  useEffect(() => {
    ideaService.getAll().then(setIdeas);
  }, [refreshKey]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((i) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return i.title.toLowerCase().includes(q) || 
             i.notes?.toLowerCase().includes(q) ||
             i.tags?.some(tag => tag.toLowerCase().includes(q));
    }).sort((a, b) => {
      if (!sortBy) return 0;
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [ideas, searchQuery, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !e.composedPath().some(el => (el as HTMLElement).classList?.contains?.('context-menu'))) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleEdit = (idea: Idea) => {
    setFormData({
      title: idea.title,
      notes: idea.notes || '',
      tags: idea.tags?.join(', ') || '',
    });
    setEditingIdea(idea);
    setContextMenu(null);
  };

  const handleDelete = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    await ideaService.remove(ideaId);
    triggerRefresh();

    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    showToast(
      `"${idea.title}" silindi`,
      'warning',
      {
        label: 'Geri Al',
        onClick: async () => {
          await ideaService.create({
            title: idea.title,
            notes: idea.notes,
            tags: idea.tags,
          });
          triggerRefresh();
          hideToast(toastId);
        }
      }
    );
    setContextMenu(null);
  };

  const handleConvertToTask = async (idea: Idea) => {
    const tags = idea.tags || [];
    const allTasks = await taskService.getAll();
    const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order || 0)) : 0;
    await taskService.create({
      title: idea.title,
      notes: idea.notes,
      tags,
      priority: 'medium',
      order: maxOrder + 1,
    });
    triggerRefresh();
    showToast('Fikir görev olarak oluşturuldu', 'success');
    setContextMenu(null);
  };

  const handleConvertToProject = async (idea: Idea) => {
    await projectService.create({
      name: idea.title,
      description: idea.notes,
      color: '#4f46e5',
    });
    triggerRefresh();
    showToast('Fikir proje olarak oluşturuldu', 'success');
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, ideaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setContextMenu({ ideaId, x: rect.left, y: rect.bottom });
  };

  const handleTouchStart = useCallback((_e: React.TouchEvent, ideaId: string) => {
    setSwipeState({ ideaId, offsetX: 0, isOpen: false });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, ideaId: string) => {
    const target = e.touches[0].target as HTMLElement;
    const deltaX = e.touches[0].clientX - target.getBoundingClientRect().left;
    if (deltaX < 0 && Math.abs(deltaX) > 10) {
      e.preventDefault();
      setSwipeState(prev => prev.ideaId === ideaId ? { ...prev, offsetX: Math.max(deltaX, -100), isOpen: Math.abs(deltaX) > 60 } : prev);
    }
  }, []);

  const handleTouchEnd = useCallback((_e: React.TouchEvent, ideaId: string) => {
    if (swipeState.ideaId === ideaId && swipeState.isOpen) {
      handleDelete(ideaId);
    }
    setSwipeState({ ideaId: null, offsetX: 0, isOpen: false });
  }, [swipeState, handleDelete]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !editingIdea) return;
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await ideaService.update(editingIdea.id, {
      title: formData.title.trim(),
      notes: formData.notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    setEditingIdea(null);
    triggerRefresh();
  };

  const handleCancel = () => {
    setEditingIdea(null);
    setFormData({ title: '', notes: '', tags: '' });
  };

  if (ideas.length === 0) {
    return (
      <div className="empty-state">
        <Lightbulb size={48} className="empty-state-icon" />
        <div className="empty-state-title">Henüz fikir yok</div>
        <div className="empty-state-subtitle">Aklınızdaki fikirleri buraya kaydedin</div>
      </div>
    );
  }

  return (
    <>
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 20, 
        height: 'var(--topbar-height)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 var(--space-4)', 
        background: 'var(--color-bg-elevated)', 
        borderBottom: '1px solid var(--color-border)' 
      }}>
        <div className="top-bar-title">Fikirler</div>
        <button 
          onClick={() => { setFormData({ title: '', notes: '', tags: '' }); setEditingIdea(null); }}
          aria-label="Yeni fikir"
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'var(--color-primary)', 
            color: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={20} />
        </button>
      </header>

      <SearchBar
        onSearch={handleSearch}
        onSortChange={handleSortChange}
        sorts={[
          { value: 'title-asc', label: 'A-Z' },
          { value: 'title-desc', label: 'Z-A' },
          { value: 'date-desc', label: 'Oluşturulma (Yeni → Eski)' },
          { value: 'date-asc', label: 'Oluşturulma (Eski → Yeni)' },
        ]}
        currentSort={sortBy}
        placeholder="Fikir ara..."
      />

      <div>
        {filteredIdeas.map((idea) => {
          const swipe = swipeState.ideaId === idea.id ? swipeState : { offsetX: 0, isOpen: false };

          return (
            <div
              key={idea.id}
              className="card"
              style={{ 
                flexDirection: 'column', 
                alignItems: 'stretch',
                transform: swipe.isOpen ? 'translateX(-100px)' : `translateX(${swipe.offsetX}px)`,
                transition: 'transform 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onTouchStart={(e) => handleTouchStart(e, idea.id)}
              onTouchMove={(e) => handleTouchMove(e, idea.id)}
              onTouchEnd={(e) => handleTouchEnd(e, idea.id)}
            >
              <div className="swipe-delete" style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '100px',
                background: 'var(--color-danger)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                opacity: swipe.isOpen ? 1 : Math.abs(swipe.offsetX) / 100,
                pointerEvents: 'none',
              }}>
                <Trash2 size={24} /> Sil
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1,
              }}>
                <div className="card-title">{idea.title}</div>
                <button
                  onClick={(e) => handleContextMenu(e, idea.id)}
                  className="top-bar-icon-btn"
                  aria-label="Daha fazla seçenek"
                  style={{ padding: 4, flexShrink: 0 }}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
              {idea.notes && <div className="card-meta">{idea.notes}</div>}
              {idea.tags && idea.tags.length > 0 && (
                <div className="card-meta" style={{ marginTop: 6 }}>
                  {idea.tags.map((tag) => (
                    <span key={tag} className="badge badge-neutral">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {contextMenu?.ideaId === idea.id && (
                <div 
                  className="context-menu"
                  style={{
                    position: 'fixed',
                    left: contextMenu.x,
                    top: contextMenu.y,
                    zIndex: 1000,
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 180,
                    padding: 'var(--space-1)',
                  }}
                >
                  <button
                    onClick={() => handleConvertToTask(idea)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <CheckSquare size={16} /> Göreve Dönüştür
                  </button>
                  <button
                    onClick={() => handleConvertToProject(idea)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <FolderKanban size={16} /> Projeye Dönüştür
                  </button>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-1) 0' }} />
                  <button
                    onClick={() => handleEdit(idea)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Edit2 size={16} /> Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Trash2 size={16} /> Sil
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingIdea && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">Fikri Düzenle</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Başlık</label>
              <input
                className="form-input"
                autoFocus
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notlar (opsiyonel)</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Etiketler (virgülle ayrılmış)</label>
              <input
                className="form-input"
                placeholder="örn: pwa, ipucu, proje"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCancel}>
                İptal
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
