# Canfenci Tasks

Görev, proje ve fikir yönetimi için mobil öncelikli, offline çalışan bir PWA.

## Kurulum

```
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Build (Production)

```
npm run build
npm run preview
```

## Özellikler

- Görev / Proje / Fikir yönetimi
- IndexedDB tabanlı offline-first veri katmanı
- Yüklenebilir PWA (Ana ekrana ekle)
- Açık / Koyu / Sistem teması
- Mobil öncelikli, tablet ve masaüstü responsive tasarım
- Arama, filtreleme ve sıralama
- Alt görevler (checklist)
- Tekrarlayan görevler
- Bildirim/hatırlatıcı
- Sürükle-bırak sıralama
- JSON Export/Import
- İstatistik paneli

## Klasör Yapısı

```
src/
  components/   -> Layout, ortak ve ayar bileşenleri
  context/      -> Navigation, DataRefresh, Theme, UI context'leri
  pages/        -> Bugün, Görevler, Projeler, Fikirler sayfaları
  pwa/          -> Service worker kayıt katmanı
  services/db/  -> IndexedDB servisleri (task, project, idea)
  services/seed/-> İlk açılışta örnek veri
  styles/       -> CSS değişkenleri ve tema stilleri
  types/        -> Veri modelleri
  config/       -> Uygulama genel ayarları
public/
  icons/        -> PWA ikonları (gerçek png'lerle değiştirilmeli)
```

## Not

`public/icons/` altındaki ikonlar placeholder SVG'dir. Gerçek 192x192 / 512x512
PNG ikonlarla değiştirmeniz önerilir (örn. https://realfavicongenerator.net).
