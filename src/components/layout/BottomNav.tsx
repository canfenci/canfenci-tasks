import React from 'react';
import { Calendar, ListChecks, FolderKanban, Lightbulb, Plus } from 'lucide-react';
import { useNavigation, PageKey } from '../../context/NavigationContext';
import { useUI } from '../../context/UIContext';

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'today', label: 'Bugün', icon: <Calendar size={24} /> },
  { key: 'tasks', label: 'Görevler', icon: <ListChecks size={24} /> },
  { key: 'projects', label: 'Projeler', icon: <FolderKanban size={24} /> },
  { key: 'ideas', label: 'Fikirler', icon: <Lightbulb size={24} /> },
];

export function BottomNav() {
  const { currentPage, setCurrentPage } = useNavigation();
  const { openQuickAdd } = useUI();

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <nav className="bottom-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {leftItems.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${currentPage === item.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.key)}
          style={{ minHeight: '44px', minWidth: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
        >
          {item.icon}
          <span style={{ fontSize: '10px' }}>{item.label}</span>
        </button>
      ))}

      <button className="bottom-nav-fab" onClick={openQuickAdd} aria-label="Hızlı ekle" style={{ width: '56px', height: '56px' }}>
        <Plus size={28} />
      </button>

      {rightItems.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${currentPage === item.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.key)}
          style={{ minHeight: '44px', minWidth: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
        >
          {item.icon}
          <span style={{ fontSize: '10px' }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
