import { useEffect, useState } from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { DataRefreshProvider } from './context/DataRefreshContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { ToastProvider } from './context/ToastContext';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { SearchOverlay } from './components/common/SearchOverlay';
import { UpdateToast } from './components/common/UpdateToast';
import { QuickAddModal } from './pages/QuickAddPage';
import { TodayPage } from './pages/TodayPage';
import { TasksPage } from './pages/TasksPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IdeasPage } from './pages/IdeasPage';
import { seedInitialData } from './services/seed/seedData';
import { initPWA } from './pwa/registerPWA';

function AppContent() {
  const { currentPage } = useNavigation();

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <TodayPage />;
      case 'tasks':
        return <TasksPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'ideas':
        return <IdeasPage />;
      default:
        return <TodayPage />;
    }
  };

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-content">{renderPage()}</main>
      <BottomNav />
      <SearchOverlay />
      <QuickAddModal />
    </div>
  );
}

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    seedInitialData();

    if (import.meta.env.PROD) {
      try {
        const updateSW = initPWA(() => setUpdateAvailable(true));
        setUpdateFn(() => () => updateSW(true));
      } catch (e) {
        // vite-plugin-pwa yuklu degilse (ilk kurulumda) sessizce gec
        console.warn('PWA kaydi atlandi:', e);
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <UIProvider>
        <NavigationProvider>
          <DataRefreshProvider>
            <ToastProvider>
              <AppContent />
              {updateAvailable && updateFn && (
                <UpdateToast onRefresh={updateFn} onDismiss={() => setUpdateAvailable(false)} />
              )}
            </ToastProvider>
          </DataRefreshProvider>
        </NavigationProvider>
      </UIProvider>
    </ThemeProvider>
  );
}
