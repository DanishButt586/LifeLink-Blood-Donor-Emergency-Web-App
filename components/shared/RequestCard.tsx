"use client";

import { motion } from "framer-motion";
import { Siren, MapPin, Clock, Heart, Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import type { EmergencyRequest } from "@/types";
import { cn } from "@/lib/utils";

export interface RequestCardProps {
  request: EmergencyRequest;
  isMatched?: boolean;
  hasResponded?: boolean;
  isOwnRequest?: boolean;
  onRespond?: () => void;
  className?: string;
}

export function RequestCard({
  request,
  isMatched = false,
  hasResponded = false,
  isOwnRequest = false,
  onRespond,
  className,
}: RequestCardProps) {
  // Urgency color coding
  const urgencyClasses = {
    critical: "border-danger/20 bg-danger/10 text-danger",
    urgent: "border-warning/20 bg-warning/10 text-warning",
    planned: "border-primary/20 bg-primary/10 text-primary",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden flex flex-col justify-between transition-all",
        isMatched && !hasResponded && "border-secondary/40 ring-1 ring-secondary/20 shadow-md shadow-secondary/5",
        className
      )}
    >
      {/* Ribbon / Match Badge */}
      {isMatched && !hasResponded && (
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-secondary px-3 py-1 text-[10px] font-bold text-secondary-foreground rounded-bl-xl shadow-sm z-10 animate-pulse">
          <Sparkles className="h-3 w-3 fill-current" />
          Compatible Match
        </div>
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
            className={cn("capitalize px-2.5 py-0.5", urgencyClasses[request.urgency])}
          >
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
          Units Needed: <span className="text-primary font-bold">{request.units_needed}</span>
        </span>

        {isOwnRequest ? (
          <span className="text-xs text-muted-foreground italic font-medium">
            Your request
          </span>
        ) : hasResponded ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-secondary">
            <Check className="h-4 w-4" />
            Responded
          </span>
        ) : (
          onRespond && (
            <Button
              variant={isMatched ? "secondary" : "primary"}
              size="sm"
              onClick={onRespond}
            >
              Respond as Donor
            </Button>
          )
        )}
      </div>
    </Card>
  );
}
