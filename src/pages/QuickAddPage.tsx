import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { taskService } from '../services/db/taskService';
import { projectService } from '../services/db/projectService';
import type { Priority, Project } from '../types/models';

export function QuickAddModal() {
  const { isQuickAddOpen, closeQuickAdd } = useUI();
  const { triggerRefresh } = useDataRefresh();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isQuickAddOpen) {
      projectService.getAll().then((p) => setProjects(p.filter((proj) => !proj.archived)));
    }
  }, [isQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const allTasks = await taskService.getAll();
    const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order || 0)) : 0;
    await taskService.create({
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined,
      order: maxOrder + 1,
    });
    setTitle('');
    setPriority('none');
    setDueDate('');
    setProjectId('');
    setTags('');
    triggerRefresh();
    closeQuickAdd();
  };

  return (
    <div className="modal-overlay" onClick={closeQuickAdd}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="top-bar-title">Yeni Görev</div>
          <button onClick={closeQuickAdd} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Başlık</label>
          <input
            className="form-input"
            autoFocus
            placeholder="Ne yapılması gerekiyor?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Etiketler (virgülle ayrılmış)</label>
          <input
            className="form-input"
            placeholder="örn: iş, acil, ev"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Öncelik</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['none', 'low', 'medium', 'high'] as Priority[]).map((p) => (
              <button
                key={p}
                className={`tab-chip ${priority === p ? 'active' : ''}`}
                onClick={() => setPriority(p)}
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
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {projects.length > 0 && (
          <div className="form-group">
            <label className="form-label">Proje (opsiyonel)</label>
            <select
              className="form-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Proje seçiniz</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={handleSubmit}>
          Görev Ekle
        </button>
      </div>
    </div>
  );
}
