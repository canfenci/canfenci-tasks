import { APP_CONFIG } from '../../config/appConfig';

const STORES = ['tasks', 'projects', 'ideas'] as const;
export type StoreName = typeof STORES[number];

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(APP_CONFIG.dbName, APP_CONFIG.dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(new Error(`IndexedDB acilamadi: ${request.error?.message || 'Bilinmeyen hata'}`));
  });
}

export async function getStore(
  storeName: StoreName,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function handleDBError(error: unknown, operation: string): never {
  const message = error instanceof Error ? error.message : 'Bilinmeyen veritabani hatasi';
  throw new Error(`${operation} basarisiz: ${message}`);
}
