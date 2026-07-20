import { cn } from "@/lib/utils";
import type { BloodGroup } from "@/types";

export interface BloodGroupChipProps {
  value: BloodGroup;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BloodGroupChip({
  value,
  selected = false,
  onClick,
  className,
}: BloodGroupChipProps) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-display text-sm font-semibold transition-all",
        onClick && "cursor-pointer active:scale-95",
        selected
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "border border-border bg-background text-foreground hover:bg-muted",
        // Sizes
        "h-10 w-10 shrink-0",
        className
      )}
    >
      {value}
    </Component>
  );
}
