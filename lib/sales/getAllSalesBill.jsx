import { supabase } from "../supabase";

export const getAllSalesBill = async (duration = null) => {
  let query = supabase.from("sales").select(`
    *,
    customer:customers(name),
    items:sales_items(
      *,
      products:products(*, 
        categoryName:categories(name)
      )
    )
  `);

  function toUTCISOString(date) {
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
  }

  if (duration && duration != 0) {
    const today = new Date();

    // نهاية اليوم المحلي → حولو لـ UTC
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // بداية اليوم - المدة
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (duration - 1));
    startDate.setHours(0, 0, 0, 0);

    query = query
      .gte("created_at", toUTCISOString(startDate))
      .lte("created_at", toUTCISOString(endDate));
  }

  const { data: sales, error } = await query;

  // console.log(sales);

  if (error) throw new Error(error.message);

  return sales;
};
