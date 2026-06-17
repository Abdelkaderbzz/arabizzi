"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { convertToArabic } from "@/lib/convert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";
import { useHistory } from "@/contexts/history-context";
import { HistoryPanel } from "@/components/history-panel";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { input: "3aslema", fusha: "السلام عليكم", tunisian: "عسلامة" },
  { input: "chneya 7alek?", fusha: "كيف حالك؟", tunisian: "شنية حالك؟" },
  {
    input: "taw nemchi lel dar",
    fusha: "سأذهب إلى المنزل الآن",
    tunisian: "توا نمشي للدار",
  },
] as const;

export function Converter() {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toFusha, setToFusha] = useState(true);
  const [copied, setCopied] = useState(false);
  const { addEntry } = useHistory();

  useEffect(() => {
    const handleRestore = (event: Event) => {
      const { input: restoredInput, type } = (
        event as CustomEvent<{ input: string; type: "fusha" | "tunisian" }>
      ).detail;
      setInput(restoredInput);
      setToFusha(type === "fusha");
      setOutput("");
      setError(null);
    };

    window.addEventListener("restore-conversion", handleRestore);
    return () => window.removeEventListener("restore-conversion", handleRestore);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutput("");

    try {
      const result = await convertToArabic(input, toFusha);
      setOutput(result);
      addEntry({
        input,
        output: result,
        type: toFusha ? "fusha" : "tunisian",
      });
    } catch {
      setError(t.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExample = (example: (typeof EXAMPLES)[number]) => {
    setInput(example.input);
    setOutput("");
    setError(null);
  };

  return (
    <Card
      className="glass-card rounded-2xl overflow-hidden fade-in-up"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ animationDelay: "0.1s" }}
    >
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="latin-input"
              className={`block text-sm font-medium text-foreground ${
                isRtl ? "font-[family-name:var(--font-arabic)]" : ""
              }`}
            >
              {t.latinInput.label}
            </label>
            <Textarea
              id="latin-input"
              placeholder={t.latinInput.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-28 text-base resize-none rounded-xl border-border/80 bg-muted/30 focus-visible:ring-primary/30"
              dir="ltr"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <span
              className={`block text-sm font-medium text-foreground ${
                isRtl ? "font-[family-name:var(--font-arabic)]" : ""
              }`}
            >
              {t.mode.label}
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border/60">
              <button
                type="button"
                onClick={() => setToFusha(true)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  toFusha
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
              >
                <span className={isRtl ? "font-[family-name:var(--font-arabic)]" : ""}>
                  {t.mode.fusha}
                </span>
                <span className="block text-[11px] opacity-80 mt-0.5 font-normal">
                  {t.mode.fushaDesc}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setToFusha(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  !toFusha
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
              >
                <span className={isRtl ? "font-[family-name:var(--font-arabic)]" : ""}>
                  {t.mode.tunisian}
                </span>
                <span className="block text-[11px] opacity-80 mt-0.5 font-normal">
                  {t.mode.tunisianDesc}
                </span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-base font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-shadow"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <Loader2
                  className={cn("h-4 w-4 animate-spin", isRtl ? "ml-2" : "mr-2")}
                />
                {t.button.converting}
              </>
            ) : (
              <>
                <Sparkles
                  className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")}
                />
                {t.button.convert}
              </>
            )}
          </Button>

          {error && (
            <Alert
              variant="destructive"
              className="rounded-xl bg-destructive/5 text-destructive border-destructive/20"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="arabic-output"
                className={`text-sm font-medium text-foreground ${
                  isRtl ? "font-[family-name:var(--font-arabic)]" : ""
                }`}
              >
                {toFusha ? t.output.fusha : t.output.tunisian}
              </label>
              {output && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className={cn("h-3.5 w-3.5", isRtl ? "ml-1.5" : "mr-1.5")} />
                      {t.button.copied}
                    </>
                  ) : (
                    <>
                      <Copy className={cn("h-3.5 w-3.5", isRtl ? "ml-1.5" : "mr-1.5")} />
                      {t.button.copy}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div
              id="arabic-output"
              className={cn(
                "relative rounded-xl border min-h-28 p-4 text-right text-xl leading-relaxed transition-all duration-300 font-[family-name:var(--font-arabic)]",
                output
                  ? "bg-primary/5 border-primary/20 text-foreground fade-in"
                  : "bg-muted/20 border-dashed border-border/80 text-muted-foreground/60 text-base flex items-center justify-center"
              )}
              dir="rtl"
            >
              {output || t.output.empty}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <p
              className={`text-xs font-medium text-muted-foreground mb-3 ${
                isRtl ? "font-[family-name:var(--font-arabic)]" : ""
              }`}
            >
              {t.examples.title}
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.input}
                  type="button"
                  onClick={() => handleExample(example)}
                  className={`group flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${
                    isRtl ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 font-mono text-xs bg-background/80"
                  >
                    {example.input}
                  </Badge>
                  <ArrowRight
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-hover:text-primary",
                      isRtl && "rotate-180"
                    )}
                  />
                  <span className="font-[family-name:var(--font-arabic)] text-sm text-foreground truncate">
                    {toFusha ? example.fusha : example.tunisian}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <HistoryPanel />
      </CardContent>
    </Card>
  );
}
