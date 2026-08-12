"use strict";

// Shared by popup.js (script tag) and background.js (importScripts).
// Keep it dependency-free so both classic contexts can load it.

// Prefer current Flash-Lite IDs. Older 2.5 models are closed to many new keys.
const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];
const MODEL = MODELS[0];
const OUTPUT_MODES = ["fusha", "tunisian", "english", "french"];
const MAX_RECENT = 10;
const MAX_SELECTION_CHARS = 4000;
const MAX_RETRIES = 3;

const STORAGE = {
  apiKey: "gemini_api_key",
  language: "language",
  mode: "to_fusha",
  outputMode: "output_mode",
  history: "conversion_history",
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

// The popup prompts above assume Arabizi input. Text selected on a web page can
// be in any language, so page selections use this auto-detecting variant.
// script is stated separately from lang so the Arabizi mapping in rule 2 can
// never be read as "answer in Arabic script" for an English/French target.
const SELECTION_TARGET = {
  fusha: { lang: "formal Modern Standard Arabic (Fusha)", script: "Arabic script" },
  tunisian: { lang: "Tunisian colloquial Arabic", script: "Arabic script" },
  english: { lang: "natural, fluent English", script: "the Latin alphabet, in the English language" },
  french: { lang: "natural, fluent French", script: "the Latin alphabet, in the French language" },
};

const selectionPrompt = (text, mode) => {
  const { lang: target, script } = SELECTION_TARGET[mode] || SELECTION_TARGET.fusha;
  return `You are a translation engine. Translate the input text into ${target}.

### **Rules:**
1. **Output only the translation**, written in ${script}. No explanations, notes, quotes, or the original text.
2. **Detect the source language yourself.** If the input is Arabizi (Arabic written in Latin letters with numbers), read '3' → 'ع', '7' → 'ح', '8' → 'غ', '9' → 'ق', '5' → 'خ', '2' → 'ء' **to understand it**. This mapping only helps you read the input — it must never change the language or script you output.
3. **Preserve meaning, tone, and formatting** (line breaks, lists, punctuation).
4. If the input is already in ${target}, return it unchanged.

### **Input Text:**
"""
${text}
"""

### **Output (${target}, ${script}):**`;
};

function promptForMode(mode, text) {
  if (mode === "tunisian") return latinaPrompt(text);
  if (mode === "english") return englishPrompt(text);
  if (mode === "french") return frenchPrompt(text);
  return fushaPrompt(text);
}

function outputDir(mode) {
  return mode === "english" || mode === "french" ? "ltr" : "rtl";
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

function pruneHistory(entries) {
  const bookmarked = entries.filter((entry) => entry.bookmarked);
  const recent = entries
    .filter((entry) => !entry.bookmarked)
    .slice(0, MAX_RECENT);
  return [...bookmarked, ...recent].sort((a, b) => b.timestamp - a.timestamp);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(message, attempt) {
  const match = String(message || "").match(/retry in\s+([\d.]+)\s*s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 100;
  // Exponential backoff: ~1.5s, 3s, 6s
  return Math.min(1500 * 2 ** attempt, 8000);
}

function isRateLimited(status, message) {
  if (status === 429) return true;
  return /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(String(message || ""));
}

function isModelUnavailable(status, message) {
  if (status === 404) return true;
  return /no longer available|not found|not supported|deprecated/i.test(
    String(message || "")
  );
}

async function callGeminiWithModel(prompt, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  });

  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      lastError = data?.error?.message || `Request failed (${res.status})`;
      if (isModelUnavailable(res.status, lastError)) {
        const err = new Error(lastError);
        err.code = "MODEL_UNAVAILABLE";
        throw err;
      }
      if (isRateLimited(res.status, lastError) && attempt < MAX_RETRIES) {
        await sleep(retryAfterMs(lastError, attempt));
        continue;
      }
      throw new Error(lastError);
    }
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
    if (!text) {
      // Never hand back "" — the caller would render an empty box and look broken.
      const reason =
        candidate?.finishReason ||
        data?.promptFeedback?.blockReason ||
        "EMPTY_RESPONSE";
      throw new Error(`Gemini returned no text (${reason})`);
    }
    return text;
  }
  throw new Error(lastError || "Rate limited — try again in a minute");
}

async function callGemini(prompt, apiKey) {
  let lastError = "";
  for (const model of MODELS) {
    try {
      return await callGeminiWithModel(prompt, apiKey, model);
    } catch (err) {
      lastError = err?.message || String(err);
      if (err?.code === "MODEL_UNAVAILABLE") continue;
      throw err;
    }
  }
  throw new Error(lastError || "No Gemini model available for this API key");
}
