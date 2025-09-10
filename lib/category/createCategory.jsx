import { supabase } from "../supabase";

export const createCategory = async (name) => {
  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert([{ name }])
    .select()
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created.id;
};
