import React, { useEffect, useState } from 'react';
import { Lightbulb, Trash2, Edit2, X } from 'lucide-react';
import { ideaService } from '../services/db/ideaService';
import { useDataRefresh } from '../context/DataRefreshContext';
import type { Idea } from '../types/models';

interface IdeaFormData {
  title: string;
  notes: string;
  tags: string;
}

export function IdeasPage() {
  const { refreshKey, triggerRefresh } = useDataRefresh();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [formData, setFormData] = useState<IdeaFormData>({ title: '', notes: '', tags: '' });

  useEffect(() => {
    ideaService.getAll().then(setIdeas);
  }, [refreshKey]);

  const handleEdit = (idea: Idea) => {
    setFormData({
      title: idea.title,
      notes: idea.notes || '',
      tags: idea.tags?.join(', ') || '',
    });
    setEditingIdea(idea);
  };

  const handleDelete = async (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    if (window.confirm(`"${idea.title}" fikrini silmek istediğinizden emin misiniz?`)) {
      await ideaService.remove(idea.id);
      triggerRefresh();
    }
  };

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
        <div className="empty-state-title">Henuz fikir yok</div>
        <div className="empty-state-subtitle">Aklinizdaki fikirleri buraya kaydedin</div>
      </div>
    );
  }

  return (
    <div>
      {ideas.map((idea) => (
        <div key={idea.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="card-title">{idea.title}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => handleEdit(idea)}
                className="top-bar-icon-btn"
                aria-label="Fikri duzenle"
                style={{ padding: 4 }}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => handleDelete(e, idea)}
                className="top-bar-icon-btn"
                aria-label="Fikri sil"
                style={{ padding: 4 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
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
        </div>
      ))}

      {editingIdea && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">Fikri Duzenle</div>
              <button onClick={handleCancel} aria-label="Kapat" className="top-bar-icon-btn">
                <X size={20} />
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
              <label className="form-label">Etiketler (virgulle ayrilmis)</label>
              <input
                className="form-input"
                placeholder="orn: pwa, ipucu, proje"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
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
