# ⚔️ Coup d’État

Kooperatives Kartenspiel für 1–4 Spieler.

## Schritt 1: App.js mit dem vollständigen Quellcode befüllen

Kopiere den vollständigen React-Code aus dem Canvas in `src/App.js`.

## Schritt 2: Icons hinzufügen

Lege folgende Dateien in `public/` ab:
- `icon.png` (512x512) – das App-Icon
- `icon192.png` (192x192) – kleineres Icon (einfach skalieren)

## Schritt 3: Vercel Deployment

1. Repo auf **GitHub** pushen
2. [vercel.com](https://vercel.com) → **New Project** → GitHub-Repo importieren
3. Framework: **Create React App** (wird automatisch erkannt)
4. → **Deploy** klicken ✅

## Lokale Entwicklung

```bash
npm install
npm start
```

## iOS App installieren

Safari → Teilen → **Zum Home-Bildschirm** → Coup d’État

## Spielregeln

| Farbe | Kraft |
|-------|-------|
| ♥ Herz | Heilung – Karten vom Ablage zurück |
| ♦ Karo | Ziehen – Karten aufnehmen |
| ♣ Kreuz | Verdoppeln – Angriff ×2 |
| ♠ Pik | Schild – Gegnerangriff dauerhaft senken |
