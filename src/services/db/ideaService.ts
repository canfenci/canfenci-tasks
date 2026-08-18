import { getStore, generateId, nowISO, handleDBError } from './database';
import type { Idea } from '../../types/models';

export const ideaService = {
  async getAll(): Promise<Idea[]> {
    try {
      const store = await getStore('ideas');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Idea[]);
        req.onerror = () => reject(handleDBError(req.error, 'Fikirler yuklenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Fikirler yuklenemedi');
    }
  },

  async create(data: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>): Promise<Idea> {
    try {
      const store = await getStore('ideas', 'readwrite');
      const idea: Idea = {
        ...data,
        id: generateId(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return new Promise((resolve, reject) => {
        const req = store.add(idea);
        req.onsuccess = () => resolve(idea);
        req.onerror = () => reject(handleDBError(req.error, 'Fikir olusturulamadi'));
      });
    } catch (e) {
      handleDBError(e, 'Fikir olusturulamadi');
    }
  },

  async update(id: string, changes: Partial<Idea>): Promise<void> {
    try {
      const store = await getStore('ideas', 'readwrite');
      const existing = await new Promise<Idea>((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as Idea);
        req.onerror = () => reject(handleDBError(req.error, 'Fikir yuklenemedi'));
      });
      const updated: Idea = { ...existing, ...changes, updatedAt: nowISO() };
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Fikir guncellenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Fikir guncellenemedi');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const store = await getStore('ideas', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Fikir silinemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Fikir silinemedi');
    }
  },
};
