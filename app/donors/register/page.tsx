"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BloodGroupSelector } from "@/components/shared/BloodGroupSelector";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { cn, monthsSince } from "@/lib/utils";
import { PAKISTAN_CITIES } from "@/lib/constants";
import type { BloodGroup, Donor } from "@/types";

interface FormErrors {
  bloodGroup?: string;
  age?: string;
  weight?: string;
  city?: string;
}

function validate(values: {
  bloodGroup: BloodGroup | null;
  age: string;
  weight: string;
  city: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!values.bloodGroup) {
    errors.bloodGroup = "Select your blood group.";
  }

  const ageNum = Number(values.age);
  if (!values.age || Number.isNaN(ageNum)) {
    errors.age = "Enter your age.";
  } else if (ageNum < 18 || ageNum > 65) {
    errors.age = "Donors must be between 18 and 65 years old.";
  }

  if (values.weight) {
    const weightNum = Number(values.weight);
    if (Number.isNaN(weightNum) || weightNum < 50) {
      errors.weight = "Weight must be at least 50kg to donate safely.";
    }
  }

  if (!values.city) {
    errors.city = "Select your city.";
  }

  return errors;
}

function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute h-24 w-24 rounded-full bg-secondary/15"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-secondary"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
            <motion.path
              d="M4 12.5L9.5 18L20 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

export default function DonorRegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [donorLoading, setDonorLoading] = useState(true);
  const [hasExistingDonor, setHasExistingDonor] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [profileSeeded, setProfileSeeded] = useState(false);

  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [medicalNotes, setMedicalNotes] = useState("");

  // Redirect anonymous visitors to log in first.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Load an existing donor row (if any) to switch into edit mode and prefill the form.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadDonor() {
      const supabase = createClient();
      const { data } = await supabase
        .from("donors")
        .select("*")
        .eq("profile_id", user!.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        const donor = data as Donor;
        setHasExistingDonor(true);
        setBloodGroup(donor.blood_group);
        setLastDonationDate(donor.last_donation_date ?? "");
        setAge(String(donor.age));
        setWeight(donor.weight_kg != null ? String(donor.weight_kg) : "");
        setIsAvailable(donor.is_available);
        setMedicalNotes(donor.medical_notes ?? "");
      }
      setDonorLoading(false);
    }

    loadDonor();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Prefill city/area from the profile the first time it becomes available,
  // without re-seeding on every profile refresh (e.g. after saving the form).
  if (profile && !profileSeeded) {
    setProfileSeeded(true);
    if (profile.city) setCity(profile.city);
    if (profile.area) setArea(profile.area);
  }

  const showRecentDonationWarning =
    lastDonationDate.length > 0 && monthsSince(lastDonationDate) < 3;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const errors = validate({ bloodGroup, age, weight, city });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const [{ error: profileError }, { error: donorError }] = await Promise.all([
      supabase.from("profiles").update({ city, area: area || null }).eq("id", user.id),
      supabase.from("donors").upsert(
        {
          profile_id: user.id,
          blood_group: bloodGroup,
          last_donation_date: lastDonationDate || null,
          is_available: isAvailable,
          age: Number(age),
          weight_kg: weight ? Number(weight) : null,
          medical_notes: medicalNotes || null,
        },
        { onConflict: "profile_id" },
      ),
    ]);

    setIsSubmitting(false);

    if (profileError || donorError) {
      showToast({
        title: "Something went wrong",
        description: (profileError ?? donorError)?.message ?? "Please try again.",
        variant: "danger",
      });
      return;
    }

    await refreshProfile();
    setHasExistingDonor(true);
    setJustSubmitted(true);
  }

  if (authLoading || !user || donorLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  if (justSubmitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <SuccessAnimation />
        <h1 className="font-display text-2xl font-bold text-foreground">
          You&apos;re on the list!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for registering as a donor. We&apos;ll reach out when someone nearby
          needs your blood type.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/donors" className={buttonVariants("primary", "md")}>
            View Donor List
          </Link>
          <button
            type="button"
            onClick={() => setJustSubmitted(false)}
            className={buttonVariants("ghost", "md")}
          >
            Edit Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-8 text-center">
          <Droplet className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <span className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-primary">
            Join The Network
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {hasExistingDonor ? "Edit Your Donor Profile" : "Register as a Donor"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {hasExistingDonor
              ? "Keep your details up to date so we can match you accurately."
              : "Takes less than two minutes. Your details stay private until someone needs you."}
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Blood group
                </span>
                <BloodGroupSelector value={bloodGroup} onChange={setBloodGroup} />
                {fieldErrors.bloodGroup && (
                  <p className="mt-1.5 text-sm text-danger">{fieldErrors.bloodGroup}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={65}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  error={fieldErrors.age}
                  required
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  inputMode="decimal"
                  placeholder="Optional"
                  min={0}
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  error={fieldErrors.weight}
                />
              </div>

              <div>
                <Input
                  label="Last donation date"
                  type="date"
                  value={lastDonationDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setLastDonationDate(event.target.value)}
                />
                {showRecentDonationWarning && (
                  <p className="mt-1.5 text-sm text-warning" role="status">
                    Heads up — it&apos;s been less than 3 months since your last donation.
                    You can still register, but you may not be eligible to donate again
                    yet.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="City"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  error={fieldErrors.city}
                >
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Area"
                  type="text"
                  placeholder="Optional"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                />
              </div>

              <Textarea
                label="Medical notes"
                placeholder="Any self-reported conditions we should know about (optional)"
                value={medicalNotes}
                onChange={(event) => setMedicalNotes(event.target.value)}
              />

              <div
                className={cn(
                  "rounded-lg border border-border p-4",
                  isAvailable ? "bg-secondary/5" : "bg-muted",
                )}
              >
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  label="Currently available to donate"
                  description="Toggle off if you're temporarily unable to donate."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving…"
                  : hasExistingDonor
                    ? "Save Changes"
                    : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
