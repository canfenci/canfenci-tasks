import { getStore, generateId, nowISO, handleDBError } from './database';
import type { Task } from '../../types/models';

export const taskService = {
  async getAll(): Promise<Task[]> {
    try {
      const store = await getStore('tasks');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Task[]);
        req.onerror = () => reject(handleDBError(req.error, 'Gorevler yuklenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Gorevler yuklenemedi');
    }
  },

  async getById(id: string): Promise<Task | undefined> {
    try {
      const store = await getStore('tasks');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as Task | undefined);
        req.onerror = () => reject(handleDBError(req.error, 'Gorev yuklenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Gorev yuklenemedi');
    }
  },

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed'>): Promise<Task> {
    try {
      const store = await getStore('tasks', 'readwrite');
      const task: Task = {
        ...data,
        id: generateId(),
        completed: false,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return new Promise((resolve, reject) => {
        const req = store.add(task);
        req.onsuccess = () => resolve(task);
        req.onerror = () => reject(handleDBError(req.error, 'Gorev olusturulamadi'));
      });
    } catch (e) {
      handleDBError(e, 'Gorev olusturulamadi');
    }
  },

  async update(id: string, changes: Partial<Task>): Promise<void> {
    try {
      const store = await getStore('tasks', 'readwrite');
      const existing = await new Promise<Task>((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as Task);
        req.onerror = () => reject(handleDBError(req.error, 'Gorev yuklenemedi'));
      });
      const updated: Task = { ...existing, ...changes, updatedAt: nowISO() };
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Gorev guncellenemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Gorev guncellenemedi');
    }
  },

  async toggleComplete(id: string): Promise<void> {
    try {
      const task = await this.getById(id);
      if (!task) return;
      await this.update(id, { completed: !task.completed });
    } catch (e) {
      handleDBError(e, 'Gorev durumu guncellenemedi');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const store = await getStore('tasks', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(handleDBError(req.error, 'Gorev silinemedi'));
      });
    } catch (e) {
      handleDBError(e, 'Gorev silinemedi');
    }
  },
};
