# Zakupator

Aplikacja na iOS i Android (Expo / React Native). Dwie zakładki:

- **Sprzedaj**: skanujesz przedmiot aparatem, AI (Gemini) go rozpoznaje i wycenia na podstawie aktualnych ofert.
- **Kup**: wyszukiwarka produktów w całym internecie, wyniki posortowane od najtańszego.

## 1. Serwer (klucze API zostają poza aplikacją)

```bash
cd server
npm install
cp .env.example .env     # wpisz GEMINI_API_KEY i SERPAPI_KEY
node --env-file=.env index.js
```

## 2. Aplikacja

1. W `src/config.js` wpisz adres serwera (IP komputera w Wi-Fi, np. `http://192.168.1.20:3000`).
2. ```bash
   npm install
   npx expo install --fix
   npx expo start
   ```
3. Zeskanuj kod QR aplikacją **Expo Go** (iOS/Android).

## 3. Wersje sklepowe

```bash
npm i -g eas-cli
eas build -p android   # plik .aab do Google Play
eas build -p ios       # wymaga konta Apple Developer
```
Przed publikacją wystaw serwer w internecie (np. Render, Railway, Fly.io) i wpisz jego adres w `src/config.js`.

## Uwagi
- Oferty pochodzą z Google Shopping przez SerpAPI (Polska, PLN). Allegro i OLX nie mają otwartego API do wyszukiwania, więc wyniki z nich pojawią się tylko, jeśli trafią do Google Shopping.
- Wycena to szacunek: ceny rynkowe oferowanych nowych/używanych produktów skorygowane o stan ze zdjęcia.
