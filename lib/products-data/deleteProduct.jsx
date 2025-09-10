import { supabase } from "../supabase";

export const deleteProductById = async (id) => {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error("can't delete the product casue ", error.message);
};
