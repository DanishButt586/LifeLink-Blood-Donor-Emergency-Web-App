"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "donor", label: "Donate blood" },
  { value: "requester", label: "Request blood" },
  { value: "both", label: "Both" },
];

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("03");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [role, setRole] = useState<UserRole>("donor");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Dynamic real-time validation computed states
  const nameError = fullName.length > 0 && (
    fullName.trim().length < 3
      ? "Name must be at least 3 characters"
      : !/^[A-Za-z\s]+$/.test(fullName)
      ? "Name can only contain letters and spaces"
      : null
  );

  const emailError = email.length > 0 && (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Invalid email address"
      : null
  );

  const phoneError = phone.length > 2 && phone.length < 11
    ? "Phone number must be exactly 11 digits"
    : null;

  const confirmPasswordError = confirmPassword.length > 0 && (
    password !== confirmPassword
      ? "Passwords do not match"
      : null
  );

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let val = event.target.value;

    // Reset to base prefix if cleared
    if (val.length < 2) {
      setPhone("03");
      return;
    }

    // Force "03" starting prefix
    if (!val.startsWith("03")) {
      val = "03" + val.replace(/\D/g, "");
    }

    // Clean suffix to contain only digits, max 9 characters
    const digits = val.slice(2).replace(/\D/g, "");
    const truncated = digits.slice(0, 9);

    setPhone("03" + truncated);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setPasswordError(null);

    // Validate inputs before submitting
    if (fullName.trim().length < 3 || !/^[A-Za-z\s]+$/.test(fullName)) {
      setFormError("Please enter a valid full name (letters only, min 3 chars).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (phone.length !== 11) {
      setFormError("Phone number must be exactly 11 digits (e.g. 03xxxxxxxxx).");
      return;
    }
    if (!city) {
      setFormError("Please select a city.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords must match.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setPasswordError("Password must meet all requirement checks.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          city: city || null,
          area: area || null,
          role,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(
        error.message.toLowerCase().includes("already registered")
          ? "That email is already in use — try logging in instead."
          : error.message,
      );
      return;
    }

    if (data.session) {
      showToast({
        title: "Account created!",
        description: "Welcome to LifeLink.",
        variant: "success",
      });
      router.push("/donors/register");
      router.refresh();
      return;
    }

    showToast({
      title: "Check your inbox",
      description: "Confirm your email address, then log in to continue.",
      variant: "info",
    });
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Droplets className="h-8 w-8 text-primary" aria-hidden="true" />
          <span className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-primary">
            Get Started
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join the network — as a donor or someone who needs one.
          </p>
        </div>

        <Card>
          <form className="space-y-4 p-6" onSubmit={handleSubmit}>
            <Input
              label="Full name"
              type="text"
              placeholder="Ayesha Khan"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              error={nameError || undefined}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              error={emailError || undefined}
              required
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="03xxxxxxxxx"
              value={phone}
              onChange={handlePhoneChange}
              autoComplete="tel"
              error={phoneError || undefined}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="City"
                value={city}
                onChange={(event) => setCity(event.target.value)}
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

            <div>
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                I want to
              </span>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      role === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <div className="mt-2.5 rounded-lg border border-border/60 bg-muted/5 p-3 space-y-2">
                <div className="text-xs font-medium text-foreground/80">
                  Password requirements:
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div
                    className={cn(
                      "flex items-center gap-2 transition-all duration-300",
                      hasUppercase
                        ? "text-success font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 text-[10px]",
                        hasUppercase
                          ? "border-success/30 bg-success/15 text-success scale-105"
                          : "border-border bg-muted/20 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span>Capital letter (A-Z)</span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 transition-all duration-300",
                      hasLowercase
                        ? "text-success font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 text-[10px]",
                        hasLowercase
                          ? "border-success/30 bg-success/15 text-success scale-105"
                          : "border-border bg-muted/20 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span>Lowercase letter (a-z)</span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 transition-all duration-300",
                      hasNumber
                        ? "text-success font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 text-[10px]",
                        hasNumber
                          ? "border-success/30 bg-success/15 text-success scale-105"
                          : "border-border bg-muted/20 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span>Number (0-9)</span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 transition-all duration-300",
                      hasSpecial
                        ? "text-success font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 text-[10px]",
                        hasSpecial
                          ? "border-success/30 bg-success/15 text-success scale-105"
                          : "border-border bg-muted/20 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span>Special character (@,#)</span>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              error={confirmPasswordError || passwordError || undefined}
              required
            />

            {formError && <p className="text-sm text-danger">{formError}</p>}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
