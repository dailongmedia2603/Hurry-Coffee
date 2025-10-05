// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm kiểm tra quyền admin
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
    // 1. Tạo client với quyền của người dùng đang gọi function
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Kiểm tra xem người dùng có phải là admin không
    const isCallerAdmin = await isAdmin(userSupabaseClient);
    if (!isCallerAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 3. Nếu là admin, tiếp tục xử lý
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Tạo client với service_role key để có toàn quyền
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Tạo người dùng mới trong auth.users
    const { data: { user }, error: createError } = await adminSupabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Tự động xác thực email
    });

    if (createError) throw createError;
    if (!user) throw new Error("Failed to create user.");

    // 6. Cập nhật vai trò trong public.profiles
    // Trigger `handle_new_user` sẽ tạo dòng profile, ta chỉ cần cập nhật role
    const { error: updateError } = await adminSupabaseClient
      .from('profiles')
      .update({ role: 'staff' })
      .eq('id', user.id);

    if (updateError) {
      // Nếu cập nhật thất bại, cố gắng xóa người dùng vừa tạo để tránh rác
      await adminSupabaseClient.auth.admin.deleteUser(user.id);
      throw updateError;
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