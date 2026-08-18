import { useEffect, useState } from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { taskService } from '../services/db/taskService';
import { projectService } from '../services/db/projectService';
import { useDataRefresh } from '../context/DataRefreshContext';
import type { Task, Project, Priority } from '../types/models';
import { isToday, isOverdue, getDueDateLabel } from '../utils/dateUtils';

interface TaskFormData {
  title: string;
  notes: string;
  priority: Priority;
  dueDate: string;
  projectId: string;
}

export function TodayPage() {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    notes: '',
    priority: 'none',
    dueDate: '',
    projectId: '',
  });

  useEffect(() => {
    Promise.all([taskService.getAll(), projectService.getAll()]).then(([t, p]) => {
      setTasks(t);
      setProjects(p.filter((proj) => !proj.archived));
    });
  }, [refreshKey]);

  const relevantTasks = tasks.filter(
    (t) => !t.completed && (isToday(t.dueDate) || isOverdue(t.dueDate))
  );

  const handleToggle = async (id: string) => {
    await taskService.toggleComplete(id);
    triggerRefresh();
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      notes: task.notes || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      projectId: task.projectId || '',
    });
    setEditingTask(task);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !editingTask) return;
    await taskService.update(editingTask.id, {
      title: formData.title.trim(),
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      projectId: formData.projectId || undefined,
    });
    setEditingTask(null);
    triggerRefresh();
  };

  const handleCancel = () => {
    setEditingTask(null);
    setFormData({ title: '', notes: '', priority: 'none', dueDate: '', projectId: '' });
  };

  if (relevantTasks.length === 0) {
    return (
      <div className="empty-state">
        <Calendar size={48} className="empty-state-icon" />
        <div className="empty-state-title">Bugun icin gorev yok</div>
        <div className="empty-state-subtitle">+ butonuna dokunarak yeni bir gorev ekleyin</div>
      </div>
    );
  }

  return (
    <div>
      {relevantTasks.map((task) => (
        <div key={task.id} className="card">
          <button
            className={`card-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => handleToggle(task.id)}
            aria-label="Tamamlandi olarak isaretle"
          />
          <div className="card-body">
            <div className={`card-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
            <div className="card-meta">
              <span className={`card-priority-dot ${task.priority}`} />
              {task.dueDate && (() => {
                const { label, className } = getDueDateLabel(task.dueDate);
                return <span className={`card-due-badge ${className}`}>{label}</span>;
              })()}
            </div>
          </div>
          <button
            onClick={() => handleEdit(task)}
            className="top-bar-icon-btn"
            aria-label="Gorevi duzenle"
            style={{ padding: 4, alignSelf: 'flex-start' }}
          >
            <Edit2 size={16} />
          </button>
        </div>
      ))}

      {editingTask && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">Gorevi Duzenle</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <Edit2 size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Baslik</label>
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
              <label className="form-label">Oncelik</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['none', 'low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    className={`tab-chip ${formData.priority === p ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, priority: p })}
                  >
                    {p === 'none' ? 'Yok' : p === 'low' ? 'Dusuk' : p === 'medium' ? 'Orta' : 'Yuksek'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bitis Tarihi (opsiyonel)</label>
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
                <option value="">Proje seciniz</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCancel}>
                Iptal
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
