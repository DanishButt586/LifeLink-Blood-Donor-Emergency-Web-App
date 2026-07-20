"use client";

import { motion } from "framer-motion";
import { Droplet } from "lucide-react";

const DROPLETS = [
  { left: "12%", top: "18%", size: 14, delay: 0 },
  { left: "28%", top: "62%", size: 20, delay: 0.9 },
  { left: "48%", top: "12%", size: 12, delay: 1.8 },
  { left: "68%", top: "58%", size: 18, delay: 0.4 },
  { left: "85%", top: "24%", size: 14, delay: 1.3 },
];

/**
 * Tasteful hero decoration: an ECG-style pulse line that redraws itself on a
 * loop, layered with a soft ping and a handful of slow-floating droplets.
 */
export function PulseHeartAnimation() {
  return (
    <div
      className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <span className="absolute h-28 w-28 rounded-full bg-primary/20 animate-pulse-ring" />
      <span
        className="absolute h-28 w-28 rounded-full bg-primary/10 animate-pulse-ring"
        style={{ animationDelay: "1.1s" }}
      />

      <svg viewBox="0 0 300 80" className="relative z-10 w-full text-primary" fill="none">
        <motion.path
          d="M0 40 H90 L105 10 L120 70 L135 40 H180 L195 15 L210 65 L225 40 H300"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 0.6,
          }}
        />
      </svg>

      {DROPLETS.map((droplet, index) => (
        <Droplet
          key={index}
          className="absolute animate-float fill-primary/20 text-primary/40"
          style={{
            left: droplet.left,
            top: droplet.top,
            width: droplet.size,
            height: droplet.size,
            animationDelay: `${droplet.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
