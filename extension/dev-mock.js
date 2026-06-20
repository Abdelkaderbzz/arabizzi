// Mock Chrome APIs for local UI preview (open preview.html in a browser).
(function () {
  const store = {
    language: "ar",
    output_mode: "tunisian",
    to_fusha: false,
    conversion_history: [
      {
        id: "sample1",
        input: "taw nemchi lel dar",
        output: "توا نمشي للدار",
        type: "tunisian",
        timestamp: Date.now() - 3600000,
        bookmarked: false,
      },
      {
        id: "sample2",
        input: "Brabi nhib nihdi omi w baba omra, enehi A7sin agence fi sousse",
        output:
          "ربي نحب نهدي أمي و بaba عمرو، إنه أحسن وكالة في سوسة par expérience مثبتة fil abraj",
        type: "fusha",
        timestamp: Date.now() - 7200000,
        bookmarked: true,
      },
      {
        id: "sample3",
        input: "3aslema chneya 7alek",
        output: "عسلامة شنية حالك",
        type: "tunisian",
        timestamp: Date.now() - 86400000,
        bookmarked: true,
      },
    ],
  };

  globalThis.chrome = {
    storage: {
      local: {
        get(keys, callback) {
          const result = {};
          const list = Array.isArray(keys) ? keys : [keys];
          list.forEach((key) => {
            if (key in store) result[key] = store[key];
          });
          callback(result);
        },
        set(items, callback) {
          Object.assign(store, items);
          if (callback) callback();
        },
      },
    },
  };
})();
