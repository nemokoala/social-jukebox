-- 1. Create 'rooms' table
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS for rooms and allow anonymous access
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access on rooms" ON public.rooms FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert access on rooms" ON public.rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on rooms" ON public.rooms FOR UPDATE TO anon USING (true);


-- 2. Create 'playlist' table
CREATE TABLE public.playlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for playlist and allow anonymous access
ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access on playlist" ON public.playlist FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert access on playlist" ON public.playlist FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on playlist" ON public.playlist FOR UPDATE TO anon USING (true);


-- 3. Enable realtime for both tables
-- (If publication 'supabase_realtime' does not exist, Supabase UI handles it, but this ensures it's added if it exists)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.rooms, public.playlist;
COMMIT;
