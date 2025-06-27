-- Fix duplicate meal planner entries
-- This script should be run in your Supabase SQL editor

-- First, let's see if there are any duplicate user_id entries
SELECT user_id, COUNT(*) as count
FROM meal_planner
GROUP BY user_id
HAVING COUNT(*) > 1;

-- If duplicates exist, keep the most recent entry for each user
DELETE FROM meal_planner
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM meal_planner
    ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id
ALTER TABLE meal_planner 
ADD CONSTRAINT meal_planner_user_id_unique UNIQUE (user_id);

-- Verify the fix
SELECT user_id, COUNT(*) as count
FROM meal_planner
GROUP BY user_id
HAVING COUNT(*) > 1; 