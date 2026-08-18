import { useState } from 'react';
import { Search, Settings, X } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { APP_CONFIG } from '../../config/appConfig';

const PAGE_TITLES: Record<string, string> = {
  today: 'Bugun',
  tasks: 'Gorevler',
  projects: 'Projeler',
  ideas: 'Fikirler',
};

export function TopBar() {
  const { currentPage } = useNavigation();
  const { openSearch } = useUI();
  const { mode, setMode } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-title">{PAGE_TITLES[currentPage] ?? APP_CONFIG.shortName}</div>
        <div className="top-bar-actions">
          <button className="top-bar-icon-btn" onClick={openSearch} aria-label="Ara">
            <Search size={20} />
          </button>
          <button className="top-bar-icon-btn" onClick={handleSettingsClick} aria-label="Ayarlar">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="modal-overlay" onClick={handleCloseSettings}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="top-bar-title">Ayarlar</div>
              <button onClick={handleCloseSettings} aria-label="Kapat" className="top-bar-icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Tema</label>
              <div className="theme-switcher" role="radiogroup" aria-label="Tema secimi">
                {[
                  { value: 'light', icon: <span style={{fontSize:16}}>☀️</span>, label: 'Acik' },
                  { value: 'dark', icon: <span style={{fontSize:16}}>🌙</span>, label: 'Koyu' },
                  { value: 'system', icon: <span style={{fontSize:16}}>💻</span>, label: 'Sistem' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={mode === opt.value}
                    className={`theme-switcher-btn ${mode === opt.value ? 'active' : ''}`}
                    onClick={() => setMode(opt.value as 'light' | 'dark' | 'system')}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Uygulama Surumu</label>
              <div className="card-meta">{APP_CONFIG.version}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
