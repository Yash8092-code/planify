# Planify 🚀

> A modern, lightning-fast personal productivity web application designed for individual high-achievers. Manage daily tasks, automate recurring daily habits with **Rollback Daily**, write and tag notes, securely store documents, and receive automated morning & milestone email briefings.

---

## ✨ Key Features

- 🎯 **Streamlined Onboarding**: Zero password hassle. Set your name, email, and timezone on first launch.
- 📋 **Checklist & Task Management**:
  - Drag/reorder priorities, animated task completion, priority levels (High, Medium, Low).
  - Due time badges, filters (All / Active / Done), and date navigation.
  - Confetti celebration when all daily tasks are completed!
- 🔄 **Rollback Daily System**:
  - Automatically regenerates your daily recurring tasks every morning at 5:00 AM.
  - Dedicated Rollback Manager to pause, resume, edit, or manually trigger habit rollbacks.
- 📝 **Organized Notes**:
  - Clean distraction-free note editor with tag management and pin-to-top feature.
  - Word & character counters, search filter, and instant updates.
- 📁 **Document Vault**:
  - Drag-and-drop file uploader supporting PDFs, documents, spreadsheets, images, and text files up to 10MB.
  - Direct download links, rename files, and file-type categorized preview icons.
- 📊 **Productivity Analytics**:
  - Dynamic streak counter, 7-day responsive completion bar chart, weekly & monthly metrics.
- ✉️ **Automated Email Notifications (Resend)**:
  - 5:00 AM daily productivity brief with your daily tasks and rotating motivational quotes.
  - 100% completion celebration email to acknowledge daily wins.
  - Deduplication logs (`notification_logs`) prevent redundant email dispatches.
- 🌓 **Rich Design Aesthetics**:
  - Sleek dark and light modes with system preference sync.
  - Responsive layout with desktop collapsible sidebar and mobile glassmorphism bottom bar.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling**: Tailwind CSS v4 + Radix UI Primitives + Lucide Icons
- **Animations**: Framer Motion
- **Database & Storage**: Supabase (PostgreSQL + Supabase Storage)
- **Email Delivery**: Resend API
- **Data Fetching & State**: SWR with optimistic UI updates

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
cd Planify
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend Email (Optional for testing)
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=Planify <onboarding@resend.dev>

# Cron Security
CRON_SECRET=your-random-cron-secret-token
```

### 3. Apply Database Migration

Run `supabase/migrations/001_initial_schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

Also, create a public or authenticated bucket named `documents` under **Supabase Storage**.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to begin!

---

## ⏰ Cron Jobs (Vercel)

The repository includes `vercel.json` with preconfigured schedules:
- `0 5 * * *`: Daily task rollback recreation (`/api/cron/daily-rollback`)
- `5 5 * * *`: 5:00 AM Morning productivity brief email (`/api/cron/daily-email`)

---

## 📄 License

MIT License. Designed with visual excellence and performance in mind.
