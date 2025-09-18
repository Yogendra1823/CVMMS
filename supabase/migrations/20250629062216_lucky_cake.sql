/*
  # Admin Users Table Migration
  
  Creates the admin_users table for CitizenVoice Municipal Management System.
  This table manages administrative users and their permissions.
  
  ## Features:
  - Role-based access control
  - Granular permissions
  - Department assignment
  - Activity tracking
  - Multi-level admin hierarchy
  
  ## Security:
  - Row Level Security enabled
  - Only admins can access admin data
  - Super admin controls
*/

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

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_access_level ON admin_users(access_level);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at DESC);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps
CREATE TRIGGER update_admin_users_updated_at_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();

-- Function to create initial admin user
CREATE OR REPLACE FUNCTION create_initial_admin(admin_email text)
RETURNS jsonb AS $$
DECLARE
  admin_user_record auth.users%ROWTYPE;
  result jsonb;
BEGIN
  -- Find user by email
  SELECT * INTO admin_user_record FROM auth.users WHERE email = admin_email;
  
  IF admin_user_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || admin_email
    );
  END IF;
  
  -- Create admin record
  INSERT INTO admin_users (
    user_id,
    role,
    access_level,
    can_manage_users,
    can_manage_complaints,
    can_manage_feedback,
    can_view_analytics,
    can_export_data,
    is_active
  ) VALUES (
    admin_user_record.id,
    'super_admin',
    10,
    true,
    true,
    true,
    true,
    true,
    true
  ) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    access_level = 10,
    can_manage_users = true,
    can_manage_complaints = true,
    can_manage_feedback = true,
    can_view_analytics = true,
    can_export_data = true,
    is_active = true,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user created successfully',
    'user_id', admin_user_record.id,
    'email', admin_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;