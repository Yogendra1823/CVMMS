/*
  # Initial Data Migration
  
  Creates initial data and configuration for CitizenVoice Municipal Management System.
  This includes sample data, configuration settings, and system initialization.
  
  ## Features:
  - System configuration
  - Initial logging
  - Sample data for testing
  
  ## Security:
  - Safe initialization
  - No sensitive data exposure
*/

-- Log the successful database creation
DO $$
BEGIN
  -- Insert initial system log
  INSERT INTO user_interactions (
    action,
    details,
    success,
    created_at
  ) VALUES (
    'database_initialization',
    jsonb_build_object(
      'message', 'CitizenVoice database tables created successfully',
      'tables_created', jsonb_build_array(
        'users', 'complaints', 'feedback', 'contact_messages', 
        'user_interactions', 'admin_users', 'complaint_updates'
      ),
      'features', jsonb_build_array(
        'Email confirmation enforcement',
        'Complete activity logging',
        'Role-based admin system',
        'Comprehensive complaint tracking',
        'Enhanced feedback system',
        'Multi-channel contact management',
        'Automatic status updates',
        'Performance optimization'
      ),
      'version', '1.0.0',
      'environment', 'production'
    ),
    true,
    now()
  );
  
  RAISE NOTICE 'CitizenVoice database initialized successfully';
END $$;

-- Create a view for public complaint statistics (no sensitive data)
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

-- Create a view for feedback statistics
CREATE OR REPLACE VIEW public_feedback_stats AS
SELECT 
  COUNT(*) as total_feedback,
  AVG(rating) as average_rating,
  COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
  COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback,
  COUNT(*) FILTER (WHERE is_anonymous = true) as anonymous_feedback
FROM feedback;

-- Grant appropriate permissions for the views
GRANT SELECT ON public_complaint_stats TO authenticated, anon;
GRANT SELECT ON public_feedback_stats TO authenticated, anon;

-- Create indexes for the views
CREATE INDEX IF NOT EXISTS idx_complaints_public_stats ON complaints(status, priority, is_public, resolved_at, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_public_stats ON feedback(rating, is_anonymous);

-- Insert a welcome message for system initialization
INSERT INTO user_interactions (
  action,
  details,
  success,
  created_at
) VALUES (
  'system_welcome',
  jsonb_build_object(
    'message', 'Welcome to CitizenVoice Municipal Management System',
    'description', 'Your secure platform for municipal services and citizen engagement',
    'features_available', jsonb_build_array(
      'Report municipal issues and complaints',
      'Track complaint status in real-time',
      'Provide feedback on municipal services',
      'Contact municipal departments',
      'Secure user authentication with email confirmation',
      'Complete activity logging for transparency'
    ),
    'security_features', jsonb_build_array(
      'Email confirmation required for all users',
      'Row-level security on all tables',
      'Complete audit trail of all activities',
      'Secure data isolation between users',
      'Role-based admin access control'
    ),
    'website_url', 'https://citizenvoice.netlify.app',
    'support_email', 'support@citizenvoice.org'
  ),
  true,
  now()
);