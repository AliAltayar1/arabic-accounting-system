import { supabase } from "../supabase";

export const getProductsByCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,
      category:categories (id, name),
      specifications:product_specifications (id, name, value)
    `
    )
    .eq("category_id", categoryId);

  if (error) throw new Error(error.message);
  return data;
};
