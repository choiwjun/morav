-- Create schedules table for publish scheduling
-- Each user can have one schedule (shared across all blogs)

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  publish_time TIME NOT NULL DEFAULT '09:00',
  publish_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON public.schedules(user_id);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own schedules
CREATE POLICY "Users can view own schedules"
  ON public.schedules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own schedules
CREATE POLICY "Users can insert own schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own schedules
CREATE POLICY "Users can update own schedules"
  ON public.schedules
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own schedules
CREATE POLICY "Users can delete own schedules"
  ON public.schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at_trigger
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();

-- Add comment
COMMENT ON TABLE public.schedules IS 'User publish schedules for automated content publishing';
