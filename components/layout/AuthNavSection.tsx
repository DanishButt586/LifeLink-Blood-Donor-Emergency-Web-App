"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface AuthNavSectionProps {
  variant?: "row" | "stack";
  onNavigate?: () => void;
  className?: string;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function AuthNavSection({
  variant = "row",
  onNavigate,
  className,
}: AuthNavSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        className={cn("h-9 w-9 animate-pulse rounded-full bg-muted", className)}
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    const isLoginActive = pathname === "/login";

    return (
      <div
        className={cn(
          variant === "row" ? "flex items-center gap-2" : "flex flex-col gap-2",
          className,
        )}
      >
        <Link
          href="/login"
          onClick={onNavigate}
          className={buttonVariants(
            isLoginActive ? "primary" : "ghost",
            variant === "row" ? "sm" : "md",
            variant === "stack" ? "w-full" : undefined,
          )}
        >
          Log In
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className={buttonVariants(
            isLoginActive ? "ghost" : "primary",
            variant === "row" ? "sm" : "md",
            variant === "stack" ? "w-full" : undefined,
          )}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email || "Account";

  if (variant === "stack") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(displayName)}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={buttonVariants("ghost", "md", "w-full justify-center gap-2")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        title={displayName}
      >
        {getInitials(displayName)}
      </span>
      <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">
        {displayName}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
