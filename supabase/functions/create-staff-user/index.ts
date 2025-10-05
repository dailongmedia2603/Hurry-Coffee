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

    // Bước 1: Tạo người dùng trong hệ thống xác thực.
    const { data: { user }, error: createError } = await adminSupabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;
    if (!user) throw new Error("Failed to create user in authentication system.");

    // Bước 2: Cập nhật hồ sơ đã được trigger 'handle_new_user' tự động tạo.
    // Trigger sẽ tạo một hồ sơ cơ bản, và chúng ta cập nhật nó với vai trò và tên đầy đủ.
    const { error: profileError } = await adminSupabaseClient
      .from('profiles')
      .update({
        full_name: full_name,
        role: role || 'staff'
      })
      .eq('id', user.id);

    // Bước 3: Nếu cập nhật hồ sơ thất bại, xóa người dùng để dọn dẹp.
    if (profileError) {
      await adminSupabaseClient.auth.admin.deleteUser(user.id);
      throw profileError;
    }

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