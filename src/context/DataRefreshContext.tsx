import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DataRefreshContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextValue | undefined>(undefined);

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <DataRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) throw new Error('useDataRefresh, DataRefreshProvider icinde kullanilmali');
  return ctx;
}
