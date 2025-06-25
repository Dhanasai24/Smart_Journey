-- =====================================================
-- SMART JOURNEY AI TRIP PLANNER - COMPLETE DATABASE SCHEMA
-- This script is designed for PostgreSQL.
-- It will create tables, add missing columns, and update functions/triggers.
-- IMPORTANT: Existing tables WILL NOT be dropped.
-- Data will be preserved, but new columns will be added and existing data
-- might be updated (e.g., NULLs to defaults, JSON cleaning).
-- =====================================================

-- --- Drop existing triggers (important to drop before functions/tables)
-- These need to be dropped before functions because triggers depend on functions.
-- Drop specific triggers on specific tables.
DROP TRIGGER IF EXISTS update_trip_rating_trigger ON trip_ratings;
DROP TRIGGER IF EXISTS update_trip_progress ON trip_activities;
DROP TRIGGER IF EXISTS update_traveler_matches_updated_at ON traveler_matches;
DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON chat_rooms;
DROP TRIGGER IF EXISTS update_travel_preferences_updated_at ON travel_preferences;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;


-- --- Drop existing functions (to allow recreation/updates)
-- Drop specific functions with their argument types.
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_trip_progress(INTEGER);
DROP FUNCTION IF EXISTS update_trip_rating();

-- Define wrapper functions for triggers, to ensure arguments are handled robustly.
-- These must be dropped if they exist before being redefined.
DROP FUNCTION IF EXISTS calculate_trip_progress_wrapper();
DROP FUNCTION IF EXISTS update_trip_rating_wrapper();


-- --- Table Creation (CREATE TABLE IF NOT EXISTS will skip if already present)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  google_id VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trips table with ALL columns
CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'My Trip',
  destination VARCHAR(255) NOT NULL,
  start_location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  days INTEGER,
  budget DECIMAL(12,2),
  travelers INTEGER DEFAULT 1,
  food_preferences TEXT[],
  interests TEXT[],
  special_interest TEXT,
  trip_plan JSONB,
  transport_plan JSONB,
  weather_data JSONB,
  status VARCHAR(50) DEFAULT 'planned',
  is_favorite BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  unsplash_photo_id VARCHAR(255),
  activity_completions JSONB DEFAULT '{}',
  progress_stats JSONB DEFAULT '{"completed": 0, "total": 0, "percentage": 0}',
  visibility VARCHAR(20) DEFAULT 'private',
  is_public BOOLEAN DEFAULT FALSE,
  is_social BOOLEAN DEFAULT FALSE,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 1,
  social_visibility VARCHAR(20) DEFAULT 'private',
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  destination_coordinates POINT,
  tags TEXT[],
  difficulty_level VARCHAR(20) DEFAULT 'moderate',
  season VARCHAR(20),
  group_type VARCHAR(50) DEFAULT 'solo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trip_activities table
CREATE TABLE IF NOT EXISTS trip_activities (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  activity_time VARCHAR(20),
  activity_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  duration VARCHAR(50),
  activity_type VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trip_accommodations table
CREATE TABLE IF NOT EXISTS trip_accommodations (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  hotel_name VARCHAR(255) NOT NULL,
  address TEXT,
  price_per_night DECIMAL(10,2),
  rating DECIMAL(3,1),
  amenities TEXT[],
  description TEXT,
  booking_url TEXT,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  preferred_budget_range VARCHAR(50),
  favorite_destinations TEXT[],
  travel_style VARCHAR(100),
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  preferred_accommodation_type VARCHAR(100),
  preferred_transport_modes TEXT[],
  language_preferences TEXT[],
  currency_preference VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trip_sharing table
CREATE TABLE IF NOT EXISTS trip_sharing (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  shared_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email VARCHAR(255),
  permission_level VARCHAR(20) DEFAULT 'view',
  is_accepted BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create session table
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create user_profiles table (ESSENTIAL for social features)
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  age INTEGER,
  age_range VARCHAR(20),
  gender VARCHAR(20),
  location_city VARCHAR(255),
  location_country VARCHAR(255),
  current_location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  languages TEXT[],
  travel_style VARCHAR(100),
  budget_range VARCHAR(50),
  interests TEXT[],
  profile_visibility VARCHAR(20) DEFAULT 'public',
  is_discoverable BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'offline',
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create travel_preferences table
CREATE TABLE IF NOT EXISTS travel_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  preferred_destinations TEXT[],
  travel_months TEXT[],
  accommodation_types TEXT[],
  transport_preferences TEXT[],
  activity_preferences TEXT[],
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  group_size_preference VARCHAR(50),
  travel_pace VARCHAR(50),
  budget_range VARCHAR(50),
  match_radius_km INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id BIGSERIAL PRIMARY KEY,
  room_name VARCHAR(255),
  room_type VARCHAR(50) DEFAULT 'direct',
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id BIGSERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create traveler_matches table
CREATE TABLE IF NOT EXISTS traveler_matches (
  id BIGSERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  trip1_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  trip2_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2),
  match_factors JSONB,
  destination_similarity DECIMAL(5,2) DEFAULT 0,
  date_overlap_days INTEGER DEFAULT 0,
  interest_overlap_count INTEGER DEFAULT 0,
  budget_compatibility DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id, trip1_id, trip2_id),
  CHECK (user1_id != user2_id)
);

-- Create user_locations table for real-time tracking
CREATE TABLE IF NOT EXISTS user_locations (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  location_name VARCHAR(255),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, is_current)
);

-- Create trip_participants table for social trips
CREATE TABLE IF NOT EXISTS trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'participant',
  status VARCHAR(50) DEFAULT 'pending',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);

-- Create trip_ratings table for detailed rating system
CREATE TABLE IF NOT EXISTS trip_ratings (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_text TEXT,
  rating_categories JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);

-- Create trip_favorites table for user favorites
CREATE TABLE IF NOT EXISTS trip_favorites (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);

-- Create trip_views table for analytics
CREATE TABLE IF NOT EXISTS trip_views (
  id BIGSERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  viewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  viewer_ip INET,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create match_notifications table
CREATE TABLE IF NOT EXISTS match_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES traveler_matches(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) DEFAULT 'new_match',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- Add missing columns to existing tables (if they don't exist)
-- This section is crucial for updating existing database schemas gracefully.
-- It uses a DO $$ BEGIN ... END $$ block to allow for more complex logic
-- and error handling for column additions.
DO $$
BEGIN
  -- Add social columns one by one with error handling
  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS activity_completions JSONB DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN
    NULL; -- Column already exists, do nothing
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS progress_stats JSONB DEFAULT '{"completed": 0, "total": 0, "percentage": 0}';
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_social BOOLEAN DEFAULT FALSE;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS social_visibility VARCHAR(20) DEFAULT 'private';
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_coordinates POINT;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS tags TEXT[];
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'moderate';
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS season VARCHAR(20);
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_type VARCHAR(50) DEFAULT 'solo';
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
END $$;

-- --- Data Cleaning and Defaults for existing rows
-- This ensures newly added columns or existing columns with NULLs get proper default values.
UPDATE trips
SET trip_plan = NULL
WHERE trip_plan IS NOT NULL
AND trip_plan::text IN ('[object Object]', 'undefined', 'null', '""', '{}');

UPDATE trips
SET transport_plan = NULL
WHERE transport_plan IS NOT NULL
AND transport_plan::text IN ('[object Object]', 'undefined', 'null', '""', '{}');

UPDATE trips
SET weather_data = NULL
WHERE weather_data IS NOT NULL
AND weather_data::text IN ('[object Object]', 'undefined', 'null', '""', '{}');

UPDATE trips SET is_favorite = FALSE WHERE is_favorite IS NULL;
UPDATE trips SET status = 'planned' WHERE status IS NULL OR status = '';
UPDATE trips SET travelers = 1 WHERE travelers IS NULL OR travelers = 0;
UPDATE trips SET title = 'Trip to ' || destination WHERE title IS NULL OR title = '';
UPDATE trips SET visibility = 'private' WHERE visibility IS NULL;
UPDATE trips SET is_public = FALSE WHERE is_public IS NULL;
UPDATE trips SET rating = 0.0 WHERE rating IS NULL;
UPDATE trips SET total_ratings = 0 WHERE total_ratings IS NULL;
UPDATE trips SET progress_percentage = 0 WHERE progress_percentage IS NULL;
UPDATE trips SET activity_completions = '{}' WHERE activity_completions IS NULL;
UPDATE trips SET progress_stats = '{"completed": 0, "total": 0, "percentage": 0}' WHERE progress_stats IS NULL;

-- Update tags based on interests for existing data
UPDATE trips SET tags = interests WHERE tags IS NULL AND interests IS NOT NULL;
UPDATE trips SET tags = ARRAY['General'] WHERE tags IS NULL OR array_length(tags, 1) IS NULL;

-- --- Create indexes for performance (IF NOT EXISTS prevents errors if already present)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
CREATE INDEX IF NOT EXISTS idx_trips_is_favorite ON trips(is_favorite);
CREATE INDEX IF NOT EXISTS idx_trips_unsplash_photo_id ON trips(unsplash_photo_id);
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility);
CREATE INDEX IF NOT EXISTS idx_trips_is_public ON trips(is_public);
CREATE INDEX IF NOT EXISTS idx_trips_rating ON trips(rating);
CREATE INDEX IF NOT EXISTS idx_trips_tags ON trips USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_trips_interests ON trips USING GIN(interests);

CREATE INDEX IF NOT EXISTS idx_trip_activities_trip_id ON trip_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_day_number ON trip_activities(day_number);
CREATE INDEX IF NOT EXISTS idx_trip_activities_type ON trip_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_trip_activities_completed ON trip_activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_trip_id ON trip_accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_day_number ON trip_accommodations(day_number);
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_booked ON trip_accommodations(is_booked);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_sharing_trip_id ON trip_sharing(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_sharing_shared_by ON trip_sharing(shared_by);
CREATE INDEX IF NOT EXISTS idx_trip_sharing_token ON trip_sharing(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_sharing_email ON trip_sharing(shared_with_email);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_profiles_discoverable ON user_profiles(is_discoverable);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_user_profiles_languages ON user_profiles USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_travel_preferences_user_id ON travel_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_preferences_destinations ON travel_preferences USING GIN(preferred_destinations);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON chat_rooms(is_active);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(is_active);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_traveler_matches_user1 ON traveler_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_traveler_matches_user2 ON traveler_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_traveler_matches_trip1 ON traveler_matches(trip1_id);
CREATE INDEX IF NOT EXISTS idx_traveler_matches_trip2 ON traveler_matches(trip2_id);
CREATE INDEX IF NOT EXISTS idx_traveler_matches_score ON traveler_matches(match_score);
CREATE INDEX IF NOT EXISTS idx_traveler_matches_status ON traveler_matches(status);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_current ON user_locations(is_current);
CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_status ON trip_participants(status);

CREATE INDEX IF NOT EXISTS idx_trip_ratings_trip_id ON trip_ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_ratings_user_id ON trip_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_ratings_rating ON trip_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_trip_favorites_trip_id ON trip_favorites(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_favorites_user_id ON trip_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_views_trip_id ON trip_views(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_views_viewer_id ON trip_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_trip_views_viewed_at ON trip_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_match_notifications_user_id ON match_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_match_id ON match_notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_read ON match_notifications(is_read);

-- --- Create functions for database operations (CREATE OR REPLACE will update if already present)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Original function to calculate trip progress (now called by wrapper)
CREATE OR REPLACE FUNCTION calculate_trip_progress(trip_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total_activities INTEGER;
  completed_activities INTEGER;
  progress INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_activities
  FROM trip_activities
  WHERE trip_id = trip_id_param;

  SELECT COUNT(*) INTO completed_activities
  FROM trip_activities
  WHERE trip_id = trip_id_param AND is_completed = true;

  IF total_activities = 0 THEN
    progress := 0;
  ELSE
    progress := ROUND((completed_activities::DECIMAL / total_activities::DECIMAL) * 100);
  END IF;

  UPDATE trips SET progress_percentage = progress WHERE id = trip_id_param;

  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Wrapper function for calculate_trip_progress, to be called by the trigger
CREATE OR REPLACE FUNCTION calculate_trip_progress_wrapper()
RETURNS TRIGGER AS $$
DECLARE
  target_trip_id INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_trip_id := OLD.trip_id;
  ELSE
    target_trip_id := NEW.trip_id;
  END IF;

  PERFORM calculate_trip_progress(target_trip_id);
  RETURN NULL; -- AFTER triggers typically return NULL
END;
$$ LANGUAGE plpgsql;


-- Corrected: Removed duplicate 'OR'
CREATE OR REPLACE FUNCTION update_trip_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  rating_count INTEGER;
  target_trip_id INTEGER; -- Declare variable for trip_id
BEGIN
  -- Determine the trip_id based on the operation type
  IF TG_OP = 'DELETE' THEN
    target_trip_id := OLD.trip_id;
  ELSE
    target_trip_id := NEW.trip_id;
  END IF;

  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, rating_count
  FROM trip_ratings
  WHERE trip_id = target_trip_id; -- Use the determined trip_id

  UPDATE trips
  SET rating = COALESCE(avg_rating, 0.0),
      total_ratings = rating_count
  WHERE id = target_trip_id;

  RETURN NULL; -- AFTER triggers typically return NULL
END;
$$ LANGUAGE plpgsql;


-- Wrapper function for update_trip_rating, to be called by the trigger
CREATE OR REPLACE FUNCTION update_trip_rating_wrapper()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_trip_rating(); -- Call the actual rating function
  RETURN NULL; -- AFTER triggers typically return NULL
END;
$$ LANGUAGE plpgsql;


-- --- Create triggers (AFTER dropping existing ones above)
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_preferences_updated_at
  BEFORE UPDATE ON travel_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traveler_matches_updated_at
  BEFORE UPDATE ON traveler_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate trip progress when activities are updated
-- Now calls the wrapper function
CREATE TRIGGER update_trip_progress
  AFTER INSERT OR UPDATE OR DELETE ON trip_activities
  FOR EACH ROW EXECUTE FUNCTION calculate_trip_progress_wrapper();

-- Trigger to auto-update trip rating when ratings are added/updated
-- Now calls the wrapper function
CREATE TRIGGER update_trip_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trip_ratings
  FOR EACH ROW EXECUTE FUNCTION update_trip_rating_wrapper();

-- Final success message
SELECT 'Database schema updated successfully!' as status;
SELECT 'All tables, indexes, functions, and triggers are ready!' as message;
SELECT 'Social travel features enabled!' as social_status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';