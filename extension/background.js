"use strict";

importScripts("translate.js");

console.log(`[Arabizzi] service worker ready — models=${MODELS.join(",")}`);

const MENU_ROOT = "arabizzi-root";
const MENU_PREFIX = "arabizzi:";

const MENU_I18N = {
  en: {
    root: "Translate with Arabizzi",
    fusha: "Fusha (MSA)",
    tunisian: "Colloquial Arabic",
    english: "English",
    french: "French",
  },
  ar: {
    root: "ترجم باستخدام Arabizzi",
    fusha: "الفصحى",
    tunisian: "العامية",
    english: "الإنجليزية",
    french: "الفرنسية",
  },
};

async function currentLanguage() {
  const stored = await chrome.storage.local.get(STORAGE.language);
  return stored[STORAGE.language] === "en" ? "en" : "ar";
}

// onInstalled and the top-level call can both fire in one worker start.
// Without this chain they interleave between removeAll() and create(),
// and the second batch dies with "duplicate id".
let menuQueue = Promise.resolve();

function buildMenus() {
  menuQueue = menuQueue
    .then(async () => {
      const labels = MENU_I18N[await currentLanguage()];
      await chrome.contextMenus.removeAll();
      chrome.contextMenus.create({
        id: MENU_ROOT,
        title: labels.root,
        contexts: ["selection"],
      });
      OUTPUT_MODES.forEach((mode) => {
        chrome.contextMenus.create({
          id: MENU_PREFIX + mode,
          parentId: MENU_ROOT,
          title: labels[mode],
          contexts: ["selection"],
        });
      });
    })
    .catch(() => {
      // Keep the queue alive if Chrome rejects a create (e.g. restricted page).
    });
  return menuQueue;
}

chrome.runtime.onInstalled.addListener(buildMenus);
// Runs on every worker start, so a missed onInstalled (crash, install race)
// still ends up with menus.
buildMenus();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE.language]) buildMenus();
});

// The content script is only present on pages loaded after install, so retry
// once with an explicit injection before giving up.
async function sendToFrame(tabId, frameId, message) {
  // Only the clicked frame — content.js runs in all_frames, and an untargeted
  // sendMessage would make every frame translate.
  try {
    await chrome.tabs.sendMessage(tabId, message, { frameId });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tabId, message, { frameId });
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !String(info.menuItemId).startsWith(MENU_PREFIX)) return;
  sendToFrame(tab.id, info.frameId ?? 0, {
    action: "translate-selection",
    text: info.selectionText || "",
    mode: String(info.menuItemId).slice(MENU_PREFIX.length),
  }).catch(() => {});
});

async function translateSelection({ text, mode }) {
  const input = (text || "").trim().slice(0, MAX_SELECTION_CHARS);
  if (!input) return { error: "Empty selection" };

  const stored = await chrome.storage.local.get([
    STORAGE.apiKey,
    STORAGE.outputMode,
    STORAGE.mode,
    STORAGE.history,
    STORAGE.language,
  ]);

  const apiKey = stored[STORAGE.apiKey];
  if (!apiKey) return { needsKey: true, language: stored[STORAGE.language] };

  const explicitMode = OUTPUT_MODES.includes(mode);
  const useMode = explicitMode ? mode : normalizeOutputMode(stored);

  const output = await callGemini(selectionPrompt(input, useMode), apiKey);

  const entry = {
    id: Math.random().toString(36).slice(2, 11),
    input,
    output,
    type: useMode,
    timestamp: Date.now(),
  };

  const toStore = {
    [STORAGE.history]: pruneHistory([entry, ...(stored[STORAGE.history] || [])]),
  };
  // Remember chip / context-menu choice so the next pill click reuses it.
  if (explicitMode) toStore[STORAGE.outputMode] = useMode;

  await chrome.storage.local.set(toStore);

  return { output, mode: useMode, dir: outputDir(useMode) };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.action !== "translate") return;
  translateSelection(msg)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err?.message || "Translation failed" }));
  return true;
});
