import type { BloodGroup, DonorWithProfile } from "@/types";

/**
 * Donor -> Recipients compatibility mapping.
 * Key: Donor's blood group
 * Value: Array of compatible recipient blood groups
 */
export const DONOR_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal Donor
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"], // Universal Recipient, can only donate to AB+
};

/**
 * Recipient -> Donors compatibility mapping.
 * Key: Recipient's blood group
 * Value: Array of compatible donor blood groups
 */
export const RECIPIENT_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal Recipient
};

/**
 * Checks if a donor's blood group is compatible with a recipient's blood group.
 */
export function isCompatible(donor: BloodGroup, recipient: BloodGroup): boolean {
  return DONOR_COMPATIBILITY[donor]?.includes(recipient) ?? false;
}

/**
 * Checks if a donor is eligible based on their last donation date.
 * Cooldown period is 90 days.
 */
export function isDonorEligible(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return true;

  const lastDate = new Date(lastDonationDate);
  const today = new Date();

  // Normalize dates to midnight to avoid time-of-day offsets
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 90;
}

/**
 * Calculates how many days are left until a donor is eligible to donate again.
 * Returns 0 if they are eligible now.
 */
export function getDaysUntilEligible(lastDonationDate: string | null): number {
  if (!lastDonationDate) return 0;

  const lastDate = new Date(lastDonationDate);
  const today = new Date();

  // Normalize dates
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const remaining = 90 - diffDays;
  return remaining > 0 ? remaining : 0;
}

export interface MatchingRequest {
  blood_group: BloodGroup;
  city: string;
  area?: string | null;
}

/**
 * Filters and sorts donors matching an emergency request.
 *
 * Requirements:
 * - compatible blood group
 * - is_available = true
 * - city matches request city
 * - last_donation_date is null or > 90 days ago (controlled by includeIneligible)
 * - Sorting: area match first (same area > same city only), then available longest
 */
export function findMatchingDonors(
  request: MatchingRequest,
  donors: DonorWithProfile[],
  includeIneligible = false
): DonorWithProfile[] {
  // Filter donors based on core compatibility criteria
  const filtered = donors.filter((donor) => {
    // 1. Blood group compatibility
    if (!isCompatible(donor.blood_group, request.blood_group)) {
      return false;
    }

    // 2. Must be marked available by user
    if (!donor.is_available) {
      return false;
    }

    // 3. City match is a hard filter
    if (
      !donor.profile.city ||
      donor.profile.city.trim().toLowerCase() !== request.city.trim().toLowerCase()
    ) {
      return false;
    }

    // 4. Eligibility cooldown filter (optional: include ineligible for admin/debug display)
    if (!includeIneligible && !isDonorEligible(donor.last_donation_date)) {
      return false;
    }

    return true;
  });

  // Sort matching donors
  return [...filtered].sort((a, b) => {
    // A. Area match (descending: same area = 1, different area = 0)
    const isAreaAMatch =
      request.area &&
      a.profile.area?.trim().toLowerCase() === request.area.trim().toLowerCase()
        ? 1
        : 0;
    const isAreaBMatch =
      request.area &&
      b.profile.area?.trim().toLowerCase() === request.area.trim().toLowerCase()
        ? 1
        : 0;

    if (isAreaAMatch !== isAreaBMatch) {
      return isAreaBMatch - isAreaAMatch; // Match (1) comes before Non-match (0)
    }

    // B. Eligibility & Available longest:
    // Null donation date (never donated) goes first.
    // If both have dates, sort ascending (oldest date first = available longest).
    const eligA = isDonorEligible(a.last_donation_date) ? 1 : 0;
    const eligB = isDonorEligible(b.last_donation_date) ? 1 : 0;

    if (eligA !== eligB) {
      return eligB - eligA; // Eligible first
    }

    if (eligA === 1) {
      // Both are eligible. Null goes first.
      if (!a.last_donation_date && !b.last_donation_date) return 0;
      if (!a.last_donation_date) return -1;
      if (!b.last_donation_date) return 1;

      // Oldest last donation date first
      return (
        new Date(a.last_donation_date).getTime() -
        new Date(b.last_donation_date).getTime()
      );
    } else {
      // Both are ineligible. Soonest eligible first (meaning the one who donated longest ago)
      if (!a.last_donation_date && !b.last_donation_date) return 0;
      if (!a.last_donation_date) return 1;
      if (!b.last_donation_date) return -1;

      // Oldest date first (means they are closer to completing their 90-day cooldown)
      return (
        new Date(a.last_donation_date).getTime() -
        new Date(b.last_donation_date).getTime()
      );
    }
  });
}
