// Shared domain types. Field names mirror the Supabase table columns
// (supabase/migrations/0001_core_schema.sql) so rows can be used directly
// without a mapping layer.

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type UrgencyLevel = "critical" | "urgent" | "planned";

export type RequestStatus = "open" | "fulfilled" | "expired";

export type ResponseStatus = "offered" | "confirmed" | "declined";

export type UserRole = "donor" | "requester" | "both";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  area: string | null;
  role: UserRole;
  created_at: string;
}

export interface Donor {
  id: string;
  profile_id: string;
  blood_group: BloodGroup;
  last_donation_date: string | null;
  is_available: boolean;
  age: number;
  weight_kg: number | null;
  medical_notes: string | null;
  created_at: string;
}

/** A donor row joined with its owning profile — what the donor list page renders. */
export interface DonorWithProfile extends Donor {
  profile: Pick<Profile, "full_name" | "city" | "area" | "phone">;
}

export interface EmergencyRequest {
  id: string;
  requester_profile_id: string;
  patient_name: string | null;
  blood_group: BloodGroup;
  units_needed: number;
  hospital_name: string;
  city: string;
  area: string | null;
  urgency: UrgencyLevel;
  contact_phone: string;
  status: RequestStatus;
  additional_notes: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface DonationResponse {
  id: string;
  request_id: string;
  donor_id: string;
  status: ResponseStatus;
  created_at: string;
}
