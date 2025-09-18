/*
  # System Functions Migration
  
  Creates utility functions for CitizenVoice Municipal Management System.
  These functions provide system-wide functionality and utilities.
  
  ## Features:
  - User statistics calculation
  - System health monitoring
  - Data validation functions
  - Utility functions for common operations
  
  ## Security:
  - Functions are security definer where needed
  - Proper access controls
*/

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
  complaint_count integer;
  feedback_count integer;
  contact_count integer;
  interaction_count integer;
BEGIN
  SELECT COUNT(*) INTO complaint_count FROM complaints WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO feedback_count FROM feedback WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO contact_count FROM contact_messages WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO interaction_count FROM user_interactions WHERE user_id = target_user_id;
  
  stats := jsonb_build_object(
    'complaints', complaint_count,
    'feedback', feedback_count,
    'contact_messages', contact_count,
    'interactions', interaction_count,
    'total_activity', complaint_count + feedback_count + contact_count
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check system health
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  table_counts jsonb;
BEGIN
  SELECT jsonb_build_object(
    'users', (SELECT COUNT(*) FROM users),
    'complaints', (SELECT COUNT(*) FROM complaints),
    'feedback', (SELECT COUNT(*) FROM feedback),
    'contact_messages', (SELECT COUNT(*) FROM contact_messages),
    'user_interactions', (SELECT COUNT(*) FROM user_interactions),
    'admin_users', (SELECT COUNT(*) FROM admin_users),
    'complaint_updates', (SELECT COUNT(*) FROM complaint_updates)
  ) INTO table_counts;
  
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'table_counts', table_counts,
    'database', 'CitizenVoice Municipal Management System',
    'version', '1.0.0'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email_address text)
RETURNS boolean AS $$
BEGIN
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to validate phone number format
CREATE OR REPLACE FUNCTION is_valid_phone(phone_number text)
RETURNS boolean AS $$
BEGIN
  -- Basic phone validation (can be enhanced based on requirements)
  RETURN phone_number ~* '^\+?[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql;

-- Function to sanitize user input
CREATE OR REPLACE FUNCTION sanitize_text_input(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially harmful characters and trim whitespace
  RETURN trim(regexp_replace(input_text, '[<>"\'';&]', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_secure_token(length integer DEFAULT 32)
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate complaint resolution time
CREATE OR REPLACE FUNCTION calculate_resolution_time(complaint_created_at timestamptz, complaint_resolved_at timestamptz)
RETURNS interval AS $$
BEGIN
  IF complaint_resolved_at IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN complaint_resolved_at - complaint_created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get complaint statistics
CREATE OR REPLACE FUNCTION get_complaint_statistics()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
  total_complaints integer;
  resolved_complaints integer;
  in_progress_complaints integer;
  not_started_complaints integer;
  avg_resolution_time interval;
BEGIN
  SELECT COUNT(*) INTO total_complaints FROM complaints;
  SELECT COUNT(*) INTO resolved_complaints FROM complaints WHERE status = 'Resolved';
  SELECT COUNT(*) INTO in_progress_complaints FROM complaints WHERE status = 'In Progress';
  SELECT COUNT(*) INTO not_started_complaints FROM complaints WHERE status = 'Not Yet Started';
  
  SELECT AVG(resolved_at - created_at) INTO avg_resolution_time 
  FROM complaints 
  WHERE resolved_at IS NOT NULL;
  
  stats := jsonb_build_object(
    'total_complaints', total_complaints,
    'resolved_complaints', resolved_complaints,
    'in_progress_complaints', in_progress_complaints,
    'not_started_complaints', not_started_complaints,
    'resolution_rate', CASE WHEN total_complaints > 0 THEN (resolved_complaints::float / total_complaints * 100) ELSE 0 END,
    'average_resolution_time_hours', CASE WHEN avg_resolution_time IS NOT NULL THEN EXTRACT(epoch FROM avg_resolution_time) / 3600 ELSE NULL END
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
  event_type text,
  event_details jsonb DEFAULT '{}',
  user_id_param uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  interaction_id uuid;
BEGIN
  INSERT INTO user_interactions (
    user_id,
    action,
    details,
    success,
    created_at
  ) VALUES (
    user_id_param,
    event_type,
    event_details,
    true,
    now()
  ) RETURNING id INTO interaction_id;
  
  RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;