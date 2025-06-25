-- =====================================================
-- SOCIAL COLUMNS MIGRATION - AUTO MIGRATION
-- =====================================================

-- Add social columns to trips table if they don't exist
DO $$ 
BEGIN
  -- Add visibility column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'visibility') THEN
    ALTER TABLE trips ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
    UPDATE trips SET visibility = 'private' WHERE visibility IS NULL;
    CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility);
    RAISE NOTICE 'Added visibility column to trips table';
  END IF;

  -- Add is_public column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'is_public') THEN
    ALTER TABLE trips ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    UPDATE trips SET is_public = FALSE WHERE is_public IS NULL;
    CREATE INDEX IF NOT EXISTS idx_trips_is_public ON trips(is_public);
    RAISE NOTICE 'Added is_public column to trips table';
  END IF;

  -- Add rating column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'rating') THEN
    ALTER TABLE trips ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
    UPDATE trips SET rating = 0.0 WHERE rating IS NULL;
    CREATE INDEX IF NOT EXISTS idx_trips_rating ON trips(rating);
    RAISE NOTICE 'Added rating column to trips table';
  END IF;

  -- Add total_ratings column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'total_ratings') THEN
    ALTER TABLE trips ADD COLUMN total_ratings INTEGER DEFAULT 0;
    UPDATE trips SET total_ratings = 0 WHERE total_ratings IS NULL;
    RAISE NOTICE 'Added total_ratings column to trips table';
  END IF;

  -- Add tags column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'tags') THEN
    ALTER TABLE trips ADD COLUMN tags TEXT[];
    UPDATE trips SET tags = interests WHERE tags IS NULL AND interests IS NOT NULL;
    UPDATE trips SET tags = ARRAY['General'] WHERE tags IS NULL OR array_length(tags, 1) IS NULL;
    CREATE INDEX IF NOT EXISTS idx_trips_tags ON trips USING GIN(tags);
    RAISE NOTICE 'Added tags column to trips table';
  END IF;

  -- Add activity_completions column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'activity_completions') THEN
    ALTER TABLE trips ADD COLUMN activity_completions JSONB DEFAULT '{}';
    RAISE NOTICE 'Added activity_completions column to trips table';
  END IF;

  -- Add progress_stats column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'progress_stats') THEN
    ALTER TABLE trips ADD COLUMN progress_stats JSONB DEFAULT '{"completed": 0, "total": 0, "percentage": 0}';
    RAISE NOTICE 'Added progress_stats column to trips table';
  END IF;

  RAISE NOTICE 'Social columns migration completed successfully!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration error (non-critical): %', SQLERRM;
END $$;

SELECT 'Social columns migration completed!' as message;
