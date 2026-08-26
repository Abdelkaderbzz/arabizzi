// Self-check for the shared helpers: node extension/test-translate.js
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const src = fs.readFileSync(path.join(__dirname, "translate.js"), "utf8");
const T = vm.runInThisContext(
  `${src}\n;({ selectionPrompt, promptForMode, pruneHistory, normalizeOutputMode, outputDir, callGemini, OUTPUT_MODES, MODELS })`
);

// Every mode gets a real target language, and the input is embedded verbatim.
T.OUTPUT_MODES.forEach((mode) => {
  const p = T.selectionPrompt("3aslema", mode);
  assert.ok(p.includes("3aslema"), `${mode}: input missing`);
  assert.ok(!p.includes("undefined"), `${mode}: unmapped target`);
});
assert.ok(T.selectionPrompt("hi", "english").includes("fluent English"));
assert.ok(T.selectionPrompt("hi", "bogus").includes("Modern Standard Arabic"));

// A Latin-script target must never be told to answer in Arabic script — that is
// what made "English" come back as Arabic.
["english", "french"].forEach((mode) => {
  const p = T.selectionPrompt("3aslema", mode);
  assert.ok(!p.includes("in Arabic script"), `${mode}: asks for Arabic script`);
  assert.ok(p.includes("Latin alphabet"), `${mode}: script not pinned`);
});
["fusha", "tunisian"].forEach((mode) => {
  assert.ok(T.selectionPrompt("3aslema", mode).includes("Arabic script"));
});

// Popup prompts still route per mode.
assert.ok(T.promptForMode("french", "x").includes("natural French"));
assert.ok(T.promptForMode("nope", "x").includes("Modern Standard Arabic"));

assert.strictEqual(T.outputDir("english"), "ltr");
assert.strictEqual(T.outputDir("fusha"), "rtl");

// Bookmarks survive; only the newest MAX_RECENT unbookmarked entries do.
const entries = Array.from({ length: 15 }, (_, i) => ({
  id: String(i),
  timestamp: 100 - i,
  bookmarked: i === 14,
}));
const pruned = T.pruneHistory(entries);
assert.strictEqual(pruned.length, 11);
assert.ok(pruned.some((e) => e.id === "14"));
assert.ok(!pruned.some((e) => e.id === "13"));
assert.deepStrictEqual(
  pruned.map((e) => e.timestamp),
  [...pruned.map((e) => e.timestamp)].sort((a, b) => b - a)
);

assert.strictEqual(T.normalizeOutputMode({ output_mode: "french" }), "french");
assert.strictEqual(T.normalizeOutputMode({ output_mode: "junk" }), "fusha");
assert.strictEqual(T.normalizeOutputMode({ to_fusha: false }), "tunisian");
assert.strictEqual(T.normalizeOutputMode({}), "fusha");

// callGemini must never return "" — an empty candidate has to surface as an
// error. Rate limits should retry before failing. Unavailable models fall through.
(async () => {
  let callCount = 0;
  let FAKE = { candidates: [{ finishReason: "MAX_TOKENS", content: {} }] };
  let status = 200;

  globalThis.fetch = async () => {
    callCount += 1;
    const payload = FAKE;
    const ok = status >= 200 && status < 300;
    return {
      ok,
      status,
      json: async () => payload,
    };
  };

  await assert.rejects(() => T.callGemini("p", "k"), /MAX_TOKENS/);

  FAKE = { promptFeedback: { blockReason: "SAFETY" } };
  status = 200;
  await assert.rejects(() => T.callGemini("p", "k"), /SAFETY/);

  FAKE = { candidates: [{ content: { parts: [{ text: " hello " }] } }] };
  assert.strictEqual(await T.callGemini("p", "k"), "hello");

  // First call 429, second succeeds.
  callCount = 0;
  let phase = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    phase += 1;
    if (phase === 1) {
      return {
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: "Quota exceeded. Please retry in 0.01s." },
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "ok" }] } }],
      }),
    };
  };
  assert.strictEqual(await T.callGemini("p", "k"), "ok");
  assert.ok(callCount >= 2, "expected a retry after 429");

  // First model unavailable → try next.
  const tried = [];
  globalThis.fetch = async (url) => {
    tried.push(String(url));
    if (tried.length === 1) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            message:
              "This model models/gemini-3.1-flash-lite is no longer available to new users.",
          },
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "fallback" }] } }],
      }),
    };
  };
  assert.strictEqual(await T.callGemini("p", "k"), "fallback");
  assert.ok(tried.length >= 2, "expected model fallback");
  assert.ok(T.MODELS.length >= 2);

  console.log("translate.js OK");
})();
