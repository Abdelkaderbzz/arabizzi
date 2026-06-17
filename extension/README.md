# Arabic Converter — Chrome Extension

A Manifest V3 Chrome extension that converts Tunisian Arabic (Latin / Arabizi)
into **Arabic script** or **Modern Standard Arabic (Fusha)** using Google Gemini.

It is fully self-contained (no backend). Each user supplies their own free
Gemini API key, which is stored only in their browser via `chrome.storage.local`.

## Features

- Toolbar popup converter with Fusha / Tunisian modes
- Bring-your-own Gemini API key (free tier)
- Copy output, recent history (last 10), per-item copy/delete
- English / Arabic interface with RTL support

## Files

```
extension/
  manifest.json     # MV3 manifest
  popup.html        # popup UI
  popup.css         # styling (teal/cream theme)
  popup.js          # logic + Gemini call
  icons/            # icon16/48/128.png (+ generate.js to regenerate)
```

## Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Create an API key (no credit card needed).
3. In the extension, click the gear (⚙) icon, paste the key, and Save.

## Load it locally (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin the extension and click its icon to open the popup

## Publish to the Chrome Web Store

1. Replace the placeholder icons in `icons/` with a real logo
   (16×16, 48×48, 128×128 PNG). You can regenerate placeholders with
   `node icons/generate.js`.
2. Zip the **contents** of the `extension/` folder (not the parent folder):
   ```bash
   cd extension && zip -r ../arabic-converter-extension.zip . -x "icons/generate.js"
   ```
3. Create a developer account at
   https://chrome.google.com/webstore/devconsole (one-time $5 fee).
4. Click **New item**, upload the zip.
5. Fill in the listing:
   - Description, category (Productivity), language
   - Screenshots (1280×800 or 640×400)
   - At least one 128×128 icon
   - Privacy: declare that the API key is stored locally and that text is sent
     to Google's Gemini API for conversion. Provide a privacy policy URL.
6. Submit for review.

## Notes

- The extension calls `https://generativelanguage.googleapis.com` directly,
  which is declared in `host_permissions`.
- Usage counts against the user's own Gemini free tier (~1,500 requests/day).
- No data is sent anywhere except Google's Gemini API.
