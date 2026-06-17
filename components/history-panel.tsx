"use client";

import { Button } from "@/components/ui/button";
import {
  useHistory,
  type ConversionEntry,
} from "@/contexts/history-context";
import { useLanguage } from "@/contexts/language-context";
import {
  Bookmark,
  Check,
  Copy,
  History,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "recent" | "saved";

export function HistoryPanel() {
  const { history, clearHistory, deleteEntry, toggleBookmark } = useHistory();
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const [tab, setTab] = useState<Tab>("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const saved = history.filter((entry) => entry.bookmarked);
  const recent = history.filter((entry) => !entry.bookmarked);
  const entries = tab === "saved" ? saved : recent;

  const handleCopy = async (entry: ConversionEntry) => {
    await navigator.clipboard.writeText(entry.output);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (history.length === 0) {
    return (
      <div
        className={`mt-6 pt-6 border-t border-border/60 flex flex-col items-center gap-2 text-center ${
          isRtl ? "font-[family-name:var(--font-arabic)]" : ""
        }`}
      >
        <div className="rounded-full bg-muted/60 p-3">
          <History className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t.history.empty}</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "recent", label: t.history.tabRecent, count: recent.length },
    { id: "saved", label: t.history.tabSaved, count: saved.length },
  ];

  return (
    <div className="mt-6 pt-6 border-t border-border/60">
      <div
        className={`flex items-center justify-between gap-2 mb-3 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/60">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                isRtl ? "font-[family-name:var(--font-arabic)] flex-row-reverse" : "",
                tab === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.id === "saved" && <Bookmark className="h-3 w-3" />}
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  tab === item.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "recent" && recent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title={t.history.clearAll}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p
          className={`py-6 text-center text-sm text-muted-foreground ${
            isRtl ? "font-[family-name:var(--font-arabic)]" : ""
          }`}
        >
          {tab === "saved" ? t.history.savedEmpty : t.history.empty}
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group relative rounded-xl border border-border/60 bg-muted/20 p-3 text-sm space-y-2 hover:border-primary/20 hover:bg-primary/5 transition-colors"
            >
              <div
                className={`flex items-center justify-between gap-2 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] shrink-0",
                    entry.type === "fusha"
                      ? "border-primary/30 text-primary"
                      : "border-accent-foreground/20 text-accent-foreground"
                  )}
                >
                  {entry.type === "fusha" ? t.mode.fusha : t.mode.tunisian}
                </Badge>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(entry.id)}
                    className={cn(
                      "h-7 w-7 p-0",
                      entry.bookmarked
                        ? "text-primary"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary"
                    )}
                    title={
                      entry.bookmarked
                        ? t.history.unbookmark
                        : t.history.bookmark
                    }
                  >
                    <Bookmark
                      className={cn(
                        "h-3.5 w-3.5",
                        entry.bookmarked && "fill-current"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(entry)}
                    className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                    title={copiedId === entry.id ? t.history.copied : t.history.copy}
                  >
                    {copiedId === entry.id ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
                    className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                    title={t.history.deleteEntry}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div
                className="font-mono text-xs text-muted-foreground truncate"
                dir="ltr"
              >
                {entry.input}
              </div>
              <div
                className="text-right text-lg leading-relaxed font-[family-name:var(--font-arabic)]"
                dir="rtl"
              >
                {entry.output}
              </div>

              <div
                className={`flex items-center justify-between pt-1 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <span className="text-[11px] text-muted-foreground/70">
                  {new Date(entry.timestamp).toLocaleString(
                    language === "ar" ? "ar-TN" : "en-US",
                    {
                      hour: "numeric",
                      minute: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                  title={t.history.restore}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("restore-conversion", {
                        detail: { input: entry.input, type: entry.type },
                      })
                    );
                  }}
                >
                  <RotateCcw className={cn("h-3 w-3", isRtl ? "ml-1" : "mr-1")} />
                  {t.history.restore}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
