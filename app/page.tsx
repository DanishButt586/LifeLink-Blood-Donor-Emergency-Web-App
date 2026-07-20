"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, Search, HeartPulse, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { PulseHeartAnimation } from "@/components/shared/PulseHeartAnimation";
import { BloodDropWatermark } from "@/components/shared/BloodDropWatermark";
import { createClient } from "@/lib/supabase/client";


const STEPS = [
  {
    icon: UserPlus,
    title: "Register as a Donor",
    description:
      "Sign up in minutes with your blood group, city, and contact details. Your profile stays private until someone needs you.",
  },
  {
    icon: Search,
    title: "Get Matched Instantly",
    description:
      "When an emergency request goes out, our network finds compatible, nearby donors in seconds — no scrolling through group chats.",
  },
  {
    icon: HeartPulse,
    title: "Respond & Save a Life",
    description:
      "Accept the request, coordinate with the hospital, and donate. You'll always know the impact your donation made.",
  },
];

const STATS = [
  { value: 500, suffix: "+", label: "Registered Donors" },
  { value: 120, suffix: "+", label: "Lives Helped" },
  { value: 15, suffix: "", label: "Cities Covered" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [donorsCount, setDonorsCount] = useState(0);
  const [livesSavedCount, setLivesSavedCount] = useState(0);
  const [citiesCount, setCitiesCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      const supabase = createClient();
      try {
        const [donorsRes, fulfilledRes, profilesRes] = await Promise.all([
          supabase.from("donors").select("id", { count: "exact", head: true }),
          supabase.from("emergency_requests").select("id", { count: "exact", head: true }).eq("status", "fulfilled"),
          supabase.from("profiles").select("city")
        ]);

        if (donorsRes.count !== null) setDonorsCount(donorsRes.count);
        if (fulfilledRes.count !== null) setLivesSavedCount(fulfilledRes.count);
        
        if (profilesRes.data) {
          const uniqueCities = new Set(profilesRes.data.map((p: any) => p.city).filter(Boolean));
          setCitiesCount(uniqueCities.size);
        }
      } catch (err) {
        console.error("Error loading landing page stats:", err);
      }
    }
    fetchCounts();
  }, []);

  const dynamicStats = [
    { value: donorsCount || 500, suffix: "+", label: "Registered Donors" },
    { value: livesSavedCount || 120, suffix: "+", label: "Lives Helped" },
    { value: citiesCount || 15, suffix: "", label: "Cities Covered" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              Trusted by donors across Pakistan
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Every drop finds
              <span className="text-primary"> the right person.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              LifeLink connects verified blood donors with patients in urgent need —
              instantly, safely, and free. When every minute counts, we help you find
              help nearby.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/donors/register" className={buttonVariants("primary", "lg")}>
                Register as Donor
              </Link>
              <Link
                href="/requests/new"
                className={buttonVariants(
                  "ghost",
                  "lg",
                  "border-2 border-primary/30 text-primary hover:bg-primary/5",
                )}
              >
                Need Blood Urgently?
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <PulseHeartAnimation />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden border-t border-border bg-card">
        <BloodDropWatermark className="-right-24 top-1/2 -translate-y-1/2 rotate-12" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
              The Process
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              How LifeLink works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps stand between someone in need and the donor who can
              help them.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative rounded-2xl border border-border bg-background p-6"
              >
                <span className="font-display text-sm font-bold text-primary/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative overflow-hidden border-t border-border bg-primary text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 30%, rgba(255,255,255,0.18) 0px, transparent 55%), radial-gradient(at 80% 80%, rgba(255,255,255,0.12) 0px, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
            {dynamicStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="font-display text-4xl font-extrabold sm:text-5xl"
                />
                <p className="mt-2 text-sm font-medium text-primary-foreground/80">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
            Take Action
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Someone nearby needs your blood type right now.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join the network today. It takes less than five minutes and could save a
            life this week.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/donors/register" className={buttonVariants("primary", "lg")}>
              Register as Donor
            </Link>
            <Link href="/donors" className={buttonVariants("secondary", "lg")}>
              Browse Donors
            </Link>
          </div>
        </motion.div>
        </div>
      </section>
    </div>
  );
}
