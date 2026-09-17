-- ============================================================
-- Planify — Migration 002: RLS, Indexes, Storage & Notifications
-- ============================================================

-- 1. Ensure timezone defaults to 'Asia/Kolkata' in profiles
ALTER TABLE profiles 
  ALTER COLUMN timezone SET DEFAULT 'Asia/Kolkata';

-- Update existing profiles that have 'UTC' or null timezone
UPDATE profiles 
SET timezone = 'Asia/Kolkata' 
WHERE timezone = 'UTC' OR timezone IS NULL;

-- 2. Ensure notification_logs has status and error_message columns
ALTER TABLE notification_logs 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Composite and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_profile_date 
  ON tasks(profile_id, task_date);

CREATE INDEX IF NOT EXISTS idx_tasks_profile_completed 
  ON tasks(profile_id, completed);

CREATE INDEX IF NOT EXISTS idx_tasks_profile_date_completed 
  ON tasks(profile_id, task_date, completed);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_profile_active 
  ON recurring_tasks(profile_id, active);

CREATE INDEX IF NOT EXISTS idx_notes_profile_updated 
  ON notes(profile_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_profile_created 
  ON documents(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_date_type 
  ON notification_logs(profile_id, notification_date, notification_type);

-- 4. Enable Row Level Security (RLS) on all user-owned tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for authenticated users
-- Profiles: users can select, insert, and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Tasks: scoped by profile_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Recurring Tasks: scoped by profile_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage own recurring tasks" ON recurring_tasks;
CREATE POLICY "Users can manage own recurring tasks"
  ON recurring_tasks FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Notes: scoped by profile_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Documents: scoped by profile_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
CREATE POLICY "Users can manage own documents"
  ON documents FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Notification Logs: scoped by profile_id = auth.uid()
DROP POLICY IF EXISTS "Users can view own notification logs" ON notification_logs;
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = profile_id);

-- 6. Storage Bucket setup for 'planify-documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'planify-documents',
  'planify-documents',
  false,
  10485760, -- 10MB
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Storage RLS: Users can upload, read, update, delete in their own folder
DROP POLICY IF EXISTS "Users can upload own documents to planify-documents" ON storage.objects;
CREATE POLICY "Users can upload own documents to planify-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'planify-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view own documents in planify-documents" ON storage.objects;
CREATE POLICY "Users can view own documents in planify-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'planify-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own documents in planify-documents" ON storage.objects;
CREATE POLICY "Users can update own documents in planify-documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'planify-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own documents in planify-documents" ON storage.objects;
CREATE POLICY "Users can delete own documents in planify-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'planify-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
