import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatLastDonation } from "@/lib/utils";
import type { DonorWithProfile } from "@/types";

export function DonorCard({ donor }: { donor: DonorWithProfile }) {
  const location = [donor.profile.area, donor.profile.city].filter(Boolean).join(", ");

  return (
    <Card className="transition-all hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display font-semibold text-foreground">
              {donor.profile.full_name}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-extrabold text-primary shadow-sm">
            {donor.blood_group}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              {donor.is_available && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  donor.is_available ? "bg-secondary" : "bg-muted-foreground/40",
                )}
              />
            </span>
            {donor.is_available ? "Available now" : "Not available"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatLastDonation(donor.last_donation_date)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
