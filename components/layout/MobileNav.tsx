"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthNavSection } from "@/components/layout/AuthNavSection";

export interface NavLink {
  href: string;
  label: string;
}

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 15 },
  visible: { opacity: 1, x: 0 },
};

export function MobileNav({ isOpen, onClose, navLinks }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Opaque Side Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[101] flex h-full h-[100dvh] w-80 max-w-[85vw] flex-col justify-between border-l border-border bg-background bg-card p-6 shadow-2xl md:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div>
              {/* Drawer Header */}
              <div className="mb-6 flex items-center justify-between pb-4 border-b border-border">
                <Link href="/" onClick={onClose} className="flex items-center gap-2">
                  <Droplets className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span className="font-display text-lg font-bold text-foreground">
                    LifeLink
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav Links */}
              <motion.nav
                initial="hidden"
                animate="visible"
                variants={listVariants}
                className="flex flex-col gap-1.5"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-colors active:scale-[0.98]",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>
            </div>

            {/* Bottom Auth Section */}
            <div className="mt-8 border-t border-border pt-6">
              <AuthNavSection variant="stack" onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
