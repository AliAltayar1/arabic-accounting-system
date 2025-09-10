import { supabase } from "../supabase";

export const updateCategory = async (id, categoryName) => {
  // أول شي ندور على الفئة إذا موجودة

  const { data, error } = await supabase
    .from("categories")
    .update({ name: categoryName })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};
