"use strict";

const MODEL = "gemini-2.5-flash";
const OUTPUT_MODES = ["fusha", "tunisian", "english", "french"];

const STORAGE = {
  apiKey: "gemini_api_key",
  language: "language",
  mode: "to_fusha",
  outputMode: "output_mode",
  history: "conversion_history",
};

const I18N = {
  en: {
    dir: "ltr",
    title: "Arabizzi",
    description: "Convert colloquial Arabic text between Latin and Arabic scripts",
    inputLabel: "Colloquial Arabic (Latin script)",
    inputPlaceholder:
      "Type colloquial Arabic using Latin characters (e.g., '3aslema, chneya 7alek?')",
    modeLabel: "Output type",
    fusha: "Fusha",
    fushaDesc: "Modern Standard Arabic",
    tunisian: "Colloquial",
    tunisianDesc: "Arabic script",
    english: "English",
    englishDesc: "English translation",
    french: "French",
    frenchDesc: "French translation",
    convert: "Convert",
    converting: "Converting...",
    copy: "Copy",
    copied: "Copied!",
    outputFusha: "Modern Standard Arabic",
    outputTunisian: "Colloquial Arabic (Arabic script)",
    outputEnglish: "English",
    outputFrench: "French",
    outputEmpty: "Your converted text will appear here",
    historyTitle: "Recent Conversions",
    tabRecent: "Recent",
    tabSaved: "Saved",
    savedEmpty: "No saved conversions yet",
    historyEmpty: "No conversion history yet",
    bookmark: "Save",
    unbookmark: "Remove from saved",
    clearAll: "Clear recent",
    restore: "Use again",
    delete: "Delete",
    deleteEntry: "Delete entry",
    footerSupport: "Support Project",
    keyLabel: "Gemini API key",
    keyHint: "Stored only in your browser. Get a free key from Google AI Studio.",
    keyLink: "Get an API key →",
    save: "Save",
    saved: "Key saved",
    keyMissing: "Add your free Gemini API key in settings (⚙) to start converting.",
    errGeneric: "An error occurred during conversion. Please try again.",
    langButton: "العربية",
  },
  ar: {
    dir: "rtl",
    title: "Arabizzi",
    description: "حوّل النص بالعامية بين الحروف اللاتينية والعربية",
    inputLabel: "العربية العامية (حروف لاتينية)",
    inputPlaceholder:
      "اكتب بالعربية العامية باستخدام الحروف اللاتينية (مثال: '3aslema, chneya 7alek?')",
    modeLabel: "نوع الإخراج",
    fusha: "فصحى",
    fushaDesc: "العربية الفصحى",
    tunisian: "عامية",
    tunisianDesc: "حروف عربية",
    english: "إنجليزي",
    englishDesc: "ترجمة إنجليزية",
    french: "فرنسي",
    frenchDesc: "ترجمة فرنسية",
    convert: "تحويل",
    converting: "جاري التحويل...",
    copy: "نسخ",
    copied: "تم النسخ!",
    outputFusha: "العربية الفصحى",
    outputTunisian: "العربية العامية (حروف عربية)",
    outputEnglish: "الإنجليزية",
    outputFrench: "الفرنسية",
    outputEmpty: "سيظهر النص المحوّل هنا",
    historyTitle: "التحويلات الأخيرة",
    tabRecent: "الأخيرة",
    tabSaved: "المحفوظة",
    savedEmpty: "لا توجد تحويلات محفوظة بعد",
    historyEmpty: "لا يوجد سجل تحويل بعد",
    bookmark: "حفظ",
    unbookmark: "إزالة من المحفوظات",
    clearAll: "مسح السجل",
    restore: "استخدام مجدداً",
    delete: "حذف",
    deleteEntry: "حذف التحويل",
    footerSupport: "ادعم المشروع",
    keyLabel: "مفتاح Gemini API",
    keyHint: "يُحفظ في متصفحك فقط. احصل على مفتاح مجاني من Google AI Studio.",
    keyLink: "احصل على مفتاح →",
    save: "حفظ",
    saved: "تم حفظ المفتاح",
    keyMissing: "أضف مفتاح Gemini المجاني من الإعدادات (⚙) لبدء التحويل.",
    errGeneric: "حدث خطأ أثناء التحويل. يرجى المحاولة مرة أخرى.",
    langButton: "English",
  },
};

const ICON = {
  bookmark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bookmarkFilled: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  restore: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 3v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const fushaPrompt = (text) => `Translate the following Tunisian Arabic text (written in Latin characters with numbers) into formal Modern Standard Arabic (MSA).

### **Rules:**
1. **Provide only the translated text** in Arabic script, without any explanations, notes, or additional text.
2. **Accurately interpret phonetic representations**, following these mappings:
   - '3' → 'ع'
   - '7' → 'ح'
   - '8' → 'غ'
   - '9' → 'ق'
   - '5' → 'خ'
   - '2' → 'ء'
3. **Ensure proper grammatical structure** in MSA while preserving the meaning of the original text.
4. **Exclude dialectal expressions** that are specific to Tunisian Arabic and use their equivalent in MSA.

### **Input Text:**
"${text}"

### **Output:**
(Provide only the translated text in Arabic script)`;

const latinaPrompt = (text) => `Convert the following Tunisian Arabic text (written in Latin characters with numbers) into **Tunisian Arabic written in Arabic script**.

### **Rules:**
1. **Provide only the converted text** in Arabic script, without any explanations, notes, or additional text.
2. **Preserve Tunisian Arabic expressions and informal tone**, ensuring the meaning remains the same.
3. **Use accurate phonetic transliteration**, following these mappings:
   - '3' → 'ع'
   - '7' → 'ح'
   - '8' → 'غ'
   - '9' → 'ق'
   - '5' → 'خ'
   - '2' → 'ء'
4. **Do not replace Tunisian dialect words** with MSA equivalents—keep them as they are, just written in Arabic script.

### **Input Text:**
"${text}"

### **Output:**
(Provide only the converted text in Arabic script)`;

const englishPrompt = (text) => `Translate the following Tunisian Arabic text (written in Latin characters with numbers, known as Arabizi) into natural English.

### **Rules:**
1. **Provide only the translated text** in English, without any explanations, notes, or additional text.
2. **Accurately interpret phonetic representations**, following these mappings:
   - '3' → 'ع'
   - '7' → 'ح'
   - '8' → 'غ'
   - '9' → 'ق'
   - '5' → 'خ'
   - '2' → 'ء'
3. **Preserve the meaning and tone** of the original Tunisian Arabic message.
4. **Use natural, fluent English** — not word-for-word literal translation when idioms are involved.

### **Input Text:**
"${text}"

### **Output:**
(Provide only the translated text in English)`;

const frenchPrompt = (text) => `Translate the following Tunisian Arabic text (written in Latin characters with numbers, known as Arabizi) into natural French.

### **Rules:**
1. **Provide only the translated text** in French, without any explanations, notes, or additional text.
2. **Accurately interpret phonetic representations**, following these mappings:
   - '3' → 'ع'
   - '7' → 'ح'
   - '8' → 'غ'
   - '9' → 'ق'
   - '5' → 'خ'
   - '2' → 'ء'
3. **Preserve the meaning and tone** of the original Tunisian Arabic message.
4. **Use natural, fluent French** — not word-for-word literal translation when idioms are involved.

### **Input Text:**
"${text}"

### **Output:**
(Provide only the translated text in French)`;

// State
let state = {
  language: "en",
  outputMode: "fusha",
  apiKey: "",
  history: [],
  historyTab: "recent",
};

const MAX_RECENT = 10;

function pruneHistory(entries) {
  const bookmarked = entries.filter((entry) => entry.bookmarked);
  const recent = entries
    .filter((entry) => !entry.bookmarked)
    .slice(0, MAX_RECENT);
  return [...bookmarked, ...recent].sort((a, b) => b.timestamp - a.timestamp);
}

// Elements
const $ = (id) => document.getElementById(id);

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("").trim();
}

function t() {
  return I18N[state.language];
}

function normalizeOutputMode(stored) {
  if (
    stored[STORAGE.outputMode] &&
    OUTPUT_MODES.includes(stored[STORAGE.outputMode])
  ) {
    return stored[STORAGE.outputMode];
  }
  if (stored[STORAGE.mode] === false) return "tunisian";
  return "fusha";
}

function outputDir(mode) {
  return mode === "english" || mode === "french" ? "ltr" : "rtl";
}

function modeLabel(mode) {
  const tr = t();
  if (mode === "fusha") return tr.fusha;
  if (mode === "tunisian") return tr.tunisian;
  if (mode === "english") return tr.english;
  if (mode === "french") return tr.french;
  return tr.fusha;
}

function outputTypeLabel(mode) {
  const tr = t();
  if (mode === "fusha") return tr.outputFusha;
  if (mode === "tunisian") return tr.outputTunisian;
  if (mode === "english") return tr.outputEnglish;
  if (mode === "french") return tr.outputFrench;
  return tr.outputFusha;
}

function promptForMode(mode, text) {
  if (mode === "tunisian") return latinaPrompt(text);
  if (mode === "english") return englishPrompt(text);
  if (mode === "french") return frenchPrompt(text);
  return fushaPrompt(text);
}

function setCopyButtonLabel(label, copied = false) {
  const btn = $("copy-btn");
  btn.classList.toggle("copied", copied);
  btn.innerHTML = copied
    ? `${ICON.check}<span>${label}</span>`
    : `${ICON.copy}<span>${label}</span>`;
  btn.title = label;
}

function applyLanguage() {
  const tr = t();
  document.documentElement.dir = tr.dir;
  document.documentElement.lang = state.language;

  $("description").textContent = tr.description;
  $("input-label").textContent = tr.inputLabel;
  $("latin-input").placeholder = tr.inputPlaceholder;
  $("mode-label").textContent = tr.modeLabel;
  $("convert-label").textContent = tr.convert;
  $("tab-recent-label").textContent = tr.tabRecent;
  $("tab-saved-label").textContent = tr.tabSaved;
  $("clear-btn").title = tr.clearAll;
  setCopyButtonLabel(tr.copy);
  $("key-label").textContent = tr.keyLabel;
  $("key-hint").textContent = tr.keyHint;
  $("key-link").textContent = tr.keyLink;
  $("save-key").textContent = tr.save;
  $("lang-btn").textContent = tr.langButton;
  $("footer-support").textContent = tr.footerSupport;
  $("history-empty-all").textContent = tr.historyEmpty;

  document.querySelector('[data-key="fusha"]').textContent = tr.fusha;
  document.querySelector('[data-key="fushaDesc"]').textContent = tr.fushaDesc;
  document.querySelector('[data-key="tunisian"]').textContent = tr.tunisian;
  document.querySelector('[data-key="tunisianDesc"]').textContent =
    tr.tunisianDesc;
  document.querySelector('[data-key="english"]').textContent = tr.english;
  document.querySelector('[data-key="englishDesc"]').textContent = tr.englishDesc;
  document.querySelector('[data-key="french"]').textContent = tr.french;
  document.querySelector('[data-key="frenchDesc"]').textContent = tr.frenchDesc;

  updateOutputLabel();
  renderHistory();
  validateInput();
}

function updateOutputLabel() {
  $("output-label").textContent = outputTypeLabel(state.outputMode);
}

function applyMode() {
  OUTPUT_MODES.forEach((mode) => {
    const el = $(`mode-${mode}`);
    if (el) el.classList.toggle("active", state.outputMode === mode);
  });
  $("output").dir = outputDir(state.outputMode);
  updateOutputLabel();
}

function setError(message) {
  const el = $("error");
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = message;
}

function setOutput(text) {
  const el = $("output");
  if (text) {
    el.textContent = text;
    el.classList.remove("empty");
    $("copy-btn").hidden = false;
    el.scrollTop = 0;
  } else {
    el.textContent = t().outputEmpty;
    el.classList.add("empty");
    $("copy-btn").hidden = true;
  }
}

function validateInput() {
  const hasText = $("latin-input").value.trim().length > 0;
  $("convert-btn").disabled = !hasText;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString(
    state.language === "ar" ? "ar-TN" : "en-US",
    {
      hour: "numeric",
      minute: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function restoreConversion(entry) {
  $("latin-input").value = entry.input;
  state.outputMode = OUTPUT_MODES.includes(entry.type) ? entry.type : "fusha";
  applyMode();
  setOutput("");
  setError("");
  validateInput();
  storageSet({ [STORAGE.outputMode]: state.outputMode });
}

function createIconButton(className, iconHtml, title) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.title = title;
  btn.innerHTML = iconHtml;
  return btn;
}

function renderHistory() {
  const panel = $("history-panel");
  const head = $("history-head");
  const emptyState = $("history-empty-state");
  const list = $("history-list");
  const empty = $("history-empty");
  const clearBtn = $("clear-btn");

  const saved = state.history.filter((entry) => entry.bookmarked);
  const recent = state.history.filter((entry) => !entry.bookmarked);
  const entries = state.historyTab === "saved" ? saved : recent;
  const hasHistory = state.history.length > 0;

  $("tab-recent-count").textContent = String(recent.length);
  $("tab-saved-count").textContent = String(saved.length);
  $("tab-recent").classList.toggle("active", state.historyTab === "recent");
  $("tab-saved").classList.toggle("active", state.historyTab === "saved");
  $("tab-recent").setAttribute(
    "aria-selected",
    state.historyTab === "recent" ? "true" : "false"
  );
  $("tab-saved").setAttribute(
    "aria-selected",
    state.historyTab === "saved" ? "true" : "false"
  );

  panel.classList.toggle("has-history", hasHistory);
  panel.classList.toggle("show-global-empty", !hasHistory);
  panel.classList.toggle("show-tab-empty", hasHistory && !entries.length);

  head.toggleAttribute("hidden", !hasHistory);
  emptyState.toggleAttribute("hidden", hasHistory);
  emptyState.setAttribute("aria-hidden", hasHistory ? "true" : "false");
  clearBtn.hidden = !hasHistory || state.historyTab !== "recent" || !recent.length;
  list.innerHTML = "";

  if (!hasHistory) {
    empty.toggleAttribute("hidden", true);
    return;
  }

  if (!entries.length) {
    empty.toggleAttribute("hidden", false);
    empty.textContent =
      state.historyTab === "saved" ? t().savedEmpty : t().historyEmpty;
    return;
  }

  empty.toggleAttribute("hidden", true);

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const top = document.createElement("div");
    top.className = "hi-top";

    const type = document.createElement("span");
    type.className = `hi-type ${entry.type}`;
    type.textContent = modeLabel(entry.type);

    const actions = document.createElement("div");
    actions.className = "hi-actions";

    const bookmarkBtn = createIconButton(
      `hi-action${entry.bookmarked ? " active" : ""}`,
      entry.bookmarked ? ICON.bookmarkFilled : ICON.bookmark,
      entry.bookmarked ? t().unbookmark : t().bookmark
    );
    bookmarkBtn.addEventListener("click", async () => {
      state.history = state.history.map((e) =>
        e.id === entry.id ? { ...e, bookmarked: !e.bookmarked } : e
      );
      await storageSet({ [STORAGE.history]: state.history });
      renderHistory();
    });

    const copyBtn = createIconButton("hi-action", ICON.copy, t().copy);
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(entry.output);
      copyBtn.innerHTML = ICON.check;
      copyBtn.classList.add("copied");
      copyBtn.title = t().copied;
      setTimeout(() => {
        copyBtn.innerHTML = ICON.copy;
        copyBtn.classList.remove("copied");
        copyBtn.title = t().copy;
      }, 1500);
    });

    const delBtn = createIconButton("hi-action danger", ICON.x, t().deleteEntry);
    delBtn.addEventListener("click", async () => {
      state.history = state.history.filter((e) => e.id !== entry.id);
      await storageSet({ [STORAGE.history]: state.history });
      renderHistory();
    });

    actions.appendChild(bookmarkBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(delBtn);
    top.appendChild(type);
    top.appendChild(actions);

    const input = document.createElement("div");
    input.className = "hi-input";
    input.dir = "ltr";
    input.textContent = entry.input;

    const output = document.createElement("div");
    output.className = "hi-output";
    output.dir = outputDir(entry.type);
    output.textContent = entry.output;

    const footer = document.createElement("div");
    footer.className = "hi-footer";

    const time = document.createElement("span");
    time.className = "hi-time";
    time.textContent = formatTimestamp(entry.timestamp);

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "hi-restore";
    restoreBtn.title = t().restore;
    restoreBtn.innerHTML = `${ICON.restore}<span>${t().restore}</span>`;
    restoreBtn.addEventListener("click", () => restoreConversion(entry));

    footer.appendChild(time);
    footer.appendChild(restoreBtn);

    item.appendChild(top);
    item.appendChild(input);
    item.appendChild(output);
    item.appendChild(footer);
    list.appendChild(item);
  });
}

async function handleConvert() {
  const input = $("latin-input").value.trim();
  if (!input) return;

  setError("");

  if (!state.apiKey) {
    setError(t().keyMissing);
    $("settings-panel").hidden = false;
    return;
  }

  const btn = $("convert-btn");
  btn.disabled = true;
  $("convert-label").textContent = t().converting;

  try {
    const prompt = promptForMode(state.outputMode, input);
    const result = await callGemini(prompt, state.apiKey);
    setOutput(result);

    const entry = {
      id: Math.random().toString(36).slice(2, 11),
      input,
      output: result,
      type: state.outputMode,
      timestamp: Date.now(),
    };
    state.history = pruneHistory([entry, ...state.history]);
    await storageSet({ [STORAGE.history]: state.history });
    renderHistory();
  } catch (err) {
    console.error(err);
    setError(err && err.message ? err.message : t().errGeneric);
  } finally {
    $("convert-label").textContent = t().convert;
    validateInput();
  }
}

async function saveKey() {
  const value = $("api-key").value.trim();
  state.apiKey = value;
  await storageSet({ [STORAGE.apiKey]: value });
  const status = $("key-status");
  status.textContent = value ? t().saved : "";
  status.className = "key-status ok";
  setTimeout(() => (status.textContent = ""), 2000);
  setError("");
}

function bindEvents() {
  $("latin-input").addEventListener("input", validateInput);
  $("latin-input").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleConvert();
  });

  OUTPUT_MODES.forEach((mode) => {
    $(`mode-${mode}`).addEventListener("click", async () => {
      state.outputMode = mode;
      applyMode();
      await storageSet({ [STORAGE.outputMode]: mode });
    });
  });

  $("convert-btn").addEventListener("click", handleConvert);

  $("copy-btn").addEventListener("click", () => {
    const text = $("output").textContent;
    navigator.clipboard.writeText(text);
    setCopyButtonLabel(t().copied, true);
    setTimeout(() => setCopyButtonLabel(t().copy), 1500);
  });

  $("clear-btn").addEventListener("click", async () => {
    state.history = state.history.filter((entry) => entry.bookmarked);
    await storageSet({ [STORAGE.history]: state.history });
    renderHistory();
  });

  $("tab-recent").addEventListener("click", () => {
    state.historyTab = "recent";
    renderHistory();
  });

  $("tab-saved").addEventListener("click", () => {
    state.historyTab = "saved";
    renderHistory();
  });

  $("settings-btn").addEventListener("click", () => {
    const panel = $("settings-panel");
    panel.hidden = !panel.hidden;
  });

  $("save-key").addEventListener("click", saveKey);

  $("lang-btn").addEventListener("click", async () => {
    state.language = state.language === "en" ? "ar" : "en";
    await storageSet({ [STORAGE.language]: state.language });
    applyLanguage();
  });
}

async function init() {
  const stored = await storageGet([
    STORAGE.apiKey,
    STORAGE.language,
    STORAGE.outputMode,
    STORAGE.mode,
    STORAGE.history,
  ]);

  state.apiKey = stored[STORAGE.apiKey] || "";
  state.language = stored[STORAGE.language] || "ar";
  state.outputMode = normalizeOutputMode(stored);
  state.history = stored[STORAGE.history] || [];

  $("api-key").value = state.apiKey;

  bindEvents();
  applyLanguage();
  applyMode();
  setOutput("");
  renderHistory();

  // Prompt for key on first run
  if (!state.apiKey) {
    $("settings-panel").hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", init);
