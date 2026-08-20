import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'canfenci-theme-mode';

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ThemeMode) || 'system';
  });

  const [, setResolvedTheme] = useState<'light' | 'dark'>(
    mode === 'system' ? getSystemPref() : (mode as 'light' | 'dark')
  );

  useEffect(() => {
    const applied = mode === 'system' ? getSystemPref() : mode;
    setResolvedTheme(applied);
    document.documentElement.setAttribute('data-theme', applied);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const applied = getSystemPref();
      setResolvedTheme(applied);
      document.documentElement.setAttribute('data-theme', applied);
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const resolvedTheme = mode === 'system' ? getSystemPref() : mode;

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  return ctx;
}
