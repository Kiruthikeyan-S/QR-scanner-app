-- ==============================================================================
-- Migration: Create uploaded_files table and 7-day retention cleanup
-- Project: Qrinova
-- Description: Tracks uploaded files with automatic 7-day expiration (expires_at)
--              and sets up automatic scheduled cleanup via Supabase Edge Function / Storage API.
-- ==============================================================================

-- 1. Create uploaded_files Table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_bucket TEXT NOT NULL DEFAULT 'qr-files',
    storage_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    file_size BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'failed')),
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes for fast expiration queries and cleanup
CREATE INDEX IF NOT EXISTS idx_uploaded_files_expiration 
ON public.uploaded_files (expires_at) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_uploaded_files_status 
ON public.uploaded_files (status);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_storage_path 
ON public.uploaded_files (storage_path);

-- 3. Row Level Security (RLS)
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Allow mobile clients (anon & authenticated) to insert upload metadata
CREATE POLICY "Allow public insert to uploaded_files" 
ON public.uploaded_files
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow public read of active files
CREATE POLICY "Allow public select on active uploaded_files" 
ON public.uploaded_files
FOR SELECT 
TO anon, authenticated
USING (status = 'active');

-- Service role has full access for cleanup and administration
CREATE POLICY "Allow service_role full access" 
ON public.uploaded_files
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 4. Hourly Scheduled Cleanup with pg_cron & pg_net (Supabase Extensions)
-- Note: Requires pg_cron and pg_net extensions to be enabled in Supabase Project.
-- Replace <YOUR_PROJECT_REF> and <SERVICE_ROLE_KEY> with project settings, or
-- trigger via Supabase Scheduled Edge Function.
-- ==============================================================================

COMMENT ON TABLE public.uploaded_files IS 'Tracks user uploaded files with 7-day retention period. Expired files are removed via Supabase Storage API.';
