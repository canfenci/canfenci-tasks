import { useEffect, useState, useCallback, useMemo } from 'react';
import { FolderKanban, Trash2, Edit2, Plus } from 'lucide-react';
import { projectService } from '../services/db/projectService';
import { taskService } from '../services/db/taskService';
import { useDataRefresh } from '../context/DataRefreshContext';
import type { Project, Task } from '../types/models';
import { SearchBar } from '../components/common/SearchBar';

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

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');

  const sortOptions = [
    { value: 'name-asc', label: 'A-Z' },
    { value: 'name-desc', label: 'Z-A' },
    { value: 'progress-desc', label: 'İlerleme (Yüksek → Düşük)' },
    { value: 'progress-asc', label: 'İlerleme (Düşük → Yüksek)' },
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.description?.toLowerCase().includes(q);
    }).sort((a, b) => {
      if (!sortBy) return 0;
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'progress-desc': {
          const aTasks = tasks.filter(t => t.projectId === a.id);
          const bTasks = tasks.filter(t => t.projectId === b.id);
          const aProgress = aTasks.length > 0 ? aTasks.filter(t => t.completed).length / aTasks.length : 0;
          const bProgress = bTasks.length > 0 ? bTasks.filter(t => t.completed).length / bTasks.length : 0;
          return bProgress - aProgress;
        }
        case 'progress-asc': {
          const aTasks = tasks.filter(t => t.projectId === a.id);
          const bTasks = tasks.filter(t => t.projectId === b.id);
          const aProgress = aTasks.length > 0 ? aTasks.filter(t => t.completed).length / aTasks.length : 0;
          const bProgress = bTasks.length > 0 ? bTasks.filter(t => t.completed).length / bTasks.length : 0;
          return aProgress - bProgress;
        }
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [projects, tasks, searchQuery, sortBy]);

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <FolderKanban size={48} className="empty-state-icon" />
        <div className="empty-state-title">Henüz proje yok</div>
        <div className="empty-state-subtitle">+ butonuna dokunarak yeni bir proje oluşturun</div>
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
        <div className="top-bar-title">Projeler</div>
        <button 
          onClick={handleCreate} 
          aria-label="Yeni proje"
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
          { value: 'name-asc', label: 'A-Z' },
          { value: 'name-desc', label: 'Z-A' },
          { value: 'progress-desc', label: 'İlerleme (Yüksek → Düşük)' },
          { value: 'progress-asc', label: 'İlerleme (Düşük → Yüksek)' },
          { value: 'date-desc', label: 'Oluşturulma (Yeni → Eski)' },
          { value: 'date-asc', label: 'Oluşturulma (Eski → Yeni)' },
        ]}
        currentSort={sortBy}
        placeholder="Proje ara..."
      />

      <div>
        {filteredProjects.map((project) => {
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
                    aria-label="Projeyi düzenle"
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

      {(editingProject || showCreateModal) && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">{editingProject ? 'Projeyi Düzenle' : 'Yeni Proje'}</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <Edit2 size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Proje Adı</label>
              <input
                className="form-input"
                autoFocus
                placeholder="Proje adı girin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Açıklama (opsiyonel)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Proje hakkında açıklama"
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
                İptal
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
                {editingProject ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
