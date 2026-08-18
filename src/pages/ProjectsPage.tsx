import { useEffect, useState } from 'react';
import { FolderKanban, Trash2, Edit2, Plus } from 'lucide-react';
import { projectService } from '../services/db/projectService';
import { taskService } from '../services/db/taskService';
import { useDataRefresh } from '../context/DataRefreshContext';
import type { Project, Task } from '../types/models';

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
}

const PROJECT_COLORS = [
  '#4f46e5', '#dc2626', '#16a34a', '#d97706', '#0891b2',
  '#9333ea', '#ec4899', '#f97316', '#84cc16', '#6366f1',
];

export function ProjectsPage() {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    color: '#4f46e5',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    Promise.all([projectService.getAll(), taskService.getAll()]).then(([p, t]) => {
      setProjects(p.filter((proj) => !proj.archived));
      setTasks(t);
    });
  }, [refreshKey]);

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#4f46e5',
    });
    setEditingProject(project);
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '', color: '#4f46e5' });
    setEditingProject(null);
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    if (editingProject) {
      await projectService.update(editingProject.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
    } else {
      await projectService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
    }
    setEditingProject(null);
    setShowCreateModal(false);
    triggerRefresh();
  };

  const handleCancel = () => {
    setEditingProject(null);
    setShowCreateModal(false);
    setFormData({ name: '', description: '', color: '#4f46e5' });
  };

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <FolderKanban size={48} className="empty-state-icon" />
        <div className="empty-state-title">Henuz proje yok</div>
        <div className="empty-state-subtitle">+ butonuna dokunarak yeni bir proje olusturun</div>
      </div>
    );
  }

  return (
    <>
      <div>
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const completedCount = projectTasks.filter((t) => t.completed).length;
          const progress = projectTasks.length > 0 ? (completedCount / projectTasks.length) * 100 : 0;

          const handleDeleteProject = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (window.confirm(`"${project.name}" projesini ve tüm görevlerini silmek istediğinizden emin misiniz?`)) {
              await projectService.remove(project.id);
              triggerRefresh();
            }
          };

          return (
            <div key={project.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">{project.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-primary">
                    {completedCount}/{projectTasks.length}
                  </span>
                  <button
                    onClick={() => handleEdit(project)}
                    className="top-bar-icon-btn"
                    aria-label="Projeyi duzenle"
                    style={{ padding: 4 }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="top-bar-icon-btn"
                    aria-label="Projeyi sil"
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {project.description && (
                <div className="card-meta">{project.description}</div>
              )}
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <button className="bottom-nav-fab" onClick={handleCreate} aria-label="Yeni proje" style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 20 }}>
        <Plus size={26} />
      </button>

      {(editingProject || showCreateModal) && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">{editingProject ? 'Projeyi Duzenle' : 'Yeni Proje'}</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <Edit2 size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Proje Adi</label>
              <input
                className="form-input"
                autoFocus
                placeholder="Proje adi girin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Aciklama (opsiyonel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Proje hakkinda aciklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Renk</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: color,
                      border: formData.color === color ? '3px solid #fff' : 'none',
                      boxShadow: formData.color === color ? '0 0 0 2px var(--color-primary)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label={`Renk: ${color}`}
                    aria-pressed={formData.color === color}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCancel}>
                Iptal
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
                {editingProject ? 'Kaydet' : 'Olustur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
