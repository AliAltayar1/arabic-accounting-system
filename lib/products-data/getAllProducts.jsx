import { supabase } from "../supabase";

export const fetchProducts = async () => {
  const { data, error } = await supabase.from("products").select(`
      *,
      category:categories (id, name),
      specifications:product_specifications (id, name, value)
    `);

  if (error) throw new Error(error.message);
  return data;
};
