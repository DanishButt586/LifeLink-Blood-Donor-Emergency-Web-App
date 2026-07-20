-- ============================================================================
-- DEMO/SEED DATA FOR LIFELINK
-- Safe to delete or ignore before production deployment.
--
-- This file populates the database with realistic Pakistani sample data:
-- - 15 Donors (creates auth.users -> triggers public.profiles -> inserts public.donors)
-- - 8 Emergency Requests (creates requesters -> triggers profiles -> inserts requests)
-- - 1 Confirmed Donation Response (resolves 1 request to show resolved state)
-- ============================================================================

BEGIN;

-- 1. Clean up any existing seed data to enable safe re-running
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106',
  '11111111-1111-1111-1111-111111111107',
  '11111111-1111-1111-1111-111111111108',
  '11111111-1111-1111-1111-111111111109',
  '11111111-1111-1111-1111-111111111110',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111113',
  '11111111-1111-1111-1111-111111111114',
  '11111111-1111-1111-1111-111111111115',
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222206',
  '22222222-2222-2222-2222-222222222207',
  '22222222-2222-2222-2222-222222222208'
);

-- 2. Insert Donors into auth.users (Trigger public.handle_new_user automatically creates profiles)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role) VALUES
('11111111-1111-1111-1111-111111111101', 'ahmed.raza@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmed Raza","phone":"0300-1111111","city":"Lahore","area":"Gulberg","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111102', 'fatima.khan@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Khan","phone":"0321-2222222","city":"Karachi","area":"Clifton","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111103', 'bilal.ahmed@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bilal Ahmed","phone":"0333-3333333","city":"Lahore","area":"DHA","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111104', 'ayesha.siddiqui@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ayesha Siddiqui","phone":"0345-4444444","city":"Islamabad","area":"F-10","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111105', 'hassan.malik@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hassan Malik","phone":"0300-5555555","city":"Karachi","area":"Gulshan-e-Iqbal","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111106', 'zainab.fatima@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zainab Fatima","phone":"0322-6666666","city":"Lahore","area":"Model Town","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111107', 'usman.tariq@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usman Tariq","phone":"0334-7777777","city":"Islamabad","area":"G-9","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111108', 'sana.sheikh@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sana Sheikh","phone":"0301-8888888","city":"Faisalabad","area":"Peoples Colony","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111109', 'hamza.yousaf@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hamza Yousaf","phone":"0323-9999999","city":"Rawalpindi","area":"Satellite Town","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111110', 'mahnoor.iqbal@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mahnoor Iqbal","phone":"0300-1010101","city":"Karachi","area":"North Nazimabad","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111111', 'ali.raza@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ali Raza","phone":"0312-1112131","city":"Multan","area":"Cantt","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111112', 'khadija.nasir@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Khadija Nasir","phone":"0346-1415161","city":"Lahore","area":"Johar Town","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111113', 'waleed.chaudhry@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Waleed Chaudhry","phone":"0302-1718191","city":"Peshawar","area":"University Town","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111114', 'iqra.aslam@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Iqra Aslam","phone":"0320-2021222","city":"Islamabad","area":"Bahria Town","role":"both"}', 'authenticated', 'authenticated'),
('11111111-1111-1111-1111-111111111115', 'faisal.mahmood@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Faisal Mahmood","phone":"0336-2324252","city":"Karachi","area":"Malir","role":"both"}', 'authenticated', 'authenticated');

-- 3. Insert into public.donors (profile_id maps back to auth.users.id)
INSERT INTO public.donors (id, profile_id, blood_group, last_donation_date, is_available, age, weight_kg, medical_notes, created_at) VALUES
('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'O+', CURRENT_DATE - INTERVAL '4 months', true, 28, 74.5, 'Regular healthy donor', NOW() - INTERVAL '15 days'),
('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111102', 'A+', NULL, true, 24, 55.0, 'First time donor, eligible', NOW() - INTERVAL '14 days'),
('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111103', 'O-', CURRENT_DATE - INTERVAL '2 months', true, 31, 82.0, 'Universal donor, O negative', NOW() - INTERVAL '13 days'),
('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111104', 'B+', CURRENT_DATE - INTERVAL '6 months', true, 26, 60.5, 'Fit and active', NOW() - INTERVAL '12 days'),
('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111105', 'AB+', CURRENT_DATE - INTERVAL '3 months', false, 35, 88.0, 'Temporarily unavailable due to medication', NOW() - INTERVAL '11 days'),
('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111106', 'A-', NULL, true, 22, 53.2, 'Completed basic physical check', NOW() - INTERVAL '10 days'),
('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111107', 'O+', CURRENT_DATE - INTERVAL '1 month', true, 29, 78.0, 'Frequent donor', NOW() - INTERVAL '9 days'),
('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111108', 'B-', CURRENT_DATE - INTERVAL '5 months', true, 27, 65.0, 'Rare blood type B negative', NOW() - INTERVAL '8 days'),
('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111109', 'AB-', NULL, true, 33, 71.0, 'No medical history issues', NOW() - INTERVAL '7 days'),
('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111110', 'O+', CURRENT_DATE - INTERVAL '4 months', true, 25, 59.0, 'Enthusiastic volunteer', NOW() - INTERVAL '6 days'),
('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111111', 'A+', CURRENT_DATE - INTERVAL '2 months', true, 30, 75.0, 'Regular donor', NOW() - INTERVAL '5 days'),
('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111112', 'O-', NULL, true, 23, 56.5, 'Willing to travel for emergency requests', NOW() - INTERVAL '4 days'),
('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111113', 'B+', CURRENT_DATE - INTERVAL '7 months', true, 32, 80.0, 'Healthy', NOW() - INTERVAL '3 days'),
('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111114', 'A+', CURRENT_DATE - INTERVAL '3 months', false, 26, 62.0, 'Currently recovering from flu', NOW() - INTERVAL '2 days'),
('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111115', 'O+', CURRENT_DATE - INTERVAL '1 month', true, 34, 85.0, 'Athletic build, fit', NOW() - INTERVAL '1 day');

-- 4. Insert Requesters into auth.users (Trigger automatically creates profiles)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role) VALUES
('22222222-2222-2222-2222-222222222201', 'abdul.rehman@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Abdul Rehman","phone":"0300-9990001","city":"Lahore","area":"Gulberg","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222202', 'mariam.yasin@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mariam Yasin","phone":"0321-9990002","city":"Karachi","area":"Clifton","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222203', 'noman.sheikh@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Noman Sheikh","phone":"0333-9990003","city":"Islamabad","area":"H-8","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222204', 'rabia.anjum@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rabia Anjum","phone":"0345-9990004","city":"Lahore","area":"Model Town","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222205', 'tariq.javed@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tariq Javed","phone":"0300-9990005","city":"Karachi","area":"Saddar","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222206', 'sadia.kareem@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sadia Kareem","phone":"0321-9990006","city":"Multan","area":"Cantt","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222207', 'imran.farooq@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Imran Farooq","phone":"0333-9990007","city":"Peshawar","area":"University Town","role":"requester"}', 'authenticated', 'authenticated'),
('22222222-2222-2222-2222-222222222208', 'nida.yasir@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nida Yasir","phone":"0345-9990008","city":"Rawalpindi","area":"Satellite Town","role":"requester"}', 'authenticated', 'authenticated');

-- 5. Insert into public.emergency_requests
INSERT INTO public.emergency_requests (id, requester_profile_id, patient_name, blood_group, units_needed, hospital_name, city, area, urgency, contact_phone, status, additional_notes, created_at, expires_at) VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Abdul Rehman', 'O-', 2, 'Jinnah Hospital', 'Lahore', 'Gulberg', 'critical', '0300-9990001', 'open', 'Emergency surgery. Needs O- negative whole blood on urgent basis.', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '24 hours'),
('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'Mariam Yasin', 'A+', 1, 'Aga Khan Hospital', 'Karachi', 'Clifton', 'urgent', '0321-9990002', 'open', 'Thalassemia patient, monthly transfusion needed.', NOW() - INTERVAL '1 day', NOW() + INTERVAL '48 hours'),
('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 'Noman Sheikh', 'B+', 3, 'Shifa International Hospital', 'Islamabad', 'H-8', 'critical', '0333-9990003', 'open', 'Road accident case, severe bleeding. Please coordinate soon.', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '12 hours'),
('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222204', 'Rabia Anjum', 'AB+', 1, 'Services Hospital', 'Lahore', 'Model Town', 'planned', '0345-9990004', 'open', 'Scheduled surgery on coming Tuesday. Looking for AB+ donors.', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days'),
('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222205', 'Tariq Javed', 'O+', 2, 'Civil Hospital', 'Karachi', 'Saddar', 'urgent', '0300-9990005', 'open', 'Delivery case emergency. Contact Dr. Asif on duty.', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '30 hours'),
('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222206', 'Sadia Kareem', 'A-', 1, 'Nishtar Hospital', 'Multan', 'Cantt', 'critical', '0321-9990006', 'open', 'Patient is in ICU. A- negative blood needed immediately.', NOW() - INTERVAL '5 hours', NOW() + INTERVAL '20 hours'),
('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222207', 'Imran Farooq', 'B-', 2, 'Lady Reading Hospital', 'Peshawar', 'University Town', 'urgent', '0333-9990007', 'fulfilled', 'Fulfilled by donor Sana Sheikh.', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222208', 'Nida Yasir', 'AB-', 1, 'Holy Family Hospital', 'Rawalpindi', 'Satellite Town', 'planned', '0345-9990008', 'open', 'Surgical preparation. Donor replacement required.', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '3 days');

-- 6. Insert Donation Responses (Imran Farooq B- request met by Sana Sheikh B- Faisalabad donor)
-- Sana Sheikh profile: '11111111-1111-1111-1111-111111111108'
-- Sana Sheikh donor record: '44444444-4444-4444-4444-444444444408'
-- Imran Farooq request record: '33333333-3333-3333-3333-333333333307'
INSERT INTO public.donation_responses (id, request_id, donor_id, status, created_at) VALUES
('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333307', '44444444-4444-4444-4444-444444444408', 'confirmed', NOW() - INTERVAL '4 days');

COMMIT;
