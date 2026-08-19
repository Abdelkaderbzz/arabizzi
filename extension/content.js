"use strict";

// Selection UI only — every Gemini call goes through background.js.
(() => {
  if (window.__arabizziContentLoaded) return;
  window.__arabizziContentLoaded = true;

  const MODES = ["fusha", "tunisian", "english", "french"];
  const MIN_CHARS = 2;
  // Must match MAX_SELECTION_CHARS in translate.js: background.js truncates
  // longer input, and writing a truncated correction back would eat the tail.
  const MAX_FIX_CHARS = 4000;
  // Mirrors CORRECT_MODE in translate.js.
  const CORRECT_MODE = "correct";

  const I18N = {
    en: {
      dir: "ltr",
      translate: "Translate",
      loading: "Translating…",
      copy: "Copy",
      copied: "Copied!",
      copyFailed: "Copy failed",
      correct: "Fix text",
      fixing: "Fixing…",
      stale: "Arabizzi was updated — reload this page to keep using it.",
      keyMissing:
        "Add your free Gemini API key in the Arabizzi popup (⚙) to start translating.",
      error: "Translation failed. Please try again.",
      fusha: "Fusha",
      tunisian: "عامية",
      english: "English",
      french: "French",
    },
    ar: {
      dir: "rtl",
      translate: "ترجم",
      loading: "جاري الترجمة…",
      copy: "نسخ",
      copied: "تم النسخ!",
      copyFailed: "فشل النسخ",
      correct: "صحّح النص",
      fixing: "جارٍ التصحيح…",
      stale: "تم تحديث Arabizzi — أعد تحميل الصفحة للمتابعة.",
      keyMissing:
        "أضف مفتاح Gemini المجاني من نافذة Arabizzi (⚙) لبدء الترجمة.",
      error: "فشلت الترجمة. يرجى المحاولة مرة أخرى.",
      fusha: "فصحى",
      tunisian: "عامية",
      english: "إنجليزي",
      french: "فرنسي",
    },
  };

  const CSS = `
    :host { all: initial; }
    .panel {
      position: fixed;
      z-index: 2147483647;
      max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1d2329;
      background: #ffffff;
      border: 1px solid #e4e0d6;
      border-radius: 12px;
      box-shadow: 0 8px 28px rgba(29, 35, 41, 0.18);
      overflow: hidden;
    }
    .panel.bare {
      border: none;
      background: transparent;
      box-shadow: none;
      display: flex;
      gap: 6px;
    }
    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: #25876d;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      font: inherit;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 135, 109, 0.35);
    }
    .pill:hover { background: #1f7159; }
    .pill.secondary { background: #ffffff; color: #25876d; box-shadow: 0 4px 14px rgba(29, 35, 41, 0.18); }
    .pill.secondary:hover { background: #f0f7f4; }
    .pill:disabled { cursor: default; opacity: 0.75; }
    .pill:disabled .glyph { animation: pill-pulse 1s ease-in-out infinite; }
    @keyframes pill-pulse {
      50% { opacity: 0.3; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pill:disabled .glyph { animation: none; }
    }
    .pill:focus-visible { outline: 2px solid #1d2329; outline-offset: 2px; }
    .pill .glyph { font-size: 15px; line-height: 1; }
    .body { padding: 12px 14px; max-height: 220px; overflow-y: auto; white-space: pre-wrap; }
    .skeleton { width: 264px; padding: 14px; display: grid; gap: 9px; }
    .sk-line {
      height: 11px;
      border-radius: 6px;
      background: linear-gradient(90deg, #eceae3 25%, #f7f4ee 37%, #eceae3 63%);
      background-size: 400% 100%;
      animation: sk-shimmer 1.3s ease-in-out infinite;
    }
    .sk-line:nth-child(2) { width: 88%; }
    .sk-line:nth-child(3) { width: 62%; }
    @keyframes sk-shimmer {
      from { background-position: 100% 50%; }
      to { background-position: 0 50%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sk-line { animation: none; }
    }
    .body.muted { color: #6b7280; }
    .body.error { color: #dc2626; }
    .foot {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-top: 1px solid #e4e0d6;
      background: #f7f4ee;
      flex-wrap: wrap;
    }
    .chip {
      padding: 4px 9px;
      border: 1px solid #e4e0d6;
      border-radius: 999px;
      background: #ffffff;
      color: #6b7280;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
    .chip:hover { border-color: #25876d; color: #25876d; }
    .chip:focus-visible { outline: 2px solid #25876d; outline-offset: 1px; }
    .chip.active { background: #25876d; border-color: #25876d; color: #ffffff; }
    .chip.copy { margin-inline-start: auto; color: #25876d; border-color: rgba(37, 135, 109, 0.4); }
    .chip:disabled { opacity: 0.55; cursor: default; }
  `;

  let host = null;
  let shadow = null;
  let lang = "ar";
  let translateSeq = 0;
  // Prevents mouseup from replacing a loading/result bubble with the pill
  // while the same selection is still active.
  let ui = { kind: "hidden", source: "" };

  chrome.storage.local.get("language", (stored) => {
    if (stored?.language === "en" || stored?.language === "ar") {
      lang = stored.language;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.language) return;
    const next = changes.language.newValue;
    if (next === "en" || next === "ar") lang = next;
  });

  const t = () => I18N[lang];

  function ensureHost() {
    if (host?.isConnected) return;
    host = document.createElement("div");
    host.setAttribute("data-arabizzi", "");
    shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = CSS;
    shadow.appendChild(style);
    document.documentElement.appendChild(host);
  }

  function hide() {
    translateSeq += 1;
    ui = { kind: "hidden", source: "" };
    if (host?.isConnected) host.remove();
    host = null;
    shadow = null;
  }

  function place(el, rect) {
    // Rects come from getBoundingClientRect, and .panel is position:fixed, so
    // viewport coordinates go straight through.
    el.style.visibility = "hidden";
    el.style.left = "0px";
    el.style.top = "0px";
    requestAnimationFrame(() => {
      if (!el.isConnected) return;
      const box = el.getBoundingClientRect();
      const above = rect.top - box.height - 8;
      const top =
        above >= 8
          ? above
          : Math.min(rect.bottom + 8, window.innerHeight - box.height - 8);
      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - box.width - 8)
      );
      el.style.left = `${left}px`;
      el.style.top = `${Math.max(8, top)}px`;
      el.style.visibility = "visible";
    });
  }

  function render(rect, build) {
    ensureHost();
    shadow.querySelector(".panel")?.remove();
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.dir = t().dir;
    build(panel);
    shadow.appendChild(panel);
    place(panel, rect);
  }

  function pillButton(glyphChar, label, onClick, secondary) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = secondary ? "pill secondary" : "pill";
    btn.setAttribute("aria-label", label);
    const glyph = document.createElement("span");
    glyph.className = "glyph";
    glyph.textContent = glyphChar;
    const text = document.createElement("span");
    text.className = "label";
    text.textContent = label;
    btn.appendChild(glyph);
    btn.appendChild(text);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function showPill(text, rect, edit) {
    ui = { kind: "pill", source: text };
    render(rect, (panel) => {
      panel.classList.add("bare");
      panel.appendChild(
        pillButton("ع", t().translate, () => translate(text, null, rect))
      );
      // Only offer the fix when we can actually write the result back.
      if (edit && text.length <= MAX_FIX_CHARS) {
        const fix = pillButton("✓", t().correct, () => {
          // The pill itself is the progress indicator — a skeleton panel over
          // the field the text is about to land in only hides the result.
          fix.disabled = true;
          fix.querySelector(".label").textContent = t().fixing;
          translate(text, CORRECT_MODE, rect, edit);
        }, true);
        panel.appendChild(fix);
      }
    });
  }

  function showLoading(rect) {
    ui = { kind: "loading", source: ui.source };
    render(rect, (panel) => {
      const box = document.createElement("div");
      box.className = "skeleton";
      box.setAttribute("role", "status");
      box.setAttribute("aria-label", t().loading);
      box.innerHTML = '<div class="sk-line"></div>'.repeat(3);
      panel.appendChild(box);
    });
  }

  function showMessage(rect, message, kind) {
    ui = { kind: "message", source: ui.source };
    render(rect, (panel) => {
      const body = document.createElement("div");
      body.className = `body ${kind}`;
      body.textContent = message;
      panel.appendChild(body);
    });
  }

  // The content script inherits the page's context: navigator.clipboard is
  // undefined on http:// pages and blocked outright by some pages'
  // Permissions-Policy, so it can never be the only path.
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the execCommand path.
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.readOnly = true;
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;";
    const root = document.body || document.documentElement;
    const previous = document.activeElement;
    root.appendChild(ta);
    try {
      ta.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      ta.remove();
      previous?.focus?.({ preventScroll: true });
    }
  }

  function showResult(rect, text, mode, dir, source) {
    ui = { kind: "result", source };
    render(rect, (panel) => {
      const body = document.createElement("div");
      body.className = "body";
      body.dir = dir;
      body.textContent = text;
      panel.appendChild(body);

      const foot = document.createElement("div");
      foot.className = "foot";
      MODES.forEach((m) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `chip${m === mode ? " active" : ""}`;
        chip.textContent = t()[m];
        chip.disabled = m === mode;
        chip.addEventListener("click", () => translate(source, m, rect));
        foot.appendChild(chip);
      });

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "chip copy";
      copy.textContent = t().copy;
      copy.addEventListener("click", async () => {
        copy.textContent = (await copyText(text)) ? t().copied : t().copyFailed;
        setTimeout(() => (copy.textContent = t().copy), 1500);
      });
      foot.appendChild(copy);
      panel.appendChild(foot);
    });
  }

  function friendlyError(message) {
    if (!message) return t().error;
    // Keep short network / quota hints; hide raw stack-like API noise.
    if (/API key|invalid|permission|quota|rate|RESOURCE_EXHAUSTED/i.test(message)) {
      return message;
    }
    if (/MAX_TOKENS|EMPTY_RESPONSE|SAFETY|BLOCK/i.test(message)) {
      return t().error;
    }
    return message.length > 160 ? t().error : message;
  }

  // execCommand is deprecated but it is the only insert that keeps the page's
  // native undo stack and fires the input events React/Vue editors listen for.
  // Setting .value directly is invisible to React's value tracker.
  function applyCorrection(edit, text, source) {
    if (!edit?.el?.isConnected) return false;
    const { el } = edit;
    // The offsets were snapshotted before the request. If the user kept typing
    // while it was in flight they now point at different text, and writing
    // there would clobber it.
    const current = edit.range
      ? edit.range.toString().trim()
      : el.value.slice(edit.start, edit.end);
    if (current !== source) return false;
    try {
      el.focus({ preventScroll: true });
      if (edit.range) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(edit.range);
      } else {
        el.setSelectionRange(edit.start, edit.end);
      }
      if (document.execCommand("insertText", false, text)) return true;
      if (edit.range) return false;
      const proto =
        el.tagName === "TEXTAREA"
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(
        el,
        el.value.slice(0, edit.start) + text + el.value.slice(edit.end)
      );
      el.setSelectionRange(edit.start, edit.start + text.length);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }

  // Reloading or updating the extension orphans every content script already
  // running in an open tab: chrome.runtime.id goes undefined and sendMessage
  // throws "Extension context invalidated." Only a page reload recovers.
  function isOrphaned() {
    return !chrome.runtime?.id;
  }

  function translate(text, mode, rect, edit) {
    const source = (text || "").trim();
    if (source.length < MIN_CHARS) return;
    if (isOrphaned()) {
      showMessage(rect, t().stale, "muted");
      return;
    }

    ui = { kind: "loading", source };
    const seq = ++translateSeq;
    // Correction keeps the pill (already switched to its pending state) so the
    // field stays visible and the text just changes in place.
    if (mode !== CORRECT_MODE) showLoading(rect);

    try {
      chrome.runtime.sendMessage(
        { action: "translate", text: source, mode },
        (res) => {
          if (seq !== translateSeq) return;
          if (chrome.runtime.lastError || !res) {
            showMessage(rect, t().error, "error");
            return;
          }
          if (res.needsKey) {
            if (res.language === "en" || res.language === "ar") {
              lang = res.language;
            }
            showMessage(rect, t().keyMissing, "muted");
            return;
          }
          if (res.error || !res.output) {
            showMessage(rect, friendlyError(res.error), "error");
            return;
          }
          if (res.mode === CORRECT_MODE) {
            if (applyCorrection(edit, res.output, source)) {
              hide();
              return;
            }
            // Field went away or refused the write — never drop the result.
            showResult(rect, res.output, res.mode, res.dir, source);
            return;
          }
          showResult(rect, res.output, res.mode, res.dir, source);
        }
      );
    } catch {
      // Invalidated between the check above and the send.
      showMessage(rect, t().stale, "muted");
    }
  }

  function fieldSelection() {
    const el = document.activeElement;
    if (!el) return null;
    const tag = el.tagName;
    const isTextarea = tag === "TEXTAREA";
    const isInput =
      tag === "INPUT" &&
      /^(text|search|url|tel|email|number|)$/i.test(el.type || "text");
    if (!isTextarea && !isInput) return null;
    if (typeof el.selectionStart !== "number" || typeof el.selectionEnd !== "number") {
      return null;
    }
    if (el.selectionStart === el.selectionEnd) return null;
    const raw = el.value.slice(el.selectionStart, el.selectionEnd);
    const text = raw.trim();
    if (text.length < MIN_CHARS) return null;
    // Inputs don't expose a selection rect; anchor near the field.
    const rect = el.getBoundingClientRect();
    // Offsets are snapshotted now (and shifted past the whitespace trim, so a
    // sloppy selection doesn't lose the spaces around the word); clicking the
    // pill blurs the field and collapses the selection before the reply lands.
    const start = el.selectionStart + (raw.length - raw.trimStart().length);
    return { text, rect, edit: { el, start, end: start + text.length } };
  }

  function selectionRect() {
    const field = fieldSelection();
    if (field) return field;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const text = sel.toString().trim();
    if (text.length < MIN_CHARS) return null;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return null;
    const node = range.commonAncestorContainer;
    const anchor = node.nodeType === 1 ? node : node.parentElement;
    const editable = anchor?.isContentEditable ? anchor : null;
    return {
      text,
      rect,
      // ponytail: the range keeps whatever whitespace the user selected, so a
      // fix can trim the edges; snap the range to word bounds if that bites.
      edit: editable ? { el: editable, range: range.cloneRange() } : null,
    };
  }

  function maybeShowPill() {
    const current = selectionRect();
    if (!current?.text) {
      if (ui.kind === "pill") hide();
      return;
    }
    // Keep loading / result / message for the same selection — a late mouseup
    // (or keyboard release) must not wipe the bubble back to the pill.
    if (
      (ui.kind === "loading" || ui.kind === "result" || ui.kind === "message") &&
      current.text === ui.source
    ) {
      return;
    }
    showPill(current.text, current.rect, current.edit);
  }

  // Capture phase: plenty of sites call stopPropagation() on mouse events, which
  // would never let a bubble-phase listener on document run.
  document.addEventListener(
    "mouseup",
    (e) => {
      if (host && e.composedPath().includes(host)) return;
      // Let the browser finish updating the selection first.
      setTimeout(maybeShowPill, 0);
    },
    true
  );

  document.addEventListener(
    "mousedown",
    (e) => {
      if (host && e.composedPath().includes(host)) return;
      hide();
    },
    true
  );

  // Keyboard selections (Shift+arrows, Ctrl/Cmd+A) never fire mouseup.
  document.addEventListener(
    "keyup",
    (e) => {
      if (host && e.composedPath().includes(host)) return;
      const selectingKey =
        e.key === "Shift" ||
        e.shiftKey ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a");
      if (!selectingKey) return;
      setTimeout(maybeShowPill, 0);
    },
    true
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") hide();
    },
    true
  );

  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.action !== "translate-selection") return;
    const current = selectionRect();
    const rect = current?.rect || {
      top: 80,
      bottom: 80,
      left: window.innerWidth / 2 - 180,
      width: 0,
      height: 0,
    };
    const text = (msg.text || current?.text || "").trim();
    if (text) translate(text, msg.mode, rect, current?.edit);
  });
})();
