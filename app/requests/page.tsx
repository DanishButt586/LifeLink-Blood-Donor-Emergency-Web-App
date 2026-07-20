"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  Heart,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Plus,
  Sparkles,
  Check,
  X,
  Phone,
  MessageSquare,
  Eye,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { LiveEyebrow } from "@/components/shared/LiveEyebrow";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { isCompatible, isDonorEligible } from "@/lib/matching";
import { formatRelativeTime, cn } from "@/lib/utils";
import type {
  BloodGroup,
  UrgencyLevel,
  EmergencyRequest,
  DonorWithProfile,
} from "@/types";

// Extended structures for joined queries
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

const URGENCY_META: Record<UrgencyLevel, { icon: LucideIcon; classes: string }> = {
  critical: { icon: AlertTriangle, classes: "border-danger/25 bg-danger/10 text-danger" },
  urgent: { icon: AlertCircle, classes: "border-warning/25 bg-warning/10 text-warning" },
  planned: { icon: CalendarClock, classes: "border-primary/25 bg-primary/10 text-primary" },
};

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export default function RequestsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "my-requests" | "resolved">("feed");
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [myRequests, setMyRequests] = useState<RequestWithResponses[]>([]);
  const [resolvedRequests, setResolvedRequests] = useState<EmergencyRequest[]>([]);
  const [loggedInDonor, setLoggedInDonor] = useState<DonorWithProfile | null>(null);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  
  // Loading states
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMy, setIsLoadingMy] = useState(true);
  const [isLoadingResolved, setIsLoadingResolved] = useState(true);

  // Filters
  const [filterBloodGroup, setFilterBloodGroup] = useState<BloodGroup | "">("");
  const [filterCity, setFilterCity] = useState<string>("");

  // Modals / Response state
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [intentConfirmed, setIntentConfirmed] = useState(false);
  const [donorNote, setDonorNote] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Celebration animation overlay
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedRequest, setCelebratedRequest] = useState<EmergencyRequest | null>(null);

  // Load the current user's donor profile (if registered)
  useEffect(() => {
    if (!user) return;
    async function fetchDonorProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from("donors")
        .select("*, profile:profiles(full_name, city, area, phone)")
        .eq("profile_id", user!.id)
        .maybeSingle();
      setLoggedInDonor(data as DonorWithProfile | null);
    }
    fetchDonorProfile();
  }, [user]);

  // Load donor's existing responses
  const fetchMyResponses = useCallback(async () => {
    if (!user || !loggedInDonor) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("donation_responses")
      .select("*")
      .eq("donor_id", loggedInDonor.id);
    setMyResponses(data || []);
  }, [user, loggedInDonor]);

  useEffect(() => {
    if (loggedInDonor) {
      fetchMyResponses();
    }
  }, [loggedInDonor, fetchMyResponses]);

  // 1. Fetch Open Feed Requests
  const loadFeedRequests = useCallback(async () => {
    setIsLoadingFeed(true);
    const supabase = createClient();
    try {
      // Query from secure view to mask phone numbers
      const { data, error } = await supabase
        .from("emergency_requests_secure")
        .select("*")
        .eq("status", "open");

      if (error) throw error;
      setRequests(data as EmergencyRequest[]);
    } catch (err: any) {
      showToast({
        title: "Error loading feed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsLoadingFeed(false);
    }
  }, [showToast]);

  // 2. Fetch My Requests with Responses
  const loadMyRequests = useCallback(async () => {
    if (!user) return;
    setIsLoadingMy(true);
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
        title: "Error loading your requests",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsLoadingMy(false);
    }
  }, [user, showToast]);

  // 3. Fetch Resolved (Fulfilled) Requests Feed
  const loadResolvedRequests = useCallback(async () => {
    setIsLoadingResolved(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("emergency_requests_secure")
        .select("*")
        .eq("status", "fulfilled")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResolvedRequests(data as EmergencyRequest[]);
    } catch (err: any) {
      showToast({
        title: "Error loading resolved requests",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsLoadingResolved(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    loadFeedRequests();
  }, [loadFeedRequests]);

  // Handle Tab Switch queries
  useEffect(() => {
    if (activeTab === "feed") {
      loadFeedRequests();
    } else if (activeTab === "my-requests") {
      loadMyRequests();
    } else if (activeTab === "resolved") {
      loadResolvedRequests();
    }
  }, [activeTab, loadFeedRequests, loadMyRequests, loadResolvedRequests]);

  // Set up Supabase Realtime Subscription for Live Board updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("emergency_requests_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_requests" },
        () => {
          // Trigger refresh based on active tab
          loadFeedRequests();
          if (user) {
            loadMyRequests();
          }
          loadResolvedRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFeedRequests, loadMyRequests, loadResolvedRequests]);

  // Filtered Feed items (sort: Critical > Urgent > Planned, then created_at desc)
  const filteredFeedRequests = useMemo(() => {
    let list = [...requests];

    if (filterBloodGroup) {
      list = list.filter((r) => r.blood_group === filterBloodGroup);
    }
    if (filterCity) {
      list = list.filter((r) => r.city.toLowerCase() === filterCity.toLowerCase());
    }

    const urgencyWeight = { critical: 3, urgent: 2, planned: 1 };

    return list.sort((a, b) => {
      const weightA = urgencyWeight[a.urgency] || 0;
      const weightB = urgencyWeight[b.urgency] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Higher urgency weight first
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first
    });
  }, [requests, filterBloodGroup, filterCity]);

  // Check if current user is compatible with request
  const checkCompatibility = useCallback(
    (requestBloodGroup: BloodGroup) => {
      if (!loggedInDonor) return { isCompatible: false, message: "Register as a donor to respond." };
      if (!loggedInDonor.is_available) return { isCompatible: false, message: "Your status is set to Unavailable." };
      if (!isDonorEligible(loggedInDonor.last_donation_date)) {
        return { isCompatible: false, message: "You are within the 90-day donation cooldown." };
      }

      const compatible = isCompatible(loggedInDonor.blood_group, requestBloodGroup);
      if (!compatible) {
        return {
          isCompatible: false,
          message: `Your blood group (${loggedInDonor.blood_group}) is not compatible with recipient's (${requestBloodGroup}).`,
        };
      }

      return { isCompatible: true, message: `Your blood group (${loggedInDonor.blood_group}) is compatible!` };
    },
    [loggedInDonor]
  );

  // Response Confirmation handler
  async function submitDonorResponse() {
    if (!user || !loggedInDonor || !selectedRequest) return;
    setIsSubmittingResponse(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("donation_responses").insert({
        request_id: selectedRequest.id,
        donor_id: loggedInDonor.id,
        status: "offered",
        note: donorNote.trim() || null,
      });

      if (error) throw error;

      showToast({
        title: "Response Submitted",
        description: "The requester has been notified. Thank you for your kindness!",
        variant: "success",
      });

      setIsResponseModalOpen(false);
      setSelectedRequest(null);
      setIntentConfirmed(false);
      setDonorNote("");
      
      // Refresh local responses lists and feed
      fetchMyResponses();
      loadFeedRequests();
    } catch (err: any) {
      showToast({
        title: "Submission failed",
        description: err.message,
        variant: "danger",
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  }

  // Requester Actions: Confirm/Decline response status
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

  // Requester Action: Mark entire request as Fulfilled (celebration trigger!)
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
      
      // Auto close celebration after 5 seconds
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

  const showLoginPrompt = !authLoading && !user;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
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
                The emergency request for blood group <span className="font-bold text-primary">{celebratedRequest.blood_group}</span> at <span className="font-semibold text-foreground">{celebratedRequest.hospital_name}</span> has been marked as fulfilled.
              </p>
              <p className="mt-2 text-secondary font-medium text-sm flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4" />
                Every connection matters. Thank you, hero!
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

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <LiveEyebrow label="Emergency Board" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Emergency Requests
          </h1>
          <p className="mt-2 text-muted-foreground">
            A live feed of critical blood requirements in Pakistan. Respond to help immediately.
          </p>
        </div>
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-lg bg-primary/40 animate-pulse-ring" aria-hidden="true" />
          <Link href="/requests/new" className={cn(buttonVariants("primary", "md"), "relative shadow-md shadow-primary/25")}>
            <Plus className="h-4 w-4" />
            Need Blood Urgently?
          </Link>
        </div>
      </div>

      {/* Tabs list */}
      <div className="mb-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
        {[
          { id: "feed", label: "Open Requests" },
          { id: "my-requests", label: "My Requests" },
          { id: "resolved", label: "Resolved" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="requests-tab-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.label}
                {tab.id === "feed" && requests.length > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                      isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                    )}
                  >
                    {requests.length}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Login Protection Check */}
      {showLoginPrompt ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
            Log in to view active requests
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Emergency contact details and request feeds are secure and visible only to logged-in members.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className={buttonVariants("primary", "md")}>
              Log In
            </Link>
            <Link href="/signup" className={buttonVariants("ghost", "md")}>
              Sign Up
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* TAB 1: Live Feed */}
          {activeTab === "feed" && (
            <div className="space-y-6">
              {/* Filter bar */}
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
                <div className="flex-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  Filters
                </div>
                <Select
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value as BloodGroup)}
                  className="sm:max-w-xs"
                  aria-label="Filter by blood group"
                >
                  <option value="">All Blood Groups</option>
                  {PAKISTAN_CITIES.map((_, i) => {
                    const bg = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"][i];
                    if (!bg) return null;
                    return <option key={bg} value={bg}>{bg}</option>;
                  })}
                </Select>
                <Select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="sm:max-w-xs"
                  aria-label="Filter by city"
                >
                  <option value="">All Cities</option>
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>

              {isLoadingFeed ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl border border-border bg-card" />
                  ))}
                </div>
              ) : filteredFeedRequests.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Siren className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No active requests</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                  {filteredFeedRequests.map((request, index) => {
                    // Check if current user is compatible match
                    const compatResult = checkCompatibility(request.blood_group);
                    const isMatched = compatResult.isCompatible;
                    const hasAlreadyResponded = myResponses.some(
                      (resp) => resp.request_id === request.id
                    );
                    const urgencyMeta = URGENCY_META[request.urgency];

                    return (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: (index % 9) * 0.05 }}
                      >
                      <Card
                        className={cn(
                          "relative overflow-hidden flex flex-col justify-between transition-all",
                          isMatched && !hasAlreadyResponded && "border-secondary/40 ring-2 ring-secondary/25 shadow-lg shadow-secondary/10"
                        )}
                      >
                        {/* Ribbon / Match Badge */}
                        {isMatched && !hasAlreadyResponded && (
                          <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="absolute top-0 right-0 flex items-center gap-1 overflow-hidden bg-secondary px-3 py-1 text-[10px] font-bold text-secondary-foreground rounded-bl-xl shadow-sm z-10"
                          >
                            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <Sparkles className="h-3 w-3 fill-current" />
                            Compatible Match
                          </motion.div>
                        )}

                        <div className="p-5 flex-1 space-y-4">
                          <div className="flex items-start gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-2xl font-extrabold text-primary shadow-sm">
                              {request.blood_group}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display font-bold text-foreground text-lg leading-tight truncate">
                                {request.hospital_name}
                              </h3>
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {request.area ? `${request.area}, ` : ""}{request.city}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="neutral"
                              className={cn("gap-1 capitalize px-2.5 py-0.5", urgencyMeta.classes)}
                            >
                              <urgencyMeta.icon className="h-3 w-3" aria-hidden="true" />
                              {request.urgency}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatRelativeTime(request.created_at)}
                            </span>
                            {request.patient_name && (
                              <span className="text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 truncate max-w-[150px]">
                                Patient: {request.patient_name}
                              </span>
                            )}
                          </div>

                          {request.additional_notes && (
                            <p className="text-sm text-muted-foreground/90 bg-muted/20 p-3 rounded-lg border border-border/40 italic line-clamp-2">
                              &ldquo;{request.additional_notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-border/40 bg-card/50 flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-foreground">
                            Units: <span className="text-primary font-bold">{request.units_needed}</span>
                          </span>

                          {request.requester_profile_id === user?.id ? (
                            <span className="text-xs text-muted-foreground italic font-medium">
                              Your request
                            </span>
                          ) : hasAlreadyResponded ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-secondary">
                              <Check className="h-4 w-4" />
                              Responded
                            </span>
                          ) : (
                            <Button
                              variant={isMatched ? "secondary" : "primary"}
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsResponseModalOpen(true);
                              }}
                            >
                              Respond as Donor
                            </Button>
                          )}
                        </div>
                      </Card>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Requests */}
          {activeTab === "my-requests" && (
            <div className="space-y-6">
              {isLoadingMy ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-2xl border border-border bg-card" />
                  ))}
                </div>
              ) : myRequests.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Heart className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No requests posted yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground mb-6">
                    If you are in need of blood, you can create a new emergency request.
                  </p>
                  <Link href="/requests/new" className={buttonVariants("primary", "md")}>
                    Request Blood
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {myRequests.map((request) => (
                    <Card key={request.id} className="border-border overflow-hidden">
                      <div className="bg-muted/10 p-5 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="primary" className="text-sm font-bold">
                              {request.blood_group}
                            </Badge>
                            <h3 className="font-display font-bold text-foreground">
                              {request.hospital_name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              Posted {formatRelativeTime(request.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.area ? `${request.area}, ` : ""}{request.city} | Status:{" "}
                            <span className="capitalize font-semibold text-primary">
                              {request.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {request.status === "open" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="border border-secondary/30"
                              onClick={() => handleFulfillRequest(request)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark as Fulfilled
                            </Button>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            Donor Responses ({request.responses?.length || 0})
                          </h4>

                          {(!request.responses || request.responses.length === 0) ? (
                            <p className="text-sm text-muted-foreground italic py-3 bg-muted/5 rounded-lg text-center">
                              No donor responses yet. Nearby compatible donors have been alerted.
                            </p>
                          ) : (
                            <div className="divide-y divide-border/60">
                              {request.responses.map((resp) => (
                                <div key={resp.id} className="py-4 first:pt-0 last:pb-0">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {getInitials(resp.donor.profile.full_name)}
                                      </span>
                                      <div className="space-y-1">
                                      <div className="flex items-center gap-2.5">
                                        <span className="font-semibold text-foreground">
                                          {resp.donor.profile.full_name}
                                        </span>
                                        <Badge variant="success" className="text-[10px]">
                                          {resp.donor.blood_group} Donor
                                        </Badge>
                                      </div>

                                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5" />
                                          {resp.donor.profile.area || "Area unspecified"}, {resp.donor.profile.city}
                                        </span>

                                        {/* REVEAL PHONE NUMBER */}
                                        {resp.donor.profile.phone && (
                                          <span className="flex items-center gap-1.5">
                                            <span className="flex items-center gap-1 font-semibold text-secondary">
                                              <Phone className="h-3.5 w-3.5" />
                                              {resp.donor.profile.phone}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                                              <Eye className="h-2.5 w-2.5" />
                                              Revealed
                                            </span>
                                          </span>
                                        )}
                                      </div>

                                      {resp.note && (
                                        <p className="mt-2 text-sm text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 flex items-start gap-1.5">
                                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                          <span className="italic">&ldquo;{resp.note}&rdquo;</span>
                                        </p>
                                      )}
                                      </div>
                                    </div>

                                    {/* Action statuses */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                      {resp.status === "offered" ? (
                                        <>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleResponseStatus(resp.id, "confirmed")}
                                            className="h-8 px-2.5 bg-secondary/15 hover:bg-secondary/20 text-secondary border-0"
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                            Confirm
                                          </Button>
                                          <button
                                            onClick={() => handleResponseStatus(resp.id, "declined")}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-danger"
                                            aria-label="Decline donor"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <Badge
                                          variant={resp.status === "confirmed" ? "success" : "neutral"}
                                          className="capitalize"
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
          )}

          {/* TAB 3: Resolved */}
          {activeTab === "resolved" && (
            <div className="space-y-6">
              {isLoadingResolved ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-2xl border border-border bg-card" />
                  ))}
                </div>
              ) : resolvedRequests.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <Sparkles className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No resolved requests yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resolved requests celebrate successful matches and lives saved.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {resolvedRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: (index % 9) * 0.05 }}
                    >
                    <Card
                      className="relative overflow-hidden flex flex-col justify-between opacity-90"
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-1 overflow-hidden rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-bold text-secondary">
                        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-secondary/25 to-transparent" />
                        <Sparkles className="h-3 w-3 fill-current" />
                        Life Saved
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-start gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted font-display text-xl font-bold text-muted-foreground">
                            {request.blood_group}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {request.hospital_name}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {request.area ? `${request.area}, ` : ""}{request.city}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fulfilled {formatRelativeTime(request.created_at)}
                        </p>
                      </div>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION RESPOND DIALOG MODAL */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => {
          setIsResponseModalOpen(false);
          setSelectedRequest(null);
          setIntentConfirmed(false);
          setDonorNote("");
        }}
        title="Confirm Intent to Donate"
      >
        {selectedRequest && (
          <div className="space-y-5">
            {/* Compatibility check output */}
            {(() => {
              const checkRes = checkCompatibility(selectedRequest.blood_group);
              return (
                <div
                  className={cn(
                    "rounded-xl border p-4",
                    checkRes.isCompatible
                      ? "border-secondary/30 bg-secondary/5 text-secondary-foreground"
                      : "border-danger/30 bg-danger/5 text-danger"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {checkRes.isCompatible ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 text-danger mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-bold leading-tight">
                        {checkRes.isCompatible ? "Compatible Blood Match" : "Incompatible Group / Cooldown"}
                      </p>
                      <p className="mt-1 text-xs opacity-90">{checkRes.message}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {loggedInDonor && checkCompatibility(selectedRequest.blood_group).isCompatible ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Request Details</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hospital: {selectedRequest.hospital_name} <br />
                    Units: {selectedRequest.units_needed} unit(s) of {selectedRequest.blood_group} needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    label="Optional message for the requester"
                    placeholder="Include availability times, when you can arrive, or other comments..."
                    value={donorNote}
                    onChange={(e) => setDonorNote(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Intent confirmation checkbox */}
                <label
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors",
                    intentConfirmed
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-muted/20",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={intentConfirmed}
                    onChange={(e) => setIntentConfirmed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                      intentConfirmed ? "border-primary bg-primary" : "border-input bg-background",
                    )}
                  >
                    {intentConfirmed && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">
                      Confirm Intent to Donate
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      I verify that I want to donate blood for this emergency request. Once confirmed, my name and phone number will be shared with the requester.
                    </p>
                  </div>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 border border-border"
                    onClick={() => {
                      setIsResponseModalOpen(false);
                      setSelectedRequest(null);
                      setIntentConfirmed(false);
                      setDonorNote("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={!intentConfirmed || isSubmittingResponse}
                    onClick={submitDonorResponse}
                  >
                    {isSubmittingResponse ? "Submitting..." : "Confirm & Send"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!loggedInDonor ? (
                  <p className="text-xs text-muted-foreground">
                    You must register a donor profile specifying your blood group, age, and location before responding to emergency requests.
                  </p>
                ) : null}
                <div className="flex gap-3">
                  {!loggedInDonor ? (
                    <Link
                      href="/donors/register"
                      className={cn(buttonVariants("primary", "md"), "w-full")}
                    >
                      Register as Donor
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        setIsResponseModalOpen(false);
                        setSelectedRequest(null);
                      }}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
