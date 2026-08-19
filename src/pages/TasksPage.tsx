import React, { useEffect, useState, useCallback } from 'react';
import { ListChecks, Edit2, Plus, Trash2 as Trash2Icon } from 'lucide-react';
import { taskService } from '../services/db/taskService';
import { projectService } from '../services/db/projectService';
import { useDataRefresh } from '../context/DataRefreshContext';
import { useToast } from '../context/ToastContext';
import type { Task, Project, Priority, Subtask, RecurrenceRule, RecurrenceFrequency } from '../types/models';
import { SortableTaskList } from '../components/common/SortableTaskList';

type FilterKey = 'all' | 'active' | 'completed';

interface TaskFormData {
  title: string;
  notes: string;
  priority: Priority;
  dueDate: string;
  projectId: string;
  tags: string;
  subtasks: Subtask[];
  newSubtaskTitle: string;
  recurrence: RecurrenceRule | null;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth: number;
  recurrenceEndDate: string;
}

interface SwipeState {
  taskId: string | null;
  offsetX: number;
  isOpen: boolean;
}

export function TasksPage() {
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const { showToast, hideToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [filter, setFilter] = useState<FilterKey>('active');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [contextMenu, setContextMenu] = useState<{ taskId: string; x: number; y: number } | null>(null);
    const [formData, setFormData] = useState<TaskFormData>({
      title: '',
      notes: '',
      priority: 'none',
      dueDate: '',
      projectId: '',
      tags: '',
      subtasks: [],
      newSubtaskTitle: '',
      recurrence: null,
      recurrenceFrequency: 'daily',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      recurrenceDayOfMonth: 1,
      recurrenceEndDate: '',
    });
    const [swipeState, setSwipeState] = useState<SwipeState>({ taskId: null, offsetX: 0, isOpen: false });

    // Tüm görevlerden benzersiz etiketleri topla
    const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort();

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
      subtasks: task.subtasks || [],
      newSubtaskTitle: '',
      recurrence: task.recurrence || null,
      recurrenceFrequency: task.recurrence?.frequency || 'daily',
      recurrenceInterval: task.recurrence?.interval || 1,
      recurrenceDaysOfWeek: task.recurrence?.daysOfWeek || [],
      recurrenceDayOfMonth: task.recurrence?.dayOfMonth || 1,
      recurrenceEndDate: task.recurrence?.endDate || '',
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
    
    let recurrence: RecurrenceRule | undefined;
    if (formData.recurrence || formData.dueDate) {
      if (formData.recurrenceFrequency === 'custom') {
        recurrence = {
          frequency: 'custom',
          interval: formData.recurrenceInterval,
          endDate: formData.recurrenceEndDate || undefined,
        };
      } else if (formData.recurrenceFrequency === 'weekly') {
        recurrence = {
          frequency: 'weekly',
          daysOfWeek: formData.recurrenceDaysOfWeek,
          endDate: formData.recurrenceEndDate || undefined,
        };
      } else if (formData.recurrenceFrequency === 'monthly') {
        recurrence = {
          frequency: 'monthly',
          dayOfMonth: formData.recurrenceDayOfMonth,
          endDate: formData.recurrenceEndDate || undefined,
        };
      } else {
        recurrence = {
          frequency: formData.recurrenceFrequency,
          endDate: formData.recurrenceEndDate || undefined,
        };
      }
    }
    
    await taskService.update(editingTask.id, {
      title: formData.title.trim(),
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      projectId: formData.projectId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: formData.subtasks,
      recurrence,
    });
    setEditingTask(null);
    triggerRefresh();
  };

  const handleCancel = () => {
    setEditingTask(null);
    setFormData({ 
      title: '', notes: '', priority: 'none', dueDate: '', projectId: '', tags: '', 
      subtasks: [], newSubtaskTitle: '',
      recurrence: null,
      recurrenceFrequency: 'daily',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      recurrenceDayOfMonth: 1,
      recurrenceEndDate: '',
    });
  };

    const filtered = tasks.filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    }).filter((t) => {
      if (!selectedTag) return true;
      return t.tags?.includes(selectedTag);
    });

    const priorityLabels: Record<Priority, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük', none: 'Yok' };
    const priorityColors: Record<Priority, string> = { high: 'var(--color-priority-high)', medium: 'var(--color-priority-medium)', low: 'var(--color-priority-low)', none: 'var(--color-priority-none)' };

    return (
      <div>
        <div className="tab-bar">
          {(['active', 'all', 'completed'] as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`tab-chip ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key === 'active' ? 'Aktif' : key === 'completed' ? 'Tamamlanan' : 'Tümü'}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="tab-bar" style={{ marginTop: 'var(--space-2)' }}>
            <button
              className={`tab-chip ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
              style={{ background: !selectedTag ? 'var(--color-primary)' : 'var(--color-bg-hover)', color: !selectedTag ? '#fff' : 'var(--color-text-secondary)' }}
            >
              Tümü
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tab-chip ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                style={{ background: selectedTag === tag ? 'var(--color-primary)' : 'var(--color-bg-hover)', color: selectedTag === tag ? '#fff' : 'var(--color-text-secondary)' }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
        <div className="empty-state">
          <ListChecks size={48} className="empty-state-icon" />
          <div className="empty-state-title">Görev bulunamadı</div>
        </div>
      ) : (
<SortableTaskList
          tasks={filtered}
          onReorder={(newTasks: Task[]) => {
            // Yeni sırayı kaydet
            newTasks.forEach((task, idx) => {
              if (task.order !== idx) {
                taskService.update(task.id, { order: idx });
              }
            });
            // Local state'i güncelle
            setTasks(prev => prev.map(t => {
              const updated = newTasks.find((nt: Task) => nt.id === t.id);
              return updated || t;
            }));
          }}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onContextMenu={handleContextMenu}
          swipeState={swipeState}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          priorityLabels={priorityLabels}
          priorityColors={priorityColors}
        />
      )}

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
              <label className="form-label">Alt Görevler</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {formData.subtasks.map((subtask, index) => (
                  <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        const updated = [...formData.subtasks];
                        updated[index] = { ...updated[index], completed: !updated[index].completed };
                        setFormData({ ...formData, subtasks: updated });
                      }}
                      style={{ width: 20, height: 20 }}
                    />
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => {
                        const updated = [...formData.subtasks];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setFormData({ ...formData, subtasks: updated });
                      }}
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Alt görev başlığı"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== index) })}
                      className="top-bar-icon-btn"
                      aria-label="Alt görevi sil"
                      style={{ padding: 4, color: 'var(--color-danger)' }}
                    >
                      <Trash2Icon size={16} />
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    value={formData.newSubtaskTitle}
                    onChange={(e) => setFormData({ ...formData, newSubtaskTitle: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formData.newSubtaskTitle.trim()) {
                        setFormData({
                          ...formData,
                          subtasks: [
                            ...formData.subtasks,
                            {
                              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                              title: formData.newSubtaskTitle.trim(),
                              completed: false,
                              createdAt: new Date().toISOString(),
                            },
                          ],
                          newSubtaskTitle: '',
                        });
                      }
                    }}
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Yeni alt görev ekle..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.newSubtaskTitle.trim()) {
                        setFormData({
                          ...formData,
                          subtasks: [
                            ...formData.subtasks,
                            {
                              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                              title: formData.newSubtaskTitle.trim(),
                              completed: false,
                              createdAt: new Date().toISOString(),
                            },
                          ],
                          newSubtaskTitle: '',
                        });
                      }
                    }}
                    className="btn btn-primary"
                    disabled={!formData.newSubtaskTitle.trim()}
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
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

            <div className="form-group">
              <label className="form-label">Tekrar (opsiyonel)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>Tekrar Sıklığı</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['daily', 'weekly', 'monthly', 'custom'] as RecurrenceFrequency[]).map((f) => (
                      <button
                        key={f}
                        className={`tab-chip ${formData.recurrenceFrequency === f ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, recurrenceFrequency: f })}
                      >
                        {f === 'daily' ? 'Günlük' : f === 'weekly' ? 'Haftalık' : f === 'monthly' ? 'Aylık' : 'Özel'}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.recurrenceFrequency === 'custom' && (
                  <div className="form-group">
                    <label className="form-label">Her Kaç Gün</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="form-input"
                      value={formData.recurrenceInterval}
                      onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                {formData.recurrenceFrequency === 'weekly' && (
                  <div className="form-group">
                    <label className="form-label">Günler</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { value: 0, label: 'Paz' }, { value: 1, label: 'Pzt' }, { value: 2, label: 'Sal' },
                        { value: 3, label: 'Çar' }, { value: 4, label: 'Per' }, { value: 5, label: 'Cum' }, { value: 6, label: 'Cmt' }
                      ].map((day) => (
                        <button
                          key={day.value}
                          className={`tab-chip ${formData.recurrenceDaysOfWeek.includes(day.value) ? 'active' : ''}`}
                          onClick={() => setFormData({ 
                            ...formData, 
                            recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek.includes(day.value)
                              ? formData.recurrenceDaysOfWeek.filter(d => d !== day.value)
                              : [...formData.recurrenceDaysOfWeek, day.value]
                          })}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.recurrenceFrequency === 'monthly' && (
                  <div className="form-group">
                    <label className="form-label">Ayın Hangi Günü</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="form-input"
                      value={formData.recurrenceDayOfMonth}
                      onChange={(e) => setFormData({ ...formData, recurrenceDayOfMonth: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Bitiş Tarihi (opsiyonel)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  />
                </div>
              </div>
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
