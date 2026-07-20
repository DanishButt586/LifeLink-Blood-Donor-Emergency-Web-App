"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, AlertTriangle, CheckCircle2, MapPin, Activity, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { LiveEyebrow } from "@/components/shared/LiveEyebrow";
import { BloodDropWatermark } from "@/components/shared/BloodDropWatermark";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BloodGroup } from "@/types";

export default function DashboardPage() {
  // Total stats states
  
  const [totalDonors, setTotalDonors] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [fulfilledRequests, setFulfilledRequests] = useState(0);

  const [bgCounts, setBgCounts] = useState<Record<BloodGroup, number>>({
    "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
  });
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      try {
        const [donorsRes, requestsRes, fulfilledRes] = await Promise.all([
          supabase.from("donors").select("*, profile:profiles(city)"),
          supabase.from("emergency_requests").select("id"),
          supabase.from("emergency_requests").select("id").eq("status", "fulfilled")
        ]);

        if (donorsRes.error) throw donorsRes.error;
        if (requestsRes.error) throw requestsRes.error;
        if (fulfilledRes.error) throw fulfilledRes.error;

        const donors = donorsRes.data || [];
        setTotalDonors(donors.length);
        setTotalRequests(requestsRes.data?.length || 0);
        setFulfilledRequests(fulfilledRes.data?.length || 0);

        // Compute distributions in memory
        const tempBgs: Record<BloodGroup, number> = {
          "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
        };
        const tempCities: Record<string, number> = {};

        donors.forEach((donor: any) => {
          if (donor.blood_group) {
            tempBgs[donor.blood_group as BloodGroup] = (tempBgs[donor.blood_group as BloodGroup] || 0) + 1;
          }
          const city = donor.profile?.city;
          if (city) {
            tempCities[city] = (tempCities[city] || 0) + 1;
          }
        });

        setBgCounts(tempBgs);
        setCityCounts(tempCities);
      } catch (err: any) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const maxDonorCount = Math.max(...Object.values(bgCounts), 1);
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const maxCityCount = sortedCities.length > 0 ? sortedCities[0][1] : 1;

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: "Total Registered Donors",
      value: totalDonors,
      suffix: "heroes",
      icon: Users,
      accent: "primary" as const,
    },
    {
      label: "Active Emergency Requests",
      value: totalRequests,
      suffix: "alerts",
      icon: AlertTriangle,
      accent: "warning" as const,
    },
    {
      label: "Successful Fulfillments",
      value: fulfilledRequests,
      suffix: "saved",
      icon: CheckCircle2,
      accent: "secondary" as const,
    },
  ];

  const accentClasses = {
    primary: { bar: "bg-primary", chip: "bg-primary/10 text-primary" },
    warning: { bar: "bg-warning", chip: "bg-warning/10 text-warning" },
    secondary: { bar: "bg-secondary", chip: "bg-secondary/10 text-secondary" },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center sm:text-left">
        <LiveEyebrow label="Live Insights" />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Network Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time statistics of the Pakistan Blood Donor Network.
        </p>
      </div>

      {/* Headline Stats Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-3">
        {STAT_CARDS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            whileHover={{ y: -3 }}
          >
            <Card className="border-border/60 shadow-sm relative overflow-hidden bg-card/50 backdrop-blur-sm transition-shadow hover:shadow-lg">
              <div className={cn("absolute top-0 left-0 w-1.5 h-full", accentClasses[stat.accent].bar)} />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    {stat.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <AnimatedCounter
                      value={stat.value}
                      className="font-display text-4xl font-extrabold text-foreground"
                    />
                    <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-xl", accentClasses[stat.accent].chip)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Distribution Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Blood Group Distribution Card */}
        <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Blood Group Distribution
            </CardTitle>
            <CardDescription>
              Registered donor counts categorized by blood group.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3.5">
              {(Object.entries(bgCounts) as [BloodGroup, number][]).map(([bg, count], index) => {
                const percentage = (count / maxDonorCount) * 100;
                return (
                  <div key={bg} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold font-display text-foreground bg-primary/10 h-7 w-7 rounded-full flex items-center justify-center text-xs">
                        {bg}
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        {count > 0 ? `${count} ${count === 1 ? "donor" : "donors"}` : "No donors yet"}
                      </span>
                    </div>
                    <div
                      className="h-3 w-full rounded-full bg-muted overflow-hidden border border-border/40"
                      title={`${count} ${count === 1 ? "donor" : "donors"}`}
                    >
                      {count > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* City Breakdown Card */}
        <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary" />
              City-wise Coverage
            </CardTitle>
            <CardDescription>
              Donor count distribution across cities in Pakistan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {sortedCities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                No city data available.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCities.map(([cityName, count], index) => {
                  const percentage = (count / maxCityCount) * 100;
                  return (
                    <div key={cityName} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {cityName}
                        </span>
                        <span className="font-semibold text-muted-foreground">
                          {count} {count === 1 ? "donor" : "donors"}
                        </span>
                      </div>
                      <div
                        className="h-3.5 w-full rounded-full bg-muted overflow-hidden border border-border/40"
                        title={`${count} ${count === 1 ? "donor" : "donors"}`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.7, delay: index * 0.05, ease: "easeOut" }}
                          className="h-full bg-secondary rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hero-style Community Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-secondary/20 bg-secondary/5 relative overflow-hidden shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-mesh" aria-hidden="true" />
          <BloodDropWatermark className="-right-16 -top-20 rotate-12 scale-[0.6]" />
          <CardContent className="relative p-8 text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
              <Heart className="h-6 w-6 fill-current animate-pulse" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Save Lives. Join the Network.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your blood group can be the difference between life and death for someone in a critical emergency today.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/donors/register" className={buttonVariants("primary", "md")}>
                Register as Donor
              </Link>
              <Link href="/requests" className={buttonVariants("ghost", "md", "border border-border bg-background")}>
                View Live Requests
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
