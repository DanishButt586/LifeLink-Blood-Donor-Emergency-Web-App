-- LifeLink — Module 2: core schema, indexes, RLS policies, and the
-- auth.users -> public.profiles signup trigger.
--
-- Run this once in the Supabase SQL editor (SQL Editor -> New query -> paste -> Run),
-- or via `supabase db push` if you're using the Supabase CLI locally.

create extension if not exists "pgcrypto";

-- ============================================================
-- Shared enum
-- ============================================================

create type public.blood_group as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  city text,
  area text,
  role text not null default 'donor' check (role in ('donor', 'requester', 'both')),
  created_at timestamptz not null default now()
);

create table public.donors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  blood_group public.blood_group not null,
  last_donation_date date,
  is_available boolean not null default true,
  age integer not null check (age between 18 and 65),
  weight_kg numeric check (weight_kg is null or weight_kg >= 50),
  medical_notes text,
  created_at timestamptz not null default now()
);

create table public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles (id) on delete cascade,
  patient_name text,
  blood_group public.blood_group not null,
  units_needed integer not null default 1 check (units_needed > 0),
  hospital_name text not null,
  city text not null,
  area text,
  urgency text not null check (urgency in ('critical', 'urgent', 'planned')),
  contact_phone text not null,
  status text not null default 'open' check (status in ('open', 'fulfilled', 'expired')),
  additional_notes text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.donation_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.emergency_requests (id) on delete cascade,
  donor_id uuid not null references public.donors (id) on delete cascade,
  status text not null default 'offered' check (status in ('offered', 'confirmed', 'declined')),
  created_at timestamptz not null default now(),
  unique (request_id, donor_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_profiles_city on public.profiles (city);
create index idx_donors_profile_id on public.donors (profile_id);
create index idx_donors_blood_group on public.donors (blood_group);
create index idx_donors_is_available on public.donors (is_available);
create index idx_emergency_requests_status on public.emergency_requests (status);
create index idx_emergency_requests_city on public.emergency_requests (city);
create index idx_emergency_requests_blood_group on public.emergency_requests (blood_group);
create index idx_donation_responses_request_id on public.donation_responses (request_id);
create index idx_donation_responses_donor_id on public.donation_responses (donor_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.donors enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.donation_responses enable row level security;

-- profiles: any authenticated user can read (needed for matching display);
-- only the owner can insert/update their own row.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- donors: any authenticated user can read (needed to search donors);
-- only the owning profile can insert/update their own donor row.
create policy "donors_select_authenticated"
  on public.donors for select
  to authenticated
  using (true);

create policy "donors_insert_own"
  on public.donors for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "donors_update_own"
  on public.donors for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- emergency_requests: any authenticated user can read;
-- only the requester can insert/update/delete their own request.
create policy "requests_select_authenticated"
  on public.emergency_requests for select
  to authenticated
  using (true);

create policy "requests_insert_own"
  on public.emergency_requests for insert
  to authenticated
  with check (requester_profile_id = auth.uid());

create policy "requests_update_own"
  on public.emergency_requests for update
  to authenticated
  using (requester_profile_id = auth.uid())
  with check (requester_profile_id = auth.uid());

create policy "requests_delete_own"
  on public.emergency_requests for delete
  to authenticated
  using (requester_profile_id = auth.uid());

-- donation_responses: a donor can offer on their own behalf;
-- the donor involved and the requester who owns the request can read.
create policy "responses_select_involved"
  on public.donation_responses for select
  to authenticated
  using (
    exists (
      select 1 from public.donors d
      where d.id = donation_responses.donor_id and d.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.emergency_requests r
      where r.id = donation_responses.request_id and r.requester_profile_id = auth.uid()
    )
  );

create policy "responses_insert_own_donor"
  on public.donation_responses for insert
  to authenticated
  with check (
    exists (
      select 1 from public.donors d
      where d.id = donation_responses.donor_id and d.profile_id = auth.uid()
    )
  );

-- ============================================================
-- Auto-create a profile row whenever a new auth user signs up.
-- Reads the metadata passed via supabase.auth.signUp({ options: { data } }).
-- Runs as security definer so it works regardless of email-confirmation
-- settings (the client may not have an active session yet at signup time).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, city, area, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'area',
    coalesce(new.raw_user_meta_data ->> 'role', 'donor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
