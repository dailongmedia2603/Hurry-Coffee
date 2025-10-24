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

    const [catRes, topRes] = await Promise.all([
      adminSupabaseClient.from('product_categories').select('name'),
      adminSupabaseClient.from('toppings').select('id, name')
    ]);
    if (catRes.error) throw catRes.error;
    if (topRes.error) throw topRes.error;
    
    const categoryNames = new Set(catRes.data.map(c => c.name));
    const toppingNameToIdMap = new Map(topRes.data.map(t => [t.name, t.id]));

    const productsToUpsert = [];
    const productToppingsMap = new Map(); // Map productName -> toppingIds
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNum = i + 2;
      let hasRowError = false;

      if (!row.name) {
        errors.push(`Dòng ${rowNum}: Tên sản phẩm là bắt buộc.`);
        continue;
      }
      if (row.category && !categoryNames.has(row.category)) {
        errors.push(`Dòng ${rowNum}: Phân loại "${row.category}" không tồn tại.`);
        hasRowError = true;
      }

      const parsedSizes = [];
      for (let j = 1; j <= 3; j++) {
        const sizeName = row[`size_${j}_name`];
        const sizePrice = row[`size_${j}_price`];
        if (sizeName && (sizePrice !== undefined && sizePrice !== null)) {
          const price = Number(sizePrice);
          if (isNaN(price)) {
            errors.push(`Dòng ${rowNum}: Giá của size ${j} ("${sizePrice}") không hợp lệ.`);
            hasRowError = true;
            break;
          }
          parsedSizes.push({ name: String(sizeName), price });
        }
      }
      if (hasRowError) continue;

      if (parsedSizes.length === 0) {
        errors.push(`Dòng ${rowNum}: Sản phẩm phải có ít nhất một size hợp lệ (size_1_name và size_1_price).`);
        continue;
      }
      
      const basePrice = parsedSizes[0].price;

      const toppingIds = [];
      if (row.available_toppings) {
        const toppingNames = String(row.available_toppings).split(',').map(s => s.trim()).filter(Boolean);
        for (const name of toppingNames) {
          if (toppingNameToIdMap.has(name)) {
            toppingIds.push(toppingNameToIdMap.get(name));
          } else {
            errors.push(`Dòng ${rowNum}: Topping "${name}" không tồn tại.`);
            hasRowError = true;
          }
        }
      }
      if (hasRowError) continue;

      const productRecord = {
        name: row.name,
        description: row.description || null,
        category: row.category || null,
        price: basePrice,
        sizes: parsedSizes,
        available_options: row.available_options ? String(row.available_options).split(',').map(s => s.trim()) : [],
      };
      productsToUpsert.push(productRecord);
      if (toppingIds.length > 0) {
        productToppingsMap.set(row.name, toppingIds);
      }
    }

    if (productsToUpsert.length > 0) {
      const { data: savedProducts, error: upsertError } = await adminSupabaseClient
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'name' })
        .select('id, name');

      if (upsertError) {
        return new Response(JSON.stringify({ 
          error: `Lỗi khi thêm/cập nhật sản phẩm: ${upsertError.message}`,
          successCount: 0,
          errorCount: products.length,
          errors: [...errors, 'Tất cả sản phẩm hợp lệ đều không thể thêm. Có thể do tên sản phẩm bị trùng.'],
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (savedProducts && savedProducts.length > 0) {
        const productIds = savedProducts.map(p => p.id);
        
        const { error: deleteError } = await adminSupabaseClient
          .from('product_toppings')
          .delete()
          .in('product_id', productIds);
        
        if (deleteError) {
          console.error("Error clearing old toppings:", deleteError.message);
          errors.push(`Lỗi khi xóa topping cũ: ${deleteError.message}`);
        }

        const productToppingsToInsert = [];
        for (const product of savedProducts) {
          if (productToppingsMap.has(product.name)) {
            const toppingIds = productToppingsMap.get(product.name);
            for (const toppingId of toppingIds) {
              productToppingsToInsert.push({
                product_id: product.id,
                topping_id: toppingId,
              });
            }
          }
        }

        if (productToppingsToInsert.length > 0) {
          const { error: toppingInsertError } = await adminSupabaseClient
            .from('product_toppings')
            .insert(productToppingsToInsert);
          
          if (toppingInsertError) {
            console.error("Error inserting new toppings:", toppingInsertError.message);
            errors.push(`Lỗi khi gán topping mới: ${toppingInsertError.message}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Import completed.',
      successCount: productsToUpsert.length,
      errorCount: errors.length,
      errors,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in import-products function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})