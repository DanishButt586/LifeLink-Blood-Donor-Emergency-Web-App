import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

/** Faint recurring brand motif — a giant droplet outline used as a background watermark. */
export function BloodDropWatermark({ className }: { className?: string }) {
  return (
    <Droplet
      className={cn(
        "pointer-events-none absolute text-primary/[0.05] dark:text-primary/[0.09]",
        className,
      )}
      style={{ width: "min(55vw, 560px)", height: "min(55vw, 560px)" }}
      strokeWidth={0.75}
      aria-hidden="true"
    />
  );
}
