import { createContext, useContext, useState, ReactNode } from 'react';

export type PageKey = 'today' | 'tasks' | 'projects' | 'ideas';

interface NavigationContextValue {
  currentPage: PageKey;
  setCurrentPage: (page: PageKey) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageKey>('today');
  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation, NavigationProvider içinde kullanılmalı');
  return ctx;
}
