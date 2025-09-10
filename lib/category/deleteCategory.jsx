import { supabase } from "../supabase";

export const deleteCategoryById = async (id) => {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw new Error("can't delete the product casue ", error.message);
};
