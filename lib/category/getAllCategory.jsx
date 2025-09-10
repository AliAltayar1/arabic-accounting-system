import { supabase } from "../supabase";

export const getAllCategory = async () => {
  const { data: categories, error } = await supabase.from("categories").select(`
    id,  
    name
    `);

  if (error) throw new Error(error.message);
  return categories;
};
