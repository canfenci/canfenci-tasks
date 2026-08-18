import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextValue {
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        isQuickAddOpen,
        openQuickAdd: () => setQuickAddOpen(true),
        closeQuickAdd: () => setQuickAddOpen(false),
        isSearchOpen,
        openSearch: () => setSearchOpen(true),
        closeSearch: () => setSearchOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI, UIProvider icinde kullanilmali');
  return ctx;
}
