# Arabizzi — Chrome Extension

A Manifest V3 Chrome extension that converts Tunisian Arabic (Latin / Arabizi) into **Arabic script**, **Modern Standard Arabic (Fusha)**, **English**, or **French** using Google Gemini.

It runs entirely in the browser — no backend required. Each user supplies their own free Gemini API key, stored only in `chrome.storage.local`.

Part of the [Arabizzi](https://github.com/Abdelkaderbzz/arabizzi) project.

**Website:** [arabizzi.com](https://arabizzi.com/)

## Features

- Toolbar popup converter with Fusha, colloquial Arabic, English, and French modes
- **Translate on any page** — select text and a floating "Translate" pill appears next to it
- **Right-click → Translate with Arabizzi** → pick Fusha / colloquial / English / French
- Bring-your-own Gemini API key (free tier)
- Copy output, recent history (last 10), and saved bookmarks
- Bookmark conversions to keep them permanently
- Per-item copy, save, and delete in history
- English / Arabic interface with RTL support

## Files

```
extension/
├── manifest.json     # MV3 manifest
├── translate.js      # prompts + Gemini call, shared by popup and worker
├── background.js     # service worker: context menu + all API calls
├── content.js        # selection pill and result bubble (shadow DOM)
├── popup.html        # popup UI
├── popup.css         # styling (teal/cream theme)
├── popup.js          # popup logic
├── test-translate.js # self-check: node extension/test-translate.js
└── icons/            # main-logo.png, icon16.png, icon48.png, icon128.png
```

## Page translation

Selections are translated with an auto-detecting prompt (`selectionPrompt` in
`translate.js`), not the Arabizi-only popup prompts — text on a web page is
usually already in Arabic script, English, or French.

Only the service worker talks to Gemini; `content.js` is UI and holds no API
key. Results are appended to the same history the popup shows.

The floating pill needs the content script on every page, hence
`"matches": ["<all_urls>"]` — Chrome shows this as "Read your data on all
websites" at install. Drop the `content_scripts` block if you want the context
menu only.

## Get a free Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key (no credit card required)
3. In the extension popup, click the gear icon, paste the key, and save

## Preview in the browser

```bash
pnpm extension:preview
```

| Page | URL | What it shows |
|------|-----|----------------|
| **User preview** | http://localhost:5173/preview-user.html | v1.4.0 after setup — API key hidden, sample conversion, popup over a page |
| Developer preview | http://localhost:5173/preview.html | First-run flow (API key panel opens automatically) |
| Raw popup | http://localhost:5173/popup.html | Exact extension markup without mocks |

Use the scenario pills under the user preview to switch colloquial / fusha / English / French / empty input.

## Load locally (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. Pin the extension and click its icon to open the popup

## Test the page translation

`demo.html` is a page built to exercise every path — Arabizi, Arabic script,
English, French, a block that swallows mouse events, a textarea, and an iframe.
Serve it over http (content scripts don't run on `file://` unless you enable
"Allow access to file URLs"):

```bash
pnpm extension:preview   # then open http://localhost:5173/demo.html
```

After **any** edit to `content.js`, `background.js`, `manifest.json`, or
`translate.js`:

1. `chrome://extensions` → **Reload** on the Arabizzi card
2. Reload the demo page — a newly declared content script never reaches tabs
   that were already open

The demo page ends with a checklist covering both entry points. Run
`node extension/test-translate.js` for the prompt/history helpers.

### When nothing happens

| Symptom | Where to look |
|---|---|
| No pill on selection | Did you reload *both* the extension and the page? |
| No pill on keyboard select | Shift+arrows / Ctrl/Cmd+A should show the pill after keyup |
| No pill in a textarea | Needs `content.js` that reads `selectionStart`/`selectionEnd` |
| No pill, correct reloads | Page console — `content.js` errors surface there |
| Pill works, nothing after clicking | Extension card → **service worker** → Console |
| Bubble jumps back to the pill | Fixed by keeping loading/result for the same selection |
| Empty or wrong-language result | `selectionPrompt` in `translate.js` |

## Package for the Chrome Web Store

```bash
cd extension && zip -r ../arabizzi-extension.zip . \
  -x "icons/generate.js" "test-translate.js" "demo.html" "demo-frame.html" \
     "preview*.html" "dev-mock*.js" "preview-user-boot.js"
```

Upload `arabizzi-extension.zip` at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

### Listing checklist

- **Name:** Arabizzi
- **Category:** Productivity
- **Icons:** 16×16, 48×48, and 128×128 PNGs (included in `icons/`)
- **Screenshots:** 1280×800 or 640×400
- **Privacy policy:** [https://arabizzi.com/privacy.html](https://arabizzi.com/privacy.html) (`netlify-landing/privacy.html`)
- **Privacy practices:** declare local storage of API key and that text is sent to Google Gemini for conversion

## How it works

- Calls `https://generativelanguage.googleapis.com` directly (declared in `host_permissions`)
- Uses `gemini-3.1-flash-lite` (falls back to newer/older Flash models if needed)
- Usage counts against the user's own Gemini free tier
- No data is sent anywhere except Google's Gemini API

## Web app

For the full Next.js version with examples and server-side API key management, see the [main README](../README.md).
