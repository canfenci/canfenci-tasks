import { useState, useEffect } from 'react';
import { Search, Settings, X, Download, Upload } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { APP_CONFIG } from '../../config/appConfig';
import { requestNotificationPermission, getNotificationPermission, scheduleAllTaskNotifications } from '../../services/notificationService';
import { taskService } from '../../services/db/taskService';
import { useToast } from '../../context/ToastContext';
import { exportData, downloadBackup, importData, readFileAsText } from '../../services/exportImportService';

const PAGE_TITLES: Record<string, string> = {
  today: 'Bugün',
  tasks: 'Görevler',
  projects: 'Projeler',
  ideas: 'Fikirler',
};

export function TopBar() {
  const { currentPage } = useNavigation();
  const { openSearch } = useUI();
  const { mode, setMode } = useTheme();
  const { showToast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const perm = getNotificationPermission();
    setNotificationPermission(perm);
    setNotificationsEnabled(perm === 'granted');
  }, []);

  const handleSettingsClick = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const perm = await requestNotificationPermission();
      setNotificationPermission(perm);
      setNotificationsEnabled(perm === 'granted');
      if (perm === 'granted') {
        showToast('Bildirimler etkinleştirildi', 'success');
        // Mevcut görevler için bildirimleri planla
        const tasks = await taskService.getAll();
        scheduleAllTaskNotifications(tasks.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, completed: t.completed })));
      } else {
        showToast('Bildirim izni reddedildi', 'warning');
      }
    } else {
      // Bildirimleri kapatma - tarayıcı ayarlarından yapılmalı
      showToast('Bildirimleri kapatmak için tarayıcı ayarlarını kullanın', 'info');
    }
  };

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
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 20 }}>{notificationsEnabled ? '🔔' : '🔕'}</span>
                  Bildirimler
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {notificationPermission === 'granted' ? 'Etkin' : notificationPermission === 'denied' ? 'Engellendi' : 'İzin bekleniyor'}
                </span>
                <button
                  onClick={handleNotificationToggle}
                  className={`btn ${notificationsEnabled ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                >
                  {notificationsEnabled ? 'Açık' : 'Aç'}
                </button>
              </div>
              {notificationPermission === 'denied' && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                  Bildirimler engellendi. Tarayıcı adres çubuğundan izni değiştirebilirsiniz.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Uygulama Surumu</label>
              <div className="card-meta">{APP_CONFIG.version}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Veri Yedekleme</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <button
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                  onClick={async () => {
                    try {
                      const data = await exportData();
                      downloadBackup(data);
                      showToast('Veriler dışa aktarıldı', 'success');
                    } catch (error) {
                      showToast('Dışa aktarma hatası', 'error');
                    }
                  }}
                >
                  <Download size={16} /> Verileri Dışa Aktar (JSON)
                </button>
                <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <Upload size={16} /> Verileri İçe Aktar
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await readFileAsText(file);
                        const result = await importData(text, { merge: true, replace: false });
                        if (result.success) {
                          showToast(result.message, 'success');
                        } else {
                          showToast(result.message, 'error');
                        }
                      } catch (error) {
                        showToast('İçe aktarma hatası', 'error');
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
