import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={16} />, label: 'Acik' },
    { value: 'dark', icon: <Moon size={16} />, label: 'Koyu' },
    { value: 'system', icon: <Monitor size={16} />, label: 'Sistem' },
  ];

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Tema secimi">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={mode === opt.value}
          className={`theme-switcher-btn ${mode === opt.value ? 'active' : ''}`}
          onClick={() => setMode(opt.value)}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
