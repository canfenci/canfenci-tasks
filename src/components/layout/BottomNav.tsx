import React from 'react';
import { Calendar, ListChecks, FolderKanban, Lightbulb, Plus } from 'lucide-react';
import { useNavigation, PageKey } from '../../context/NavigationContext';
import { useUI } from '../../context/UIContext';

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'today', label: 'Bugun', icon: <Calendar size={22} /> },
  { key: 'tasks', label: 'Gorevler', icon: <ListChecks size={22} /> },
  { key: 'projects', label: 'Projeler', icon: <FolderKanban size={22} /> },
  { key: 'ideas', label: 'Fikirler', icon: <Lightbulb size={22} /> },
];

export function BottomNav() {
  const { currentPage, setCurrentPage } = useNavigation();
  const { openQuickAdd } = useUI();

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <nav className="bottom-nav">
      {leftItems.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${currentPage === item.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      <button className="bottom-nav-fab" onClick={openQuickAdd} aria-label="Hizli ekle">
        <Plus size={26} />
      </button>

      {rightItems.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${currentPage === item.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
