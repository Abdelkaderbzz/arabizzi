"use strict";

const MODEL = "gemini-2.5-flash";
const STORAGE = {
  apiKey: "gemini_api_key",
  language: "language",
  mode: "to_fusha",
  history: "conversion_history",
};

const I18N = {
  en: {
    dir: "ltr",
    title: "Arabic Converter",
    description: "Convert Tunisian Arabic text between Latin and Arabic scripts",
    inputLabel: "Tunisian Arabic (Latin script)",
    inputPlaceholder:
      "Type Tunisian Arabic using Latin characters (e.g., '3aslema, chneya 7alek?')",
    modeLabel: "Output type",
    fusha: "Fusha",
    fushaDesc: "Modern Standard Arabic",
    tunisian: "Tunisian",
    tunisianDesc: "Arabic script",
    convert: "Convert",
    converting: "Converting...",
    copy: "Copy",
    copied: "Copied!",
    outputFusha: "Modern Standard Arabic",
    outputTunisian: "Tunisian Arabic (Arabic script)",
    outputEmpty: "Your converted text will appear here",
    historyTitle: "Recent Conversions",
    tabRecent: "Recent",
    tabSaved: "Saved",
    savedEmpty: "No saved conversions yet",
    historyEmpty: "No conversion history yet",
    bookmark: "Save",
    unbookmark: "Remove from saved",
    clear: "Clear",
    delete: "Delete",
    keyLabel: "Gemini API key",
    keyHint: "Stored only in your browser. Get a free key from Google AI Studio.",
    keyLink: "Get an API key →",
    save: "Save",
    saved: "Key saved",
    keyMissing: "Add your free Gemini API key in settings (⚙) to start converting.",
    footer: "Powered by Google Gemini",
    errGeneric: "An error occurred during conversion. Please try again.",
    langButton: "العربية",
  },
  ar: {
    dir: "rtl",
    title: "محول العربية",
    description: "حوّل النص العربي التونسي بين الحروف اللاتينية والعربية",
    inputLabel: "العربية التونسية (حروف لاتينية)",
    inputPlaceholder:
      "اكتب بالعربية التونسية باستخدام الحروف اللاتينية (مثال: '3aslema, chneya 7alek?')",
    modeLabel: "نوع الإخراج",
    fusha: "فصحى",
    fushaDesc: "العربية الفصحى",
    tunisian: "تونسي",
    tunisianDesc: "حروف عربية",
    convert: "تحويل",
    converting: "جاري التحويل...",
    copy: "نسخ",
    copied: "تم النسخ!",
    outputFusha: "العربية الفصحى",
    outputTunisian: "العربية التونسية (حروف عربية)",
    outputEmpty: "سيظهر النص المحوّل هنا",
    historyTitle: "التحويلات الأخيرة",
    tabRecent: "الأخيرة",
    tabSaved: "المحفوظة",
    savedEmpty: "لا توجد تحويلات محفوظة بعد",
    historyEmpty: "لا يوجد سجل تحويل بعد",
    bookmark: "حفظ",
    unbookmark: "إزالة من المحفوظات",
    clear: "مسح",
    delete: "حذف",
    keyLabel: "مفتاح Gemini API",
    keyHint: "يُحفظ في متصفحك فقط. احصل على مفتاح مجاني من Google AI Studio.",
    keyLink: "احصل على مفتاح →",
    save: "حفظ",
    saved: "تم حفظ المفتاح",
    keyMissing: "أضف مفتاح Gemini المجاني من الإعدادات (⚙) لبدء التحويل.",
    footer: "مدعوم بواسطة Google Gemini",
    errGeneric: "حدث خطأ أثناء التحويل. يرجى المحاولة مرة أخرى.",
    langButton: "English",
  },
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

// State
let state = {
  language: "en",
  toFusha: true,
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
const els = {};

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

function applyLanguage() {
  const tr = t();
  document.documentElement.dir = tr.dir;
  document.documentElement.lang = state.language;

  $("title").textContent = tr.title;
  $("description").textContent = tr.description;
  $("input-label").textContent = tr.inputLabel;
  $("latin-input").placeholder = tr.inputPlaceholder;
  $("mode-label").textContent = tr.modeLabel;
  $("convert-label").textContent = tr.convert;
  $("tab-recent-label").textContent = tr.tabRecent;
  $("tab-saved-label").textContent = tr.tabSaved;
  $("clear-btn").textContent = tr.clear;
  $("copy-btn").textContent = tr.copy;
  $("key-label").textContent = tr.keyLabel;
  $("key-hint").textContent = tr.keyHint;
  $("key-link").textContent = tr.keyLink;
  $("save-key").textContent = tr.save;
  $("footer-text").textContent = tr.footer;
  $("lang-btn").textContent = tr.langButton;

  document.querySelector('[data-key="fusha"]').textContent = tr.fusha;
  document.querySelector('[data-key="fushaDesc"]').textContent = tr.fushaDesc;
  document.querySelector('[data-key="tunisian"]').textContent = tr.tunisian;
  document.querySelector('[data-key="tunisianDesc"]').textContent =
    tr.tunisianDesc;

  updateOutputLabel();
  renderHistory();
  validateInput();
}

function updateOutputLabel() {
  $("output-label").textContent = state.toFusha
    ? t().outputFusha
    : t().outputTunisian;
}

function applyMode() {
  $("mode-fusha").classList.toggle("active", state.toFusha);
  $("mode-tunisian").classList.toggle("active", !state.toFusha);
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

function renderHistory() {
  const card = $("history-card");
  const list = $("history-list");
  const empty = $("history-empty");
  const clearBtn = $("clear-btn");

  const saved = state.history.filter((entry) => entry.bookmarked);
  const recent = state.history.filter((entry) => !entry.bookmarked);
  const entries = state.historyTab === "saved" ? saved : recent;

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

  if (!state.history.length) {
    card.hidden = true;
    list.innerHTML = "";
    empty.hidden = true;
    return;
  }

  card.hidden = false;
  clearBtn.hidden = state.historyTab !== "recent" || !recent.length;
  list.innerHTML = "";

  if (!entries.length) {
    empty.hidden = false;
    empty.textContent =
      state.historyTab === "saved" ? t().savedEmpty : t().historyEmpty;
    return;
  }

  empty.hidden = true;

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const top = document.createElement("div");
    top.className = "hi-top";

    const type = document.createElement("span");
    type.className = "hi-type";
    type.textContent = entry.type === "fusha" ? t().fusha : t().tunisian;

    const actions = document.createElement("div");
    actions.className = "hi-actions";

    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.className = `copy-btn bookmark-btn${
      entry.bookmarked ? " active" : ""
    }`;
    bookmarkBtn.textContent = entry.bookmarked ? "★" : "☆";
    bookmarkBtn.title = entry.bookmarked ? t().unbookmark : t().bookmark;
    bookmarkBtn.addEventListener("click", async () => {
      state.history = state.history.map((e) =>
        e.id === entry.id ? { ...e, bookmarked: !e.bookmarked } : e
      );
      await storageSet({ [STORAGE.history]: state.history });
      renderHistory();
    });

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = t().copy;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(entry.output);
      copyBtn.textContent = t().copied;
      setTimeout(() => (copyBtn.textContent = t().copy), 1500);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "copy-btn";
    delBtn.textContent = "✕";
    delBtn.title = t().delete;
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
    output.dir = "rtl";
    output.textContent = entry.output;

    item.appendChild(top);
    item.appendChild(input);
    item.appendChild(output);
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
    const prompt = state.toFusha ? fushaPrompt(input) : latinaPrompt(input);
    const result = await callGemini(prompt, state.apiKey);
    setOutput(result);

    const entry = {
      id: Math.random().toString(36).slice(2, 11),
      input,
      output: result,
      type: state.toFusha ? "fusha" : "tunisian",
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

  $("mode-fusha").addEventListener("click", async () => {
    state.toFusha = true;
    applyMode();
    await storageSet({ [STORAGE.mode]: true });
  });
  $("mode-tunisian").addEventListener("click", async () => {
    state.toFusha = false;
    applyMode();
    await storageSet({ [STORAGE.mode]: false });
  });

  $("convert-btn").addEventListener("click", handleConvert);

  $("copy-btn").addEventListener("click", () => {
    const text = $("output").textContent;
    navigator.clipboard.writeText(text);
    $("copy-btn").textContent = t().copied;
    setTimeout(() => ($("copy-btn").textContent = t().copy), 1500);
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
    STORAGE.mode,
    STORAGE.history,
  ]);

  state.apiKey = stored[STORAGE.apiKey] || "";
  state.language = stored[STORAGE.language] || "en";
  state.toFusha =
    stored[STORAGE.mode] === undefined ? true : stored[STORAGE.mode];
  state.history = stored[STORAGE.history] || [];

  $("api-key").value = state.apiKey;

  bindEvents();
  applyLanguage();
  applyMode();
  setOutput("");

  // Prompt for key on first run
  if (!state.apiKey) {
    $("settings-panel").hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", init);
