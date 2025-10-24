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
  console.log(`[import-products] Received request: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log('[import-products] Handling OPTIONS request.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[import-products] Verifying authorization...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[import-products] Authorization header is missing.');
      return new Response(JSON.stringify({ error: 'Yêu cầu không được xác thực (thiếu header).' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('[import-products] Checking if user is admin...');
    const isCallerAdmin = await isAdmin(userSupabaseClient);
    if (!isCallerAdmin) {
      console.warn('[import-products] Permission denied: User is not an admin.');
      return new Response(JSON.stringify({ error: 'Bạn không có quyền thực hiện hành động này.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('[import-products] Admin check passed.');

    console.log('[import-products] Parsing request body...');
    const { products } = await req.json();
    if (!Array.isArray(products)) {
      console.error('[import-products] Invalid payload: "products" is not an array.');
      return new Response(JSON.stringify({ error: 'Payload không hợp lệ: "products" phải là một mảng.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[import-products] Received ${products.length} products to process.`);

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[import-products] Fetching existing categories and toppings...');
    const [catRes, topRes] = await Promise.all([
      adminSupabaseClient.from('product_categories').select('name'),
      adminSupabaseClient.from('toppings').select('id, name')
    ]);
    if (catRes.error) throw catRes.error;
    if (topRes.error) throw topRes.error;
    
    const categoryNames = new Set(catRes.data.map(c => c.name));
    const toppingNameToIdMap = new Map(topRes.data.map(t => [t.name, t.id]));
    console.log(`[import-products] Found ${categoryNames.size} categories and ${toppingNameToIdMap.size} toppings.`);

    const productsToUpsert = [];
    const productToppingsMap = new Map();
    const errors = [];

    console.log('[import-products] Validating product data...');
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
    console.log(`[import-products] Validation complete. ${productsToUpsert.length} valid products, ${errors.length} errors found.`);

    if (productsToUpsert.length > 0) {
      console.log('[import-products] Upserting products...');
      const { data: savedProducts, error: upsertError } = await adminSupabaseClient
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'name' })
        .select('id, name');

      if (upsertError) {
        console.error('[import-products] Error upserting products:', upsertError);
        errors.push(`Lỗi database khi thêm sản phẩm: ${upsertError.message}`);
      } else if (savedProducts && savedProducts.length > 0) {
        console.log(`[import-products] Upserted ${savedProducts.length} products. Now handling toppings.`);
        const productIds = savedProducts.map(p => p.id);
        
        const { error: deleteError } = await adminSupabaseClient
          .from('product_toppings')
          .delete()
          .in('product_id', productIds);
        
        if (deleteError) {
          console.error("[import-products] Error clearing old toppings:", deleteError.message);
          errors.push(`Lỗi khi xóa topping cũ: ${deleteError.message}`);
        }

        const productToppingsToInsert = [];
        for (const product of savedProducts) {
          if (productToppingsMap.has(product.name)) {
            const toppingIds = productToppingsMap.get(product.name);
            for (const toppingId of toppingIds) {
              productToppingsToInsert.push({ product_id: product.id, topping_id: toppingId });
            }
          }
        }

        if (productToppingsToInsert.length > 0) {
          console.log(`[import-products] Inserting ${productToppingsToInsert.length} topping assignments...`);
          const { error: toppingInsertError } = await adminSupabaseClient
            .from('product_toppings')
            .insert(productToppingsToInsert);
          
          if (toppingInsertError) {
            console.error("[import-products] Error inserting new toppings:", toppingInsertError.message);
            errors.push(`Lỗi khi gán topping mới: ${toppingInsertError.message}`);
          }
        }
      }
    }

    console.log('[import-products] Process complete. Sending response.');
    return new Response(JSON.stringify({
      message: 'Import completed.',
      successCount: productsToUpsert.length,
      errorCount: products.length - productsToUpsert.length,
      errors,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('CRITICAL ERROR in import-products function:', error);
    return new Response(JSON.stringify({ error: `Lỗi máy chủ không xác định: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})