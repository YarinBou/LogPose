"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface PandamanHunt {
  /** Ids of the cards where Pandaman has been spotted. */
  found: ReadonlySet<string>;
  total: number;
  spot: (id: string) => void;
}

const PandamanHuntContext = createContext<PandamanHunt | null>(null);

/** Shares the Pandaman hunt between the timeline cards (where he hides) and the footer (the tally). */
export function PandamanHuntProvider({ total, children }: { total: number; children: ReactNode }) {
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set());

  const spot = useCallback((id: string) => {
    setFound((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ found, total, spot }), [found, total, spot]);

  return <PandamanHuntContext.Provider value={value}>{children}</PandamanHuntContext.Provider>;
}

export function usePandamanHunt(): PandamanHunt {
  const context = useContext(PandamanHuntContext);
  if (!context) {
    throw new Error("usePandamanHunt must be used inside <PandamanHuntProvider>");
  }
  return context;
}
