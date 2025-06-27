-- Supabase Database Schema for Meal Planner

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create meal_planner table
CREATE TABLE IF NOT EXISTS meal_planner (
    id TEXT PRIMARY KEY DEFAULT 'default',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe table (renamed from recipes)
CREATE TABLE IF NOT EXISTS recipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ingredients TEXT[] DEFAULT '{}',
    aromatics TEXT[] DEFAULT '{}',
    condiments TEXT[] DEFAULT '{}',
    time TEXT,
    instructions TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_meal_planner_updated_at 
    BEFORE UPDATE ON meal_planner 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_updated_at 
    BEFORE UPDATE ON recipe 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE meal_planner ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_planner (user can only access their own data)
CREATE POLICY "Users can view own meal planner" ON meal_planner
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal planner" ON meal_planner
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal planner" ON meal_planner
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal planner" ON meal_planner
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for recipe (user can only access their own data)
CREATE POLICY "Users can view own recipes" ON recipe
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON recipe
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipe
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipe
    FOR DELETE USING (auth.uid() = user_id);

-- Insert default meal planner record (will be created per user when they first access)
-- Note: This will be handled by the application logic 