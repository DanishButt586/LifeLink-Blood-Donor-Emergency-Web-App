"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["bg-primary", "bg-secondary", "bg-warning"];

/** One-shot particle burst for celebratory moments — mount it fresh each time to replay. */
export function ConfettiBurst({ count = 18 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 80 + Math.random() * 70;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: Math.random() * 360,
          delay: Math.random() * 0.15,
          color: COLORS[i % COLORS.length],
          isCircle: i % 2 === 0,
        };
      }),
    [count],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className={cnSize(p.isCircle) + " absolute " + p.color}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.4 }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function cnSize(isCircle: boolean) {
  return isCircle ? "h-2 w-2 rounded-full" : "h-2.5 w-1.5 rounded-sm";
}
