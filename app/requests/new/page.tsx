"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, Minus, MapPin, Users, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BloodGroupSelector } from "@/components/shared/BloodGroupSelector";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { findMatchingDonors } from "@/lib/matching";
import type { BloodGroup, UrgencyLevel, DonorWithProfile, EmergencyRequest } from "@/types";
import { cn } from "@/lib/utils";

interface FormErrors {
  bloodGroup?: string;
  hospitalName?: string;
  city?: string;
  contactPhone?: string;
  urgency?: string;
}

function validate(values: {
  bloodGroup: BloodGroup | null;
  hospitalName: string;
  city: string;
  contactPhone: string;
  urgency: UrgencyLevel;
}): FormErrors {
  const errors: FormErrors = {};

  if (!values.bloodGroup) {
    errors.bloodGroup = "Select the blood group needed.";
  }
  if (!values.hospitalName.trim()) {
    errors.hospitalName = "Enter the hospital name.";
  }
  if (!values.city) {
    errors.city = "Select the city.";
  }
  if (!values.contactPhone.trim()) {
    errors.contactPhone = "Enter the contact phone number.";
  } else if (!/^\+?[0-9\s-]{10,15}$/.test(values.contactPhone.trim())) {
    errors.contactPhone = "Enter a valid phone number (e.g. 03001234567).";
  }
  if (!values.urgency) {
    errors.urgency = "Select the urgency level.";
  }

  return errors;
}

export default function NewRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  
  // Form fields
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospitalName, setHospitalName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("urgent");
  const [contactPhone, setContactPhone] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Post-submit matching preview state
  const [showSuccess, setShowSuccess] = useState(false);
  const [matchingDonors, setMatchingDonors] = useState<DonorWithProfile[]>([]);
  const [createdRequest, setCreatedRequest] = useState<EmergencyRequest | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Autofill requester contact phone from profile if available
  useEffect(() => {
    if (profile?.phone) {
      setContactPhone(profile.phone);
    }
    if (profile?.city) {
      setCity(profile.city);
    }
    if (profile?.area) {
      setArea(profile.area);
    }
  }, [profile]);

  const handleDecrement = () => setUnitsNeeded((prev) => Math.max(1, prev - 1));
  const handleIncrement = () => setUnitsNeeded((prev) => prev + 1);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const errors = validate({ bloodGroup, hospitalName, city, contactPhone, urgency });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // 1. Create the emergency request
      const { data: requestData, error: requestError } = await supabase
        .from("emergency_requests")
        .insert({
          requester_profile_id: user.id,
          patient_name: patientName.trim() || null,
          blood_group: bloodGroup,
          units_needed: unitsNeeded,
          hospital_name: hospitalName.trim(),
          city,
          area: area.trim() || null,
          urgency,
          contact_phone: contactPhone.trim(),
          status: "open",
          additional_notes: additionalNotes.trim() || null,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Fetch active compatible donors in the city for the matching logic
      const { data: donorsData, error: donorsError } = await supabase
        .from("donors")
        .select("*, profile:profiles(full_name, city, area, phone)")
        .eq("is_available", true);

      if (donorsError) throw donorsError;

      // 3. Filter and sort matched donors locally
      const matched = findMatchingDonors(
        {
          blood_group: bloodGroup!,
          city,
          area: area.trim() || null,
        },
        (donorsData as DonorWithProfile[]) || []
      );

      setMatchingDonors(matched);
      setCreatedRequest(requestData as EmergencyRequest);
      setShowSuccess(true);
      showToast({
        title: "Request Live",
        description: "Your emergency request has been published.",
        variant: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Request Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  // Success view with matching donors
  if (showSuccess && createdRequest) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Heart className="h-8 w-8 animate-pulse fill-current" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
              Your Request is Live
            </h1>
            <p className="mt-2 text-muted-foreground">
              Compatible donors in {city} have been identified on the network.
            </p>
          </div>

          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-secondary-foreground">
                Matches are immediately notified on their dashboard and email.
              </p>
              <p className="text-xs text-muted-foreground">
                To protect donor privacy, contact phone numbers will be shown in your requests management tab only after they confirm they can help.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Matching Donors ({matchingDonors.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                Sorted by proximity (area match)
              </span>
            </div>

            {matchingDonors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No matches found in your area yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Our network is growing. Your request will remain live for nearby donors to view and respond to.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {matchingDonors.slice(0, 5).map((donor) => {
                  const isAreaMatch = donor.profile.area?.trim().toLowerCase() === area.trim().toLowerCase();
                  return (
                    <motion.div
                      key={donor.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-4 bg-card shadow-sm transition-all",
                        isAreaMatch ? "border-secondary/35 bg-secondary/5" : "border-border"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {donor.profile.full_name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {donor.profile.area || "Area unspecified"}, {donor.profile.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAreaMatch && (
                          <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-semibold text-secondary">
                            Nearby Match
                          </span>
                        )}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                          {donor.blood_group}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {matchingDonors.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground">
                    + {matchingDonors.length - 5} more matching donors in your city.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row pt-4">
            <Link href="/requests" className={cn(buttonVariants("primary", "lg"), "flex-1")}>
              View Emergency Board
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
                setPatientName("");
                setBloodGroup(null);
                setUnitsNeeded(1);
                setHospitalName("");
                setAdditionalNotes("");
                setCreatedRequest(null);
              }}
              className={cn(buttonVariants("ghost", "lg"), "border border-border")}
            >
              Post Another Request
            </button>
          </div>
        </motion.div>
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
          <AlertTriangle className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <span className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-primary">
            Urgent Care
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Request Blood Urgently
          </h1>
          <p className="mt-2 text-muted-foreground">
            Publish an emergency request to match and notify compatible donors instantly.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Blood group needed */}
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Blood Group Needed <span className="text-danger">*</span>
                </span>
                <BloodGroupSelector value={bloodGroup} onChange={setBloodGroup} />
                {fieldErrors.bloodGroup && (
                  <p className="mt-1.5 text-sm text-danger">{fieldErrors.bloodGroup}</p>
                )}
              </div>

              {/* Patient Name */}
              <Input
                label="Patient Name (Optional)"
                placeholder="Name of patient or relative (to show on request card)"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
              />

              {/* Units needed stepper */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Units Needed <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                    disabled={unitsNeeded <= 1}
                    aria-label="Decrease units"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-semibold" aria-live="polite">
                    {unitsNeeded}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
                    aria-label="Increase units"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">Unit(s) of 250ml/bag</span>
                </div>
              </div>

              {/* Hospital Name */}
              <Input
                label="Hospital Name & Branch *"
                placeholder="e.g. Aga Khan University Hospital, Stadium Road"
                value={hospitalName}
                onChange={(event) => setHospitalName(event.target.value)}
                error={fieldErrors.hospitalName}
                required
              />

              {/* City + Area */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="City *"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  error={fieldErrors.city}
                  required
                >
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Area / Neighborhood"
                  placeholder="e.g. Clifton, Gulshan-e-Iqbal"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                />
              </div>

              {/* Urgency Level */}
              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Urgency Level <span className="text-danger">*</span>
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(["critical", "urgent", "planned"] as UrgencyLevel[]).map((level) => {
                    const isSelected = urgency === level;
                    const borderColors = {
                      critical: "border-danger/40 bg-danger/5 text-danger shadow-sm shadow-danger/5",
                      urgent: "border-warning/40 bg-warning/5 text-warning shadow-sm shadow-warning/5",
                      planned: "border-primary/40 bg-primary/5 text-primary shadow-sm shadow-primary/5",
                    };
                    const hoverColors = {
                      critical: "hover:border-danger/50 hover:bg-danger/5 hover:text-danger",
                      urgent: "hover:border-warning/50 hover:bg-warning/5 hover:text-warning",
                      planned: "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                    };

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setUrgency(level)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border py-3 text-center transition-all",
                          isSelected
                            ? cn("border-2 font-semibold ring-2 ring-offset-2 ring-offset-background", 
                                 level === "critical" && "ring-danger/25", 
                                 level === "urgent" && "ring-warning/25", 
                                 level === "planned" && "ring-primary/25",
                                 borderColors[level])
                            : cn("border-border bg-background text-foreground", hoverColors[level])
                        )}
                        aria-pressed={isSelected}
                      >
                        <span className="text-sm capitalize">{level}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.urgency && (
                  <p className="mt-1.5 text-sm text-danger">{fieldErrors.urgency}</p>
                )}
              </div>

              {/* Contact Phone */}
              <Input
                label="Contact Phone Number *"
                placeholder="e.g. 03001234567"
                type="tel"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                error={fieldErrors.contactPhone}
                required
              />

              {/* Additional Notes */}
              <Textarea
                label="Additional Notes / Case Details"
                placeholder="Include patient's case details, bed number, contact person name, or any medical specifications (optional)"
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                rows={3}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Publishing Request..." : "Publish Emergency Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
