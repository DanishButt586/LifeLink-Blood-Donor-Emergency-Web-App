import Link from "next/link";
import { Droplets, ShieldCheck, Lock, HeartHandshake } from "lucide-react";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/donors", label: "Find Donors" },
  { href: "/requests", label: "Emergency Requests" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Ask LifeLink" },
];

const DONOR_LINKS = [
  { href: "/donors/register", label: "Register as Donor" },
  { href: "/requests", label: "View Emergency Board" },
  { href: "/chat", label: "Eligibility Guide" },
];

const REQUESTER_LINKS = [
  { href: "/requests/new", label: "Post a Request" },
  { href: "/donors", label: "Browse Donors" },
  { href: "/requests/my", label: "Manage My Requests" },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified city-based matching" },
  { icon: Lock, label: "Privacy-first contact sharing" },
  { icon: HeartHandshake, label: "Free & community-driven" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-display text-lg font-bold text-foreground">
                LifeLink
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Connecting donors with those who need them, faster.
            </p>

          </div>

          {/* Column 2 — quick links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — donors vs requesters */}
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                For Donors
              </h3>
              <ul className="mt-4 space-y-3">
                {DONOR_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                For Requesters
              </h3>
              <ul className="mt-4 space-y-3">
                {REQUESTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4 — trust strip */}
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Why LifeLink
            </h3>
            <ul className="mt-4 space-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point.label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <point.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted-foreground">{point.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Heartbeat-line divider */}
        <svg
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          className="mt-12 h-5 w-full text-border"
          aria-hidden="true"
        >
          <path
            d="M0 12 H480 L510 2 L540 22 L570 12 H700 L730 2 L760 22 L790 12 H1200"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LifeLink. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">Made with care in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
