import { supabase } from "../supabase";

export const addPurchaseAndUpdateStock = async (purchaseData) => {
  try {
    // 1. أضف الفاتورة أولاً (في جدول purchases)
    const { data: newPurchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert([
        {
          supplier_id: purchaseData.supplier_id,
          total_amount: purchaseData.total,
          total_discount: purchaseData.total_discount,
          paid_amount: purchaseData.total,
        },
      ])
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // 2. التعامل مع كل منتج
    for (const item of purchaseData.items) {
      // تحقق إذا المنتج موجود أصلاً
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", item.barcode) // أو أي مفتاح فريد للمنتج
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError; // PGRST116 يعني no rows

      if (existingProduct) {
        // المنتج موجود → زيادة الكمية
        const { error: updateError } = await supabase
          .from("products")
          .update({
            quantity_in_stock:
              existingProduct.quantity_in_stock + item.quantity,
          })
          .eq("id", existingProduct.id);

        if (updateError) throw updateError;
      } else {
        // المنتج غير موجود → إنشاء منتج جديد
        const { error: insertError } = await supabase
          .from("products")
          .insert([
            {
              name: item.name,
              barcode: item.barcode,
              cost_price: item.cost_price,
              selling_price: item.selling_price || item.cost_price + 10,
              quantity_in_stock: item.quantity,
              // category_id: item.category_id,
            },
          ])
          .single();

        if (insertError) throw insertError;
      }

      // 3. أضف المنتج لجدول purchase_items
      const { error: itemError } = await supabase
        .from("purchase_items")
        .insert([
          {
            purchase_id: newPurchase.id,
            product_id: "6c5b4e62-819e-431d3-83ea-63a5a740471e",
            quantity: item.quantity,
            cost_price: item.cost_price,
          },
        ]);

      if (itemError) throw itemError;
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
};
