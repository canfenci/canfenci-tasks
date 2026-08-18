# Canfenci Tasks

Gorev, proje ve fikir yonetimi icin mobil oncelikli, offline calisan bir PWA.

## Kurulum

```
npm install
npm run dev
```

Tarayicida `http://localhost:5173` adresini acin.

## Build (Production)

```
npm run build
npm run preview
```

## Ozellikler

- Gorev / Proje / Fikir yonetimi
- IndexedDB tabanli offline-first veri katmani
- Yuklenebilir PWA (Ana ekrana ekle)
- Acik / Koyu / Sistem temasi
- Mobil oncelikli, tablet ve masaustu responsive tasarim

## Klasor Yapisi

```
src/
  components/   -> Layout, ortak ve ayar bilesenleri
  context/      -> Navigation, DataRefresh, Theme, UI context'leri
  pages/        -> Bugun, Gorevler, Projeler, Fikirler sayfalari
  pwa/          -> Service worker kayit katmani
  services/db/  -> IndexedDB servisleri (task, project, idea)
  services/seed/-> Ilk acilista ornek veri
  styles/       -> CSS degiskenleri ve tema stilleri
  types/        -> Veri modelleri
  config/       -> Uygulama genel ayarlari
public/
  icons/        -> PWA ikonlari (gercek png'lerle degistirilmeli)
```

## Not

`public/icons/` altindaki ikonlar placeholder SVG'dir. Gercek 192x192 / 512x512
PNG ikonlarla degistirmeniz onerilir (orn. https://realfavicongenerator.net).
