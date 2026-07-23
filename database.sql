-- =============================================================================
-- MORNING TASK DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Centralized Cloud Backend Schema for Users, Progress, Tasks, and Feedbacks
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table Definitions
-- -----------------------------------------------------------------------------

-- USERS TABLE
-- Stores profile details, credentials, and demographics.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Demographics/profile details (to prevent data loss on state flush)
    country TEXT DEFAULT '',
    state TEXT DEFAULT '',
    city TEXT DEFAULT '',
    gender TEXT DEFAULT 'Not Specified'
);

-- USER PROGRESS TABLE
-- Tracks individual points, levels, and streaks.
CREATE TABLE user_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL
);

-- TASKS TABLE
-- Stores individual quests assigned to users, completion status, and expirations.
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- Holds serialized JSON for task meta: title, icon, desc, xp, difficulty
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- FEEDBACKS TABLE
-- Stores user ratings and feedback messages.
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. Performance Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_user_progress_points ON user_progress(points DESC);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) configuration notes
-- -----------------------------------------------------------------------------
-- By default, Supabase does not enforce RLS unless enabled explicitly.
-- Since this client queries these tables using credential-based custom authentication 
-- (storing and checking password hashes via the anon public key), RLS is left
-- disabled. 
--
-- If migrating to Supabase Auth JWT later, you can enable RLS as follows:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
--
-- Example Policy for tasks:
-- CREATE POLICY "Users can only access their own tasks"
-- ON tasks FOR ALL
-- TO authenticated
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());
