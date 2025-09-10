import { supabase } from "../supabase";

export const updateProduct = async (id, updatedData) => {
  const { data, error } = await supabase
    .from("products")
    .update(updatedData)
    .eq("id", id)
    .select()
    .single(); // يرجّع العنصر المحدث

  if (error) throw new Error(error.message);
  return data;
};
