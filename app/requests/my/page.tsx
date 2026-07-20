"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Plus,
  ArrowLeft,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { BloodGroup, EmergencyRequest } from "@/types";
import { cn } from "@/lib/utils";

interface ResponseWithDonor {
  id: string;
  status: "offered" | "confirmed" | "declined";
  created_at: string;
  note: string | null;
  donor: {
    id: string;
    blood_group: BloodGroup;
    profile: {
      id: string;
      full_name: string;
      phone: string | null;
      city: string | null;
      area: string | null;
    };
  };
}

interface RequestWithResponses extends EmergencyRequest {
  responses?: ResponseWithDonor[];
}

export default function MyRequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [myRequests, setMyRequests] = useState<RequestWithResponses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Celebration overlay
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedRequest, setCelebratedRequest] = useState<EmergencyRequest | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const loadMyRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("emergency_requests_secure")
        .select(`
          *,
          responses:donation_responses(
            id,
            status,
            created_at,
            note,
            donor:donors(
              id,
              blood_group,
              profile:profiles_secure(
                id,
                full_name,
                phone,
                city,
                area
              )
            )
          )
        `)
        .eq("requester_profile_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyRequests(data as RequestWithResponses[]);
    } catch (err: any) {
      showToast({
        title: "Error loading requests",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) {
      loadMyRequests();
    }
  }, [user, loadMyRequests]);

  // Realtime update listener
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("my_requests_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_requests" },
        () => {
          loadMyRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMyRequests]);

  async function handleResponseStatus(responseId: string, status: "confirmed" | "declined") {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("donation_responses")
        .update({ status })
        .eq("id", responseId);

      if (error) throw error;

      showToast({
        title: `Response ${status}`,
        description: `You have ${status} the donor's response.`,
        variant: status === "confirmed" ? "success" : "info",
      });

      loadMyRequests();
    } catch (err: any) {
      showToast({
        title: "Action failed",
        description: err.message,
        variant: "danger",
      });
    }
  }

  async function handleFulfillRequest(request: EmergencyRequest) {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("emergency_requests")
        .update({ status: "fulfilled" })
        .eq("id", request.id);

      if (error) throw error;

      // Trigger Celebration Overlay
      setCelebratedRequest(request);
      setShowCelebration(true);

      showToast({
        title: "Request Fulfilled",
        description: "Thank you for updating. LifeLink network celebrates this saved life!",
        variant: "success",
      });

      loadMyRequests();
      
      setTimeout(() => {
        setShowCelebration(false);
        setCelebratedRequest(null);
      }, 5000);
    } catch (err: any) {
      showToast({
        title: "Action failed",
        description: err.message,
        variant: "danger",
      });
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && celebratedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full rounded-2xl border border-secondary/30 bg-card p-8 text-center shadow-2xl relative overflow-hidden"
            >
              <ConfettiBurst />

              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <Heart className="h-12 w-12 fill-current animate-pulse text-secondary" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground">
                Life Saved!
              </h2>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                Your emergency request for blood group <span className="font-bold text-primary">{celebratedRequest.blood_group}</span> has been marked as fulfilled.
              </p>
              <p className="mt-2 text-secondary font-medium text-sm flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4" />
                Thank you for coordinating this rescue!
              </p>
              <Button
                variant="primary"
                size="md"
                className="mt-8 w-full"
                onClick={() => {
                  setShowCelebration(false);
                  setCelebratedRequest(null);
                }}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex items-center gap-3">
        <Link href="/requests" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
            Your Requests
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground">
            Manage My Requests
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Track donation offers and connect securely with volunteers who responded to your requests.
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants("primary", "md"), "shrink-0")}>
          <Plus className="h-4 w-4" />
          Post New Request
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : myRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center bg-card">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/60 animate-pulse" />
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No requests posted yet</h3>
          <p className="mt-1 text-sm text-muted-foreground mb-6">
            If you need blood for a patient, post a request to notify donors.
          </p>
          <Link href="/requests/new" className={buttonVariants("primary", "md")}>
            Request Blood Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myRequests.map((request) => (
            <Card key={request.id} className="border-border overflow-hidden shadow-sm">
              <div className="bg-muted/10 p-5 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="primary" className="text-sm font-bold">
                      {request.blood_group}
                    </Badge>
                    <h3 className="font-display font-bold text-foreground text-lg">
                      {request.hospital_name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Posted {formatRelativeTime(request.created_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {request.area ? `${request.area}, ` : ""}{request.city} | Status:{" "}
                    <span className={cn(
                      "capitalize font-semibold",
                      request.status === "open" ? "text-primary" : "text-secondary"
                    )}>
                      {request.status}
                    </span>
                  </p>
                </div>
                {request.status === "open" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border border-secondary/35 shrink-0"
                    onClick={() => handleFulfillRequest(request)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Fulfilled
                  </Button>
                )}
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5 mb-3">
                    <Users className="h-4 w-4" />
                    Volunteer Responses ({request.responses?.length || 0})
                  </h4>

                  {(!request.responses || request.responses.length === 0) ? (
                    <p className="text-sm text-muted-foreground italic py-4 bg-muted/5 rounded-lg text-center border border-dashed border-border/60">
                      Waiting for donor responses. Live alerts have been sent to eligible matches.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {request.responses.map((resp) => (
                        <div key={resp.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between animate-fade-in">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="font-semibold text-foreground text-base">
                                  {resp.donor.profile.full_name}
                                </span>
                                <Badge variant="success" className="text-[10px]">
                                  {resp.donor.blood_group} Compatible
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {resp.donor.profile.area || "Area unspecified"}, {resp.donor.profile.city}
                                </span>
                                
                                {/* Exposed phone number after response */}
                                {resp.donor.profile.phone && (
                                  <span className="flex items-center gap-1 font-semibold text-secondary">
                                    <Phone className="h-3.5 w-3.5" />
                                    {resp.donor.profile.phone}
                                  </span>
                                )}
                              </div>

                              {resp.note && (
                                <p className="mt-2 text-sm text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                  <span className="italic leading-normal text-muted-foreground">&ldquo;{resp.note}&rdquo;</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                              {resp.status === "offered" ? (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleResponseStatus(resp.id, "confirmed")}
                                    className="h-8 px-2.5 bg-secondary/10 hover:bg-secondary/25 text-secondary border-0"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Confirm Donor
                                  </Button>
                                  <button
                                    onClick={() => handleResponseStatus(resp.id, "declined")}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-danger transition-colors"
                                    aria-label="Decline donor"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <Badge
                                  variant={resp.status === "confirmed" ? "success" : "neutral"}
                                  className="capitalize px-3 py-1 font-semibold"
                                >
                                  {resp.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
