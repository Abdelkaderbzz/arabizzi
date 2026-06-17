"use client";

import { Github, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <footer className="w-full py-8 mt-4">
      <div
        className={`flex items-center justify-center gap-3 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          asChild
        >
          <a
            href="https://github.com/Abdelkaderbzz/arabic-converter-extenstion"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </Button>
        <span className="text-border">·</span>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 ${
            isRtl ? "font-[family-name:var(--font-arabic)]" : ""
          }`}
          asChild
        >
          <a
            href="https://buymeacoffee.com/hazembraiek"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Heart className="h-4 w-4" />
            {t.footer.support}
          </a>
        </Button>
      </div>
    </footer>
  );
}
