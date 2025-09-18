/*
  # User Interactions Table Migration
  
  Creates the user_interactions table for CitizenVoice Municipal Management System.
  This table logs all user activities and interactions for security and analytics.
  
  ## Features:
  - Complete activity logging
  - Security audit trail
  - User behavior analytics
  - Error tracking
  - Session management
  
  ## Security:
  - Row Level Security enabled
  - Users can only see their own interactions
  - System can log all interactions
*/

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

-- Enable Row Level Security
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert interactions"
  ON user_interactions FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action);
CREATE INDEX IF NOT EXISTS idx_user_interactions_resource_type ON user_interactions(resource_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_success ON user_interactions(success);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_ip_address ON user_interactions(ip_address);

-- Function to extract user agent information
CREATE OR REPLACE FUNCTION extract_user_agent_info(user_agent_string text)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}';
BEGIN
  IF user_agent_string IS NULL THEN
    RETURN result;
  END IF;
  
  -- Browser detection
  IF user_agent_string ILIKE '%chrome%' THEN
    result := result || '{"browser": "Chrome"}';
  ELSIF user_agent_string ILIKE '%firefox%' THEN
    result := result || '{"browser": "Firefox"}';
  ELSIF user_agent_string ILIKE '%safari%' THEN
    result := result || '{"browser": "Safari"}';
  ELSIF user_agent_string ILIKE '%edge%' THEN
    result := result || '{"browser": "Edge"}';
  END IF;
  
  -- OS detection
  IF user_agent_string ILIKE '%windows%' THEN
    result := result || '{"os": "Windows"}';
  ELSIF user_agent_string ILIKE '%mac%' THEN
    result := result || '{"os": "macOS"}';
  ELSIF user_agent_string ILIKE '%linux%' THEN
    result := result || '{"os": "Linux"}';
  ELSIF user_agent_string ILIKE '%android%' THEN
    result := result || '{"os": "Android"}';
  ELSIF user_agent_string ILIKE '%ios%' THEN
    result := result || '{"os": "iOS"}';
  END IF;
  
  -- Device type detection
  IF user_agent_string ILIKE '%mobile%' OR user_agent_string ILIKE '%android%' THEN
    result := result || '{"device": "mobile"}';
  ELSIF user_agent_string ILIKE '%tablet%' OR user_agent_string ILIKE '%ipad%' THEN
    result := result || '{"device": "tablet"}';
  ELSE
    result := result || '{"device": "desktop"}';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;