import { DoskoiPandaMark } from "@/components/art/Sprites";

/** Route-level loading screen: the Doskoi Panda badge, turning slowly. */
export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-ocean-950 text-parchment-100" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <DoskoiPandaMark className="animate-spin-slow h-20 w-20" />
        <p className="font-display text-2xl">Waiting for the Log Pose to set</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold-300">Doskoi Panda</p>
      </div>
    </div>
  );
}
