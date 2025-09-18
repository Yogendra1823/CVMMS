/*
  # Complete CitizenVoice Database Schema
  
  Creates all necessary tables for CitizenVoice Municipal Management System
  with proper email handling and no email dependency issues.
  
  1. New Tables
    - `users` - User profiles and information
    - `complaints` - Citizen complaints and issues
    - `feedback` - User feedback and ratings
    - `contact_messages` - Contact form submissions
    - `user_interactions` - Activity logging
    - `admin_users` - Administrative users
    - `complaint_updates` - Complaint change tracking
  
  2. Security
    - Enable RLS on all tables
    - Add policies for data access control
    - Secure user data isolation
  
  3. Email Configuration
    - Disable email confirmation requirement
    - Allow immediate login after registration
    - Remove email dependencies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  profile_completed boolean DEFAULT false,
  email_confirmed boolean DEFAULT true,
  login_count integer DEFAULT 0,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  description text NOT NULL,
  category text,
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status text DEFAULT 'Not Yet Started' CHECK (status IN ('Not Yet Started', 'In Progress', 'Resolved')),
  location text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  department text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_summary text,
  citizen_satisfaction_rating integer CHECK (citizen_satisfaction_rating >= 1 AND citizen_satisfaction_rating <= 5),
  citizen_feedback text,
  is_public boolean DEFAULT true,
  is_urgent boolean DEFAULT false,
  attachments jsonb DEFAULT '[]',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own complaints"
  ON complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
  ON complaints FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  category text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_anonymous boolean DEFAULT false,
  department text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'responded', 'closed')),
  admin_response text,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  response_date timestamptz,
  is_featured boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  department text,
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'responded', 'closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_response text,
  response_date timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contact messages"
  ON contact_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create contact messages"
  ON contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own contact messages"
  ON contact_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  success boolean DEFAULT true,
  error_message text,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  operating_system text,
  country text,
  city text,
  referrer text,
  url text,
  method text,
  status_code integer,
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert interactions"
  ON user_interactions FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'moderator', 'viewer')),
  department text,
  permissions jsonb DEFAULT '{}',
  access_level integer DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 10),
  can_manage_users boolean DEFAULT false,
  can_manage_complaints boolean DEFAULT false,
  can_manage_feedback boolean DEFAULT false,
  can_view_analytics boolean DEFAULT false,
  can_export_data boolean DEFAULT false,
  two_factor_enabled boolean DEFAULT false,
  last_login_at timestamptz,
  login_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  UNIQUE(user_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin data"
  ON admin_users FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

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
  cost_impact numeric(12, 2),
  time_impact_hours integer,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_complaints_is_urgent ON complaints(is_urgent);
CREATE INDEX IF NOT EXISTS idx_complaints_public_stats ON complaints(status, priority, is_public, resolved_at, created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_department ON feedback(department);
CREATE INDEX IF NOT EXISTS idx_feedback_is_featured ON feedback(is_featured);
CREATE INDEX IF NOT EXISTS idx_feedback_public_stats ON feedback(rating, is_anonymous);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_department ON contact_messages(department);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON contact_messages(assigned_to);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action);
CREATE INDEX IF NOT EXISTS idx_user_interactions_resource_type ON user_interactions(resource_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_success ON user_interactions(success);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_ip_address ON user_interactions(ip_address);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_access_level ON admin_users(access_level);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_user_id ON complaint_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_admin_user_id ON complaint_updates(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_update_type ON complaint_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_created_at ON complaint_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_is_public ON complaint_updates(is_public);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_is_system_generated ON complaint_updates(is_system_generated);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'Resolved' AND (OLD.status IS NULL OR OLD.status != 'Resolved') THEN
    NEW.resolved_at = now();
  ELSIF NEW.status != 'Resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration without email confirmation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, email_confirmed, created_at, updated_at)
  VALUES (NEW.id, NEW.email, true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    email_confirmed = true,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-confirm users (disable email confirmation)
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm all new users
  NEW.email_confirmed_at = now();
  NEW.confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

CREATE TRIGGER update_complaints_updated_at_trigger
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_complaints_updated_at();

CREATE TRIGGER update_feedback_updated_at_trigger
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

CREATE TRIGGER update_contact_messages_updated_at_trigger
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_contact_messages_updated_at();

CREATE TRIGGER update_admin_users_updated_at_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();

CREATE TRIGGER handle_complaint_status_changes_trigger
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION handle_complaint_status_change();

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to auto-confirm users (disable email confirmation requirement)
CREATE OR REPLACE TRIGGER auto_confirm_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_user();

-- Create views for public statistics
CREATE OR REPLACE VIEW public_complaint_stats AS
SELECT 
  COUNT(*) as total_complaints,
  COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_complaints,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_complaints,
  COUNT(*) FILTER (WHERE status = 'Not Yet Started') as pending_complaints,
  COUNT(*) FILTER (WHERE priority = 'Critical') as critical_complaints,
  COUNT(*) FILTER (WHERE priority = 'High') as high_priority_complaints,
  AVG(EXTRACT(epoch FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours
FROM complaints
WHERE is_public = true;

CREATE OR REPLACE VIEW public_feedback_stats AS
SELECT 
  COUNT(*) as total_feedback,
  AVG(rating) as average_rating,
  COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
  COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback,
  COUNT(*) FILTER (WHERE is_anonymous = true) as anonymous_feedback
FROM feedback;

-- Grant permissions
GRANT SELECT ON public_complaint_stats TO authenticated, anon;
GRANT SELECT ON public_feedback_stats TO authenticated, anon;