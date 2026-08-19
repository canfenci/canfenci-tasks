import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, Edit2, MoreVertical, Trash2, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { taskService } from '../services/db/taskService';
import { projectService } from '../services/db/projectService';
import { useDataRefresh } from '../context/DataRefreshContext';
import { useToast } from '../context/ToastContext';
import type { Task, Project, Priority } from '../types/models';
import { isToday, isOverdue, getRelativeDateLabel } from '../utils/dateUtils';

interface TaskFormData {
  title: string;
  notes: string;
  priority: Priority;
  dueDate: string;
  projectId: string;
  tags: string;
}

interface SwipeState {
  taskId: string | null;
  offsetX: number;
  isOpen: boolean;
}

export function TodayPage() {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const { showToast, hideToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [contextMenu, setContextMenu] = useState<{ taskId: string; x: number; y: number } | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    notes: '',
    priority: 'none',
    dueDate: '',
    projectId: '',
    tags: '',
  });
  const [swipeState, setSwipeState] = useState<SwipeState>({ taskId: null, offsetX: 0, isOpen: false });

  useEffect(() => {
    Promise.all([taskService.getAll(), projectService.getAll()]).then(([t, p]) => {
      setTasks(t);
      setProjects(p.filter((proj) => !proj.archived));
    });
  }, [refreshKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !e.composedPath().some(el => (el as HTMLElement).classList?.contains?.('context-menu'))) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const relevantTasks = tasks.filter(
    (t) => !t.completed && (isToday(t.dueDate) || isOverdue(t.dueDate))
  );

  // İstatistik hesaplamaları
  const todayTotal = useMemo(() => 
    tasks.filter(t => isToday(t.dueDate)).length, 
    [tasks]
  );
  const todayCompleted = useMemo(() => 
    tasks.filter(t => t.completed && isToday(t.dueDate)).length, 
    [tasks]
  );
  const overdue = useMemo(() => 
    tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length, 
    [tasks]
  );
  const completionRate = useMemo(() => 
    todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0, 
    [todayTotal, todayCompleted]
  );

  const handleToggle = async (id: string) => {
    await taskService.toggleComplete(id);
    triggerRefresh();
  };

  const handleDelete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await taskService.remove(taskId);
    triggerRefresh();

    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    showToast(
      `"${task.title}" silindi`,
      'warning',
      {
        label: 'Geri Al',
        onClick: async () => {
          await taskService.create({
            title: task.title,
            notes: task.notes,
            priority: task.priority,
            dueDate: task.dueDate,
            projectId: task.projectId,
            tags: task.tags,
            completed: task.completed,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          } as any);
          triggerRefresh();
          hideToast(toastId);
        }
      }
    );
    setContextMenu(null);
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      notes: task.notes || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      projectId: task.projectId || '',
      tags: task.tags?.join(', ') || '',
    });
    setEditingTask(task);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setContextMenu({ taskId, x: rect.left, y: rect.bottom });
  };

  const handleTouchStart = useCallback((_e: React.TouchEvent, taskId: string) => {
    setSwipeState({ taskId, offsetX: 0, isOpen: false });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, taskId: string) => {
    const target = e.touches[0].target as HTMLElement;
    const deltaX = e.touches[0].clientX - target.getBoundingClientRect().left;
    if (deltaX < 0 && Math.abs(deltaX) > 10) {
      e.preventDefault();
      setSwipeState(prev => prev.taskId === taskId ? { ...prev, offsetX: Math.max(deltaX, -100), isOpen: Math.abs(deltaX) > 60 } : prev);
    }
  }, []);

  const handleTouchEnd = useCallback((_e: React.TouchEvent, taskId: string) => {
    if (swipeState.taskId === taskId && swipeState.isOpen) {
      handleDelete(taskId);
    }
    setSwipeState({ taskId: null, offsetX: 0, isOpen: false });
  }, [swipeState, handleDelete]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !editingTask) return;
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await taskService.update(editingTask.id, {
      title: formData.title.trim(),
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      projectId: formData.projectId || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    setEditingTask(null);
    triggerRefresh();
  };

  const handleCancel = () => {
    setEditingTask(null);
    setFormData({ title: '', notes: '', priority: 'none', dueDate: '', projectId: '', tags: '' });
  };

  const priorityLabels: Record<Priority, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük', none: 'Yok' };
  const priorityColors: Record<Priority, string> = { high: 'var(--color-priority-high)', medium: 'var(--color-priority-medium)', low: 'var(--color-priority-low)', none: 'var(--color-priority-none)' };

  if (relevantTasks.length === 0) {
    return (
      <div className="empty-state">
        <Calendar size={48} className="empty-state-icon" />
        <div className="empty-state-title">Bugün için görev yok</div>
        <div className="empty-state-subtitle">+ butonuna dokunarak yeni bir görev ekleyin</div>
      </div>
    );
  }

  return (
    <div>
      {/* İstatistik Dashboard Kartı */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-3)', 
        padding: 'var(--space-3) var(--space-4)',
        overflowX: 'auto',
        marginBottom: 'var(--space-3)',
      }}>
        <div style={{ 
          flex: 1, 
          minWidth: '140px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px', 
            height: '40px', 
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-1)',
          }}>
            <CheckCircle size={20} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {todayTotal}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Bugün
          </div>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: '140px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px', 
            height: '40px', 
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-success-light)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-1)',
          }}>
            <CheckCircle size={20} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
            {todayCompleted}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Tamamlandı
          </div>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: '140px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px', 
            height: '40px', 
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
            marginBottom: 'var(--space-1)',
          }}>
            <AlertCircle size={20} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-danger)' }}>
            {overdue}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Gecikmiş
          </div>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: '140px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px', 
            height: '40px', 
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-info-light)',
            color: 'var(--color-info)',
            marginBottom: 'var(--space-1)',
          }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-info)' }}>
            {completionRate}%
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Tamamlanma
          </div>
        </div>
      </div>

      {relevantTasks.map((task) => {
        const relativeDate = task.dueDate ? getRelativeDateLabel(task.dueDate) : null;
        const swipe = swipeState.taskId === task.id ? swipeState : { offsetX: 0, isOpen: false };

        return (
          <div
            key={task.id}
            className="card"
            style={{ 
              transform: swipe.isOpen ? 'translateX(-100px)' : `translateX(${swipe.offsetX}px)`,
              transition: 'transform 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onTouchStart={(e) => handleTouchStart(e, task.id)}
            onTouchMove={(e) => handleTouchMove(e, task.id)}
            onTouchEnd={(e) => handleTouchEnd(e, task.id)}
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
              alignItems: 'flex-start', 
              gap: 'var(--space-3)',
              position: 'relative',
              zIndex: 1,
            }}>
              <button
                className={`card-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => handleToggle(task.id)}
                aria-label="Tamamlandı olarak işaretle"
              />
              <div className="card-body" style={{ flex: 1, minWidth: 0 }}>
                <div className={`card-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
                <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span 
                    className="card-priority-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: `${priorityColors[task.priority]}20`,
                      color: priorityColors[task.priority],
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 500,
                      border: `1px solid ${priorityColors[task.priority]}40`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority] }} />
                    {priorityLabels[task.priority]}
                  </span>
                  {relativeDate && (
                    <span 
                      className={`card-due-badge ${relativeDate.className}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                      }}
                    >
                      {relativeDate.label}
                    </span>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {task.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>#{tag}</span>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>+{task.tags.length - 3}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleContextMenu(e, task.id)}
                className="top-bar-icon-btn"
                aria-label="Daha fazla seçenek"
                style={{ padding: 4, alignSelf: 'flex-start', flexShrink: 0 }}
              >
                <MoreVertical size={20} />
              </button>
            </div>

            {contextMenu?.taskId === task.id && (
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
                  minWidth: 160,
                  padding: 'var(--space-1)',
                }}
              >
                <button
                  onClick={() => handleEdit(task)}
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
                  onClick={() => handleDelete(task.id)}
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

      {editingTask && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">Görevi Düzenle</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <Edit2 size={20} />
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
                placeholder="örn: iş, acil, ev"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Öncelik</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['none', 'low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    className={`tab-chip ${formData.priority === p ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, priority: p })}
                  >
                    {p === 'none' ? 'Yok' : p === 'low' ? 'Düşük' : p === 'medium' ? 'Orta' : 'Yüksek'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bitiş Tarihi (opsiyonel)</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proje (opsiyonel)</label>
              <select
                className="form-input"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Proje seçiniz</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
    </div>
  );
}
