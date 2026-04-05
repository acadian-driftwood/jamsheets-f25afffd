

# Make JamSheets Installable (PWA-lite)

## What this does
Adds a web app manifest and meta tags so users can "Add to Home Screen" on iPhone and Android. The app will launch full-screen (no browser bar), with a splash screen and app icon — feeling like a native app. No service workers or offline caching needed.

## Steps

### 1. Create `public/manifest.json`
Standard web app manifest with:
- `name`: "JamSheets"
- `short_name`: "JamSheets"
- `display`: "standalone"
- `start_url`: "/"
- `background_color` and `theme_color` matching the app's design (white bg, orange accent)
- Icon references (see step 2)

### 2. Generate PWA icons
Create placeholder icons in `public/` at required sizes (192×192 and 512×512). These can be simple colored squares with "JS" text, or you can provide a logo image to use instead.

### 3. Update `index.html`
Add:
- `<link rel="manifest" href="/manifest.json">`
- `<link rel="apple-touch-icon" href="/icon-192.png">`
- `<meta name="theme-color" content="#f97316">` (orange accent)

The existing `apple-mobile-web-app-capable` and `viewport-fit=cover` meta tags are already present — those stay as-is.

### 4. No service worker needed
Since you only want installability (not offline support), no `vite-plugin-pwa` or service worker registration is required. The manifest alone enables the "Add to Home Screen" prompt.

## How to install on your phone
- **iPhone**: Open the app URL in Safari → tap Share → "Add to Home Screen"
- **Android**: Open in Chrome → tap the three-dot menu → "Add to Home Screen" (or the browser may show an install banner automatically)

## Files changed
| File | Change |
|------|--------|
| `public/manifest.json` | New — web app manifest |
| `public/icon-192.png` | New — 192px app icon |
| `public/icon-512.png` | New — 512px app icon |
| `index.html` | Add manifest link, apple-touch-icon, theme-color meta |

## Note on icons
I'll generate simple placeholder icons. If you have a JamSheets logo you'd like to use instead, upload it and I'll swap them in.

