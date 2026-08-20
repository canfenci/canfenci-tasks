import { getStore, generateId, nowISO, handleDBError } from './database';
import type { Project } from '../../types/models';

export const projectService = {
  async getAll(): Promise<Project[]> {
    try {
      const store = await getStore('projects');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Project[]);
        req.onerror = () => reject(handleDBError(req.error, 'Projeler yüklenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Projeler yüklenemedi');
    }
  },

  async getById(id: string): Promise<Project | undefined> {
    try {
      const store = await getStore('projects');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as Project | undefined);
        req.onerror = () => reject(handleDBError(req.error, 'Proje yüklenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Proje yüklenemedi');
    }
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<Project> {
    try {
      const store = await getStore('projects', 'readwrite');
      const project: Project = {
        ...data,
        id: generateId(),
        archived: false,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return new Promise((resolve, reject) => {
        const req = store.add(project);
        req.onsuccess = () => resolve(project);
        req.onerror = () => reject(handleDBError(req.error, 'Proje oluşturulamadı'));
      });
    } catch (e) {
      handleDBError(e, 'Proje oluşturulamadı');
    }
  },

  async update(id: string, changes: Partial<Project>): Promise<void> {
    try {
      const store = await getStore('projects', 'readwrite');
      const existing = await new Promise<Project>((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as Project);
        req.onerror = () => reject(handleDBError(req.error, 'Proje yüklenemedi'));
      });
      const updated: Project = { ...existing, ...changes, updatedAt: nowISO() };
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Proje güncellenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Proje güncellenemedi');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const store = await getStore('projects', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Proje silinemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Proje silinemedi');
    }
  },
};
