# LifeLink — Blood Donor Emergency Network (Pakistan)

LifeLink is a production-grade, highly-responsive, and privacy-conscious blood donor coordination network designed for Pakistan. It connects verified blood donors with patients in urgent need of specific blood groups, bypassing the chaos and fragmentation of social media groups and chat applications.

## Live Deployed URL
**TODO**: Add after Vercel deployment.

---

## Features
1. **Dynamic Blood Compatibility Matching**: Real-time biological compatibility resolution (e.g. O- universal donor, AB+ universal recipient) that automatically filters and sorts eligible donors in the same city.
2. **Emergency Requests Feed**: A live feed of active requests powered by Supabase Realtime, sorting requests by urgency levels (Critical, Urgent, Planned) and posting recency.
3. **Privacy-First Phone Masking**: Enforced on the database level via Postgres Security Views (`profiles_secure` and `emergency_requests_secure`), contact phone numbers are hidden from public board views and only revealed once a mutual response connection is made.
4. **Donor Management Console**: Dedicated portal for donors to register details (blood group, age, weight, last donation dates, availability status) and manage responses.
5. **Requester Command Center**: Requesters can track live matched donors immediately upon publishing, review donor responses with note details, reveal contact numbers, approve offers, and mark requests as fulfilled.
6. **Network Analytics Dashboard**: Non-AI statistical dashboard highlighting total donors, active requests, lives saved, and visual charts representing blood group distributions and city coverage.
7. **Ask LifeLink AI Eligibility Assistant**: A dedicated chat assistant that guides users on blood donation rules, safety preparation, and app guidelines.

---

## The AI Feature (Ask LifeLink)
Ask LifeLink uses the Anthropic Claude API to guide users on eligibility questions. It uses the following system prompt:

```text
You are the LifeLink Donation Assistant, a helpful and careful assistant embedded in a Pakistani blood donor network app. Your ONLY job is to answer questions about blood donation eligibility, general safety, preparation before/after donating, and how the LifeLink app works. Guidelines you must follow:
1. Give general, widely-accepted donation eligibility guidance (e.g., typical minimum age 17-18, minimum weight ~50kg, waiting periods after illness, medication, tattoos, pregnancy, or recent donation — roughly 90 days between whole blood donations).
2. Always clarify you are not a doctor and cannot give a personal medical diagnosis or clearance — for any specific health condition, medication, or symptom the user mentions, advise them to confirm with the blood bank staff or their doctor before donating.
3. Be warm, concise, and reassuring — many users asking are anxious about whether they qualify to help someone in an emergency.
4. If asked about anything unrelated to blood donation or the app, politely redirect back to donation-related topics.
5. Never make up specific statistics, hospital names, or claim to access the user's personal donor record — you only give general guidance.
```

---

## Tech Stack & Tools
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database, Auth & Realtime Feed**: Supabase (Postgres + Realtime subscriptions + Auth triggers)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Integration**: Anthropic Claude API (`claude-3-5-sonnet-20241022`)
- **Deployment**: Vercel

---

## Screenshots
**TODO**: Add 3+ screenshots after deploying.

---

## How to Run the Project Locally

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root folder using `.env.local.example` as a template:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Setup Database Schema
Apply the SQL migration scripts in your Supabase project (SQL Editor -> New Query):
1. Run `supabase/migrations/0001_core_schema.sql` (Creates profiles, donors, emergency requests, donation responses tables, triggers, indexes, and initial RLS policies).
2. Run `supabase/migrations/0002_module3_updates.sql` (Applies response notes column, dynamic secure views for phone masking, response updates RLS policy, and enables Supabase Realtime publication).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
