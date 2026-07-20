-- LifeLink — Module 3: emergency request updates, secure views, and RLS updates.

-- 1. Add note column to donation_responses table
alter table public.donation_responses add column if not exists note text;

-- 2. Add update policy for donation_responses to allow status changes by involved parties (requester or donor)
create policy "responses_update_involved"
  on public.donation_responses for update
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
  )
  with check (
    exists (
      select 1 from public.donors d
      where d.id = donation_responses.donor_id and d.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.emergency_requests r
      where r.id = donation_responses.request_id and r.requester_profile_id = auth.uid()
    )
  );

-- 3. Create secure views for profiles and emergency requests to mask phone numbers
create or replace view public.profiles_secure as
select
  id,
  full_name,
  city,
  area,
  role,
  created_at,
  case
    when id = auth.uid() then phone
    when exists (
      select 1 from public.donation_responses dr
      join public.donors d on dr.donor_id = d.id
      join public.emergency_requests r on dr.request_id = r.id
      where (d.profile_id = profiles.id and r.requester_profile_id = auth.uid())
         or (r.requester_profile_id = profiles.id and d.profile_id = auth.uid())
    ) then phone
    else null
  end as phone
from public.profiles;

create or replace view public.emergency_requests_secure as
select
  id,
  requester_profile_id,
  patient_name,
  blood_group,
  units_needed,
  hospital_name,
  city,
  area,
  urgency,
  status,
  additional_notes,
  created_at,
  expires_at,
  case
    when requester_profile_id = auth.uid() then contact_phone
    when exists (
      select 1 from public.donation_responses dr
      join public.donors d on dr.donor_id = d.id
      where dr.request_id = emergency_requests.id and d.profile_id = auth.uid()
    ) then contact_phone
    else null
  end as contact_phone
from public.emergency_requests;

grant select on public.profiles_secure to authenticated;
grant select on public.emergency_requests_secure to authenticated;

-- 4. Enable Supabase Realtime for the emergency_requests table
alter publication supabase_realtime add table public.emergency_requests;
