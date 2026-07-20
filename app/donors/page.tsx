"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX, Lock, Filter } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { buttonVariants } from "@/components/ui/Button";
import { BloodGroupSelector } from "@/components/shared/BloodGroupSelector";
import { DonorCard } from "@/components/shared/DonorCard";
import { DonorCardSkeleton } from "@/components/shared/DonorCardSkeleton";
import { LiveEyebrow } from "@/components/shared/LiveEyebrow";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PAKISTAN_CITIES } from "@/lib/constants";
import type { BloodGroup, DonorWithProfile } from "@/types";

export default function DonorsPage() {
  const { user, loading: authLoading } = useAuth();

  const [donors, setDonors] = useState<DonorWithProfile[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [city, setCity] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadDonors() {
      const supabase = createClient();
      const { data } = await supabase
        .from("donors")
        .select("*, profile:profiles(full_name, city, area, phone)")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setDonors((data as DonorWithProfile[] | null) ?? []);
        setIsLoading(false);
      }
    }

    loadDonors();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredDonors = useMemo(() => {
    if (!donors) return [];
    return donors.filter((donor) => {
      if (bloodGroup && donor.blood_group !== bloodGroup) return false;
      if (city && donor.profile.city !== city) return false;
      if (availableOnly && !donor.is_available) return false;
      return true;
    });
  }, [donors, bloodGroup, city, availableOnly]);

  const showLoginPrompt = !authLoading && !user;
  const showSkeletons = !showLoginPrompt && isLoading;
  const showEmptyState = !showLoginPrompt && !isLoading && filteredDonors.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <LiveEyebrow label="Live Network" />
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Find Donors
          </h1>
          <p className="mt-2 text-muted-foreground">
            Search verified donors near you, filtered by blood group and city.
          </p>
        </div>

        <div className="mb-8 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              Blood Group
            </span>
            <BloodGroupSelector value={bloodGroup} onChange={setBloodGroup} includeAllOption />
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="sm:max-w-xs"
              aria-label="Filter by city"
            >
              <option value="">All cities</option>
              {PAKISTAN_CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </Select>
            <Switch
              checked={availableOnly}
              onCheckedChange={setAvailableOnly}
              label="Available only"
            />
          </div>
        </div>

        {showLoginPrompt && <LoginPrompt />}

        {showSkeletons && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <DonorCardSkeleton key={index} />
            ))}
          </div>
        )}

        {showEmptyState && <EmptyState hasAnyDonors={(donors?.length ?? 0) > 0} />}

        {!showLoginPrompt && !showSkeletons && filteredDonors.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDonors.map((donor, index) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (index % 9) * 0.05 }}
              >
                <DonorCard donor={donor} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LoginPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Log in to see donors
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Donor details are only visible to logged-in members of the network — it keeps
        everyone&apos;s contact info safe.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/login" className={buttonVariants("primary", "md")}>
          Log In
        </Link>
        <Link href="/signup" className={buttonVariants("ghost", "md")}>
          Sign Up
        </Link>
      </div>
    </motion.div>
  );
}

function EmptyState({ hasAnyDonors }: { hasAnyDonors: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        {hasAnyDonors ? "No donors match your filters" : "No donors registered yet"}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasAnyDonors
          ? "Try a different blood group or city, or turn off the availability filter."
          : "Be the first to register and help build the network."}
      </p>
      {!hasAnyDonors && (
        <Link href="/donors/register" className={buttonVariants("ghost", "md", "mt-6 border border-primary/30 text-primary hover:bg-primary/5")}>
          Register as Donor
        </Link>
      )}
    </motion.div>
  );
}
