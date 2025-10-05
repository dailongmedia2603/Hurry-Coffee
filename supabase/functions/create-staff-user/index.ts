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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { email, password, full_name, role } = await req.json();
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Email, password, and full name are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Gửi thông tin `full_name` và `role` vào user_metadata
    // Trigger `handle_new_user` sẽ đọc từ đây để tạo profile
    const { data: { user }, error: createError } = await adminSupabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        role: role || 'staff'
      }
    });

    if (createError) throw createError;
    if (!user) throw new Error("Failed to create user.");

    // Không cần bước update profile ở đây nữa, trigger đã xử lý tất cả.

    return new Response(JSON.stringify({ message: 'Staff user created successfully.', user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-staff-user function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})