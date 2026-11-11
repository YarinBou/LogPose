"use client";

/**
 * The spoiler guard: the reader says how far they have read, and anything that needs a
 * later chapter is held back until they ask for it. The choice is kept in localStorage and
 * shared by every panel on the page (and by the 2D and 3D maps).
 */
import { useCallback, useSyncExternalStore } from "react";
import { SAGAS } from "@/data/timeline";

export interface SpoilerStep {
  label: string;
  /** Last chapter the reader has read. Infinity means "show everything". */
  chapter: number;
}

/** Last chapter of a saga, read from its final arc ("Ch. 96-100" -> 100). */
function lastChapter(chapters: string): number {
  if (chapters.includes("onward")) return Number.POSITIVE_INFINITY;
  const end = Number(chapters.replace("Ch. ", "").split("-").pop());
  return Number.isFinite(end) ? end : Number.POSITIVE_INFINITY;
}

export const SPOILER_STEPS: SpoilerStep[] = [
  { label: "Show everything", chapter: Number.POSITIVE_INFINITY },
  ...SAGAS.map((saga) => ({
    label: `Up to the end of the ${saga.name}`,
    chapter: lastChapter(saga.arcs[saga.arcs.length - 1].chapters),
  })).filter((step) => Number.isFinite(step.chapter)),
];

const STORAGE_KEY = "logpose:spoiler-limit";
const CHANGE_EVENT = "logpose:spoiler-limit-change";

function read(): number {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return Number.POSITIVE_INFINITY;
    const value = Number(stored);
    return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
  } catch {
    // Private browsing can refuse storage; the guard then simply stays off.
    return Number.POSITIVE_INFINITY;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The reader's limit and a setter. On the server, and before hydration, nothing is hidden. */
export function useSpoilerLimit(): [number, (chapter: number) => void] {
  const limit = useSyncExternalStore(subscribe, read, () => Number.POSITIVE_INFINITY);

  const setLimit = useCallback((chapter: number) => {
    try {
      if (Number.isFinite(chapter)) window.localStorage.setItem(STORAGE_KEY, String(chapter));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do: the choice just will not persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [limit, setLimit];
}
