// ==============================================================================
// Supabase Edge Function: cleanup-expired-files
// Project: Qrinova
// Schedule: Cron (Hourly: 0 * * * *)
// Description: Queries expired files (expires_at <= now() AND status = 'active'),
//              deletes objects from Supabase Storage using the Storage API (.remove()),
//              and marks the metadata record as 'deleted'.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side admin client using service_role key (strictly on server/edge)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const nowIso = new Date().toISOString();

    // 1. Fetch active files where expires_at has passed
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('id, storage_bucket, storage_path, expires_at')
      .eq('status', 'active')
      .lte('expires_at', nowIso)
      .limit(200);

    if (fetchError) {
      console.error('[CLEANUP FETCH ERROR]', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired files found to clean up.',
          cleaned_count: 0,
          timestamp: nowIso,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLEANUP] Found ${expiredFiles.length} expired file(s) to remove.`);

    // 2. Group files by storage bucket
    const byBucket: Record<string, { id: string; storage_path: string }[]> = {};
    for (const file of expiredFiles) {
      const bucket = file.storage_bucket || 'qr-files';
      if (!byBucket[bucket]) byBucket[bucket] = [];
      byBucket[bucket].push({ id: file.id, storage_path: file.storage_path });
    }

    let totalDeleted = 0;
    const errors: any[] = [];

    // 3. Delete files through the Supabase Storage API (.remove())
    for (const [bucket, files] of Object.entries(byBucket)) {
      const paths = files.map((f) => f.storage_path);

      try {
        // Storage API remove call: Removes binary object and internal storage metadata
        const { error: removeError } = await supabase.storage
          .from(bucket)
          .remove(paths);

        if (removeError) {
          console.error(`[STORAGE REMOVE ERROR] Bucket: ${bucket}`, removeError);
          errors.push({ bucket, error: removeError.message });
          // If storage removal failed, keep status as 'active' so next hourly cron retries
          continue;
        }

        // 4. On successful storage deletion, update metadata status to 'deleted'
        const successIds = files.map((f) => f.id);
        const { error: updateError } = await supabase
          .from('uploaded_files')
          .update({
            status: 'deleted',
            deleted_at: new Date().toISOString(),
          })
          .in('id', successIds);

        if (updateError) {
          console.warn(`[METADATA UPDATE ERROR] Bucket: ${bucket}`, updateError);
        }

        totalDeleted += files.length;
        console.log(`[CLEANUP SUCCESS] Deleted ${files.length} file(s) from bucket "${bucket}".`);
      } catch (err: any) {
        console.error(`[BATCH CLEANUP EXCEPTION] Bucket: ${bucket}`, err);
        errors.push({ bucket, error: err.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleaned_count: totalDeleted,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (globalErr: any) {
    console.error('[CLEANUP GLOBAL ERROR]', globalErr);
    return new Response(
      JSON.stringify({ error: globalErr.message || 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
