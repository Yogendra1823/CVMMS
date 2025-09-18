/*
  # Complaint Updates Table Migration
  
  Creates the complaint_updates table for CitizenVoice Municipal Management System.
  This table tracks all changes and updates to complaints for complete audit trail.
  
  ## Features:
  - Complete audit trail for complaints
  - Status change tracking
  - Comment system
  - File attachment tracking
  - Admin activity logging
  
  ## Security:
  - Row Level Security enabled
  - Users can see updates for their complaints
  - Admin-controlled updates
*/

-- Create complaint_updates table
CREATE TABLE IF NOT EXISTS complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  update_type text NOT NULL CHECK (update_type IN ('status_change', 'assignment', 'comment', 'attachment', 'cost_update', 'date_update', 'escalation')),
  old_value text,
  new_value text,
  field_name text,
  comment text,
  is_public boolean DEFAULT true,
  is_system_generated boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  escalation_reason text,
  cost_impact decimal(12, 2),
  time_impact_hours integer,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read updates for their complaints"
  ON complaint_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints c 
      WHERE c.id = complaint_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create complaint updates"
  ON complaint_updates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "System can create automatic updates"
  ON complaint_updates FOR INSERT TO authenticated
  WITH CHECK (is_system_generated = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_user_id ON complaint_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_admin_user_id ON complaint_updates(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_update_type ON complaint_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_created_at ON complaint_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_is_public ON complaint_updates(is_public);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_is_system_generated ON complaint_updates(is_system_generated);