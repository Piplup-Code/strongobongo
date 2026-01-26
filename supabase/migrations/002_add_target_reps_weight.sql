-- Add target_reps and target_weight_kg to routine_exercises
ALTER TABLE routine_exercises
ADD COLUMN IF NOT EXISTS target_reps INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5, 2) DEFAULT NULL;

-- Update default rest time from 90 to 30 seconds for new records
ALTER TABLE routine_exercises
ALTER COLUMN target_rest_seconds SET DEFAULT 30;
