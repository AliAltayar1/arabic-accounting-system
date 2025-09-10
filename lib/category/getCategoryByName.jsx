import { supabase } from "../supabase";

export const getCategoryByName = async (name) => {
  // أول شي ندور على الفئة إذا موجودة
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", name)
    .single();

  if (findError) {
    throw new Error(findError.message);
  }

  return existing.id;

  // // إذا مش موجودة، أنشئ فئة جديدة
  // const { data: created, error: createError } = await supabase
  //   .from("categories")
  //   .insert([{ name }])
  //   .select()
  //   .single();

  // if (createError) {
  //   throw new Error(createError.message);
  // }

  // return created.id;
};
