import { supabase } from "../supabase";

export const getCustomerByName = async (name) => {
  // 1. جرّب تجيب العميل
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id")
    .eq("name", name)
    .maybeSingle(); // 👈 أفضل من single() لأنها ما ترجع error إذا مافي صف

  if (error) throw new Error(error.message);

  // 2. إذا موجود رجع id
  if (customer) return customer.id;

  // 3. إذا مو موجود ضيفه
  const { data: newCustomer, error: insertError } = await supabase
    .from("customers")
    .insert([{ name }])
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  return newCustomer.id;
};
