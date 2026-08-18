// vite-plugin-pwa otomatik service worker uretir;
 // bu dosya guncelleme bildirimini yonetmek icin ince bir katman saglar.
 // NOT: 'virtual:pwa-register' sadece build (prod) asamasinda gercek modul olarak cozulur.

 type UpdateSWFn = (reloadPage?: boolean) => Promise<void>;

 export function initPWA(onUpdateAvailable: () => void): UpdateSWFn {
   // Dev ortaminda bu modul bulunmayabilir, bu yuzden dinamik import + fallback kullaniyoruz.
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
             console.log('Canfenci Tasks cevrimdisi kullanima hazir.');
           }
         },
       });
     })
     .catch(() => {
       if (import.meta.env.DEV) {
         console.warn('PWA register modulu yuklenemedi (dev ortaminda normal olabilir).');
       }
     });

   return (reloadPage?: boolean) => updateFn(reloadPage);
 }
