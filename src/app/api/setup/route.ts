import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: "Missing Supabase credentials",
        sql: SQL,
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Try creating tables via exec_sql RPC (if the function exists)
  const { error } = await supabase.rpc("exec_sql", { query: SQL }).maybeSingle();

  if (error) {
    return NextResponse.json({
      message:
        "Could not auto-create tables. Run the SQL below in your Supabase SQL editor.",
      sql: SQL,
      hint: "Go to https://supabase.com -> SQL Editor -> paste and run",
    });
  }

  return NextResponse.json({
    message: "Tables updated successfully!",
  });
}

const SQL = `
-- ============================================================
-- 0. Add event_type column to events table
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT NULL;
-- Values: 'Campus Tournament', 'Academic', or NULL

-- ============================================================
-- ============================================================
-- 1. Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. Event Registrations table
-- ============================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_phone TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  member_count INTEGER DEFAULT 1,
  members JSONB DEFAULT '[]'::jsonb,
  university TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own registrations" ON event_registrations;
CREATE POLICY "Users can insert own registrations"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own registrations" ON event_registrations;
CREATE POLICY "Users can read own registrations"
  ON event_registrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all registrations" ON event_registrations;
CREATE POLICY "Admins can read all registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
`;
