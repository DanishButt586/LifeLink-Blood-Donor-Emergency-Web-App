"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroup } from "@/types";

export interface BloodGroupSelectorProps {
  value: BloodGroup | null;
  onChange: (value: BloodGroup | null) => void;
  /** Show a leading "All" chip that clears the selection — for filter bars. */
  includeAllOption?: boolean;
  className?: string;
}

export function BloodGroupSelector({
  value,
  onChange,
  includeAllOption = false,
  className,
}: BloodGroupSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group">
      {includeAllOption && (
        <motion.button
          type="button"
          animate={{ scale: value === null ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            value === null
              ? "border-secondary bg-secondary text-secondary-foreground shadow-sm shadow-secondary/20"
              : "border-border bg-background text-foreground hover:border-secondary/40 hover:bg-secondary/5",
          )}
        >
          All
        </motion.button>
      )}
      {BLOOD_GROUPS.map((group) => {
        const isSelected = value === group;
        return (
          <motion.button
            key={group}
            type="button"
            animate={{ scale: isSelected ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(isSelected && !includeAllOption ? null : group)}
            aria-pressed={isSelected}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {group}
          </motion.button>
        );
      })}
    </div>
  );
}
