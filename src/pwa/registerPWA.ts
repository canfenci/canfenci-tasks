// vite-plugin-pwa otomatik service worker üretir;
// bu dosya güncelleme bildirimini yönetmek için ince bir katman sağlar.
// NOT: 'virtual:pwa-register' sadece build (prod) aşamasında gerçek modül olarak çözülür.

type UpdateSWFn = (reloadPage?: boolean) => Promise<void>;

export function initPWA(onUpdateAvailable: () => void): UpdateSWFn {
  // Dev ortamında bu modül bulunmayabilir, bu yüzden dinamik import + fallback kullanıyoruz.
  let updateFn: UpdateSWFn = async () => {};

  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      updateFn = registerSW({
        immediate: true,
        onNeedRefresh() {
          onUpdateAvailable();
        },
        onOfflineReady() {
          if (import.meta.env.DEV) {
            console.log('Canfenci Tasks çevrimdışı kullanıma hazır.');
          }
        },
      });
    })
    .catch(() => {
      if (import.meta.env.DEV) {
        console.warn('PWA register modülü yüklenemedi (dev ortamında normal olabilir).');
      }
    });

  return (reloadPage?: boolean) => updateFn(reloadPage);
}
