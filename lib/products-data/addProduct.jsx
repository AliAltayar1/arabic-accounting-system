import { supabase } from "../supabase";

export const addProduct = async (product) => {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single(); // 👈 بترجع صف واحد بدل مصفوفة

  if (error) throw new Error("❌ Failed to add product: " + error.message);
  return data;
};
