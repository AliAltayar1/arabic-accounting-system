import { supabase } from "../supabase";

export const getSupplierByName = async (name) => {
  // 1. البحث عن المورد
  const { data: existing, error: findError } = await supabase
    .from("suppliers")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing) return existing.id; // موجود → رجع الـ id

  // 2. إذا غير موجود → إضافته
  const { data: newSupplier, error: insertError } = await supabase
    .from("suppliers")
    .insert([{ name }])
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newSupplier.id;
};
