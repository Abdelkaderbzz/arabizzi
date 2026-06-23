"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

export interface ConversionEntry {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  type: "fusha" | "tunisian";
  bookmarked?: boolean;
}

interface HistoryContextType {
  history: ConversionEntry[];
  addEntry: (entry: Omit<ConversionEntry, "id" | "timestamp">) => void;
  clearHistory: () => void;
  deleteEntry: (id: string) => void;
  toggleBookmark: (id: string) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const STORAGE_KEY = "conversion-history";
const MAX_RECENT = 10;

function getStoredHistory(): ConversionEntry[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    console.error("Failed to parse history from localStorage");
    return [];
  }
}

// Keep all bookmarked entries plus the most recent non-bookmarked ones.
function pruneHistory(entries: ConversionEntry[]): ConversionEntry[] {
  const bookmarked = entries.filter((entry) => entry.bookmarked);
  const recent = entries
    .filter((entry) => !entry.bookmarked)
    .slice(0, MAX_RECENT);
  return [...bookmarked, ...recent].sort((a, b) => b.timestamp - a.timestamp);
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const hasHydratedRef = useRef(false);
  const [history, setHistory] = useState<ConversionEntry[]>([]);

  // Handle hydration
  useEffect(() => {
    queueMicrotask(() => {
      setHistory(getStoredHistory());
      hasHydratedRef.current = true;
    });
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!hasHydratedRef.current) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = (entry: Omit<ConversionEntry, "id" | "timestamp">) => {
    const newEntry: ConversionEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setHistory((prev) => pruneHistory([newEntry, ...prev]));
  };

  const deleteEntry = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  };

  const toggleBookmark = (id: string) => {
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, bookmarked: !entry.bookmarked } : entry
      )
    );
  };

  // Only clears non-bookmarked entries so saved ones are preserved.
  const clearHistory = () =>
    setHistory((prev) => prev.filter((entry) => entry.bookmarked));

  return (
    <HistoryContext.Provider
      value={{ history, addEntry, clearHistory, deleteEntry, toggleBookmark }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
