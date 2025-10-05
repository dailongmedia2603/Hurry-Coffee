// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function isAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabaseClient.rpc('is_admin');
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return data === true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const isCallerAdmin = await isAdmin(userSupabaseClient);
    if (!isCallerAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, full_name, password } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'User ID is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update profile (full_name)
    if (full_name) {
      const { error: profileError } = await adminSupabaseClient
        .from('profiles')
        .update({ full_name })
        .eq('id', user_id);
      if (profileError) throw profileError;
    }

    // Update password if provided
    if (password) {
      const { error: authError } = await adminSupabaseClient.auth.admin.updateUserById(
        user_id,
        { password }
      );
      if (authError) throw authError;
    }

    return new Response(JSON.stringify({ message: 'Staff user updated successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-staff-user function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})