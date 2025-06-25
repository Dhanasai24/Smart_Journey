-- Fix existing trips that might have invalid JSON data
UPDATE trips 
SET 
  trip_plan = NULL 
WHERE trip_plan::text = '[object Object]';

UPDATE trips 
SET 
  transport_plan = NULL 
WHERE transport_plan::text = '[object Object]';

UPDATE trips 
SET 
  weather_data = NULL 
WHERE weather_data::text = '[object Object]';

-- Add thumbnail_url for existing trips that don't have it
UPDATE trips
SET thumbnail_url = 'https://source.unsplash.com/1600x900/?' || REPLACE(destination, ' ', ',') || ',travel,landmark'
WHERE thumbnail_url IS NULL;

-- Ensure all required columns exist
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_is_favorite ON trips(is_favorite);
