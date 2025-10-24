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

    const { products } = await req.json();
    if (!Array.isArray(products)) {
      return new Response(JSON.stringify({ error: 'Invalid payload: "products" must be an array.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: categories, error: catError } = await adminSupabaseClient.from('product_categories').select('name');
    if (catError) throw catError;
    const categoryNames = new Set(categories.map(c => c.name));

    const productsToInsert = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNum = i + 2;

      if (!row.name) {
        errors.push(`Dòng ${rowNum}: Tên sản phẩm là bắt buộc.`);
        continue;
      }
      if (row.category && !categoryNames.has(row.category)) {
        errors.push(`Dòng ${rowNum}: Phân loại "${row.category}" không tồn tại.`);
        continue;
      }

      let parsedSizes = [];
      let basePrice = 0;
      try {
        if (row.sizes) {
          parsedSizes = JSON.parse(row.sizes);
          if (!Array.isArray(parsedSizes) || parsedSizes.length === 0 || typeof parsedSizes[0].price === 'undefined') {
            throw new Error("Định dạng JSON không hợp lệ hoặc thiếu giá.");
          }
          basePrice = Number(parsedSizes[0].price);
        } else {
          if (typeof row.price === 'undefined' || isNaN(Number(row.price))) {
             throw new Error("Cột 'price' là bắt buộc nếu 'sizes' không được cung cấp.");
          }
          basePrice = Number(row.price);
          parsedSizes = [{ name: 'M', price: basePrice }];
        }
      } catch (e) {
        errors.push(`Dòng ${rowNum}: Cột 'sizes' có lỗi: ${e.message}`);
        continue;
      }

      const productRecord = {
        name: row.name,
        description: row.description || null,
        category: row.category || null,
        price: basePrice,
        sizes: parsedSizes,
        available_options: row.available_options ? row.available_options.split(',').map(s => s.trim()) : [],
      };
      productsToInsert.push(productRecord);
    }

    if (productsToInsert.length > 0) {
      const { error: insertError } = await adminSupabaseClient.from('products').insert(productsToInsert);
      if (insertError) {
        return new Response(JSON.stringify({ 
          error: `Lỗi khi thêm vào database: ${insertError.message}`,
          successCount: 0,
          errorCount: products.length,
          errors: [...errors, 'Tất cả sản phẩm hợp lệ đều không thể thêm. Có thể do tên sản phẩm bị trùng.'],
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Import completed.',
      successCount: productsToInsert.length,
      errorCount: errors.length,
      errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-products function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})