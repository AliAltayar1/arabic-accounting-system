"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllSalesBill } from "@/lib/sales/getAllSalesBill";
import { fetchProducts } from "@/lib/products-data/getAllProducts";
import { getAllPurchases } from "@/lib/purchases/getAllPurchases";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("0");
  const [salesBill, setSalesBill] = useState([]);
  const [salesBillLastWeek, setSalesBillLastWeek] = useState([]);
  const [purchasesBill, setPurchasesBill] = useState([]);
  const [fetchedProducts, setFetchedProducts] = useState([]);

  // دمجهم مع بعض
  const allBills = [...salesBill, ...purchasesBill].map((bill) => {
    if ("customer" in bill) {
      return { ...bill, type: "sale" }; // إذا فيه customer → مبيعات
    } else if ("supplier" in bill) {
      return { ...bill, type: "purchase" }; // إذا فيه supplier → مشتريات
    }
    return bill;
  });

  // ترتيبهم حسب الأحدث أولاً
  allBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Calculate statistics

  const totalSales = salesBill.reduce(
    (sum, bill) => sum + bill.total_amount,
    0
  );

  const totalPurchases = purchasesBill.reduce(
    (sum, bill) => sum + bill.total_amount,
    0
  );

  const totalProfit = totalSales - totalPurchases;

  const salesCount = salesBill.length;

  const averageSale = salesCount > 0 ? totalSales / salesCount : 0;

  // Best selling products
  const productSales = new Map();

  salesBill.forEach((bill) => {
    bill.items.forEach((item) => {
      const { product_id, quantity, subtotal, products } = item;

      // إذا المنتج موجود من قبل في الخريطة، حدث بياناته
      if (productSales.has(product_id)) {
        const existing = productSales.get(product_id);
        productSales.set(product_id, {
          ...existing,
          quantity: existing.quantity + quantity,
          subtotal: existing.subtotal + subtotal,
        });
      } else {
        // إذا أول مرة يضاف
        productSales.set(product_id, {
          name: products.name,
          quantity,
          subtotal,
        });
      }
    });
  });

  const bestSellingProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = fetchedProducts.filter(
    (p) => p.quantity_in_stock < 10
  );

  // Daily sales for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  });

  const dailySales = last7Days.map((date) => {
    // بداية اليوم (00:00:00)
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // نهاية اليوم (بداية اليوم + يوم واحد)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const daySales = salesBillLastWeek
      .filter((bill) => {
        const billDate = new Date(bill.created_at);
        return billDate >= dayStart && billDate < dayEnd;
      })
      .reduce((sum, bill) => sum + bill.total_amount, 0);

    return {
      date: date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      sales: daySales,
    };
  });

  const maxDailySales = Math.max(...dailySales.map((d) => d.sales));

  // Period labels
  const periodLabels = {
    1: "اليوم",
    7: "هذا الأسبوع",
    30: "هذا الشهر",
    0: "جميع الفترات",
  };

  const fetchAllProducts = async () => {
    try {
      const products = await fetchProducts();
      setFetchedProducts(products);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllSalesBill = async () => {
    try {
      const salesBill = await getAllSalesBill(selectedPeriod);
      setSalesBill(salesBill);
    } catch (error) {
      console.log(error.message);
    }
  };

  const fetchAllSalesBillLastWeek = async () => {
    try {
      const salesBill = await getAllSalesBill(7);
      setSalesBillLastWeek(salesBill);
    } catch (error) {
      console.log(error.message);
    }
  };

  const fetchAllPurchasesBill = async () => {
    try {
      const bills = await getAllPurchases(selectedPeriod);
      setPurchasesBill(bills);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllSalesBill();
    fetchAllPurchasesBill();
    fetchAllSalesBillLastWeek();
    fetchAllProducts();
  }, [selectedPeriod]);

  return (
    <MainLayout>
      <PageHeader
        title="التقارير والإحصائيات"
        description="تحليل شامل لأداء المبيعات والمخزون"
      >
        <Select
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          className=""
        >
          <SelectTrigger className="w-48  bg-gray-200 text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-100">
            <SelectItem value="1">اليوم</SelectItem>
            <SelectItem value="7">هذا الأسبوع</SelectItem>
            <SelectItem value="30">هذا الشهر</SelectItem>
            <SelectItem value="0">جميع الفترات</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              إجمالي المبيعات
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#27AE60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#27AE60]">
              {totalSales.toFixed(2)} ر.س
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {periodLabels[selectedPeriod]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              إجمالي المشتريات
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-[#E74C3C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#E74C3C]">
              {totalPurchases.toFixed(2)} ر.س
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {periodLabels[selectedPeriod]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              صافي الربح
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#2E86DE]" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalProfit >= 0 ? "text-[#27AE60]" : "text-[#E74C3C]"
              }`}
            >
              {totalProfit.toFixed(2)} ر.س
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {periodLabels[selectedPeriod]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              عدد الفواتير
            </CardTitle>
            <Users className="h-4 w-4 text-[#2E86DE]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2E86DE]">
              {salesCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              متوسط الفاتورة: {averageSale.toFixed(2)} ر.س
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              المبيعات اليومية (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailySales.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600">{day.date}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-[#2E86DE] h-6 rounded-full flex items-center justify-end px-2 min-w-fit"
                      style={{
                        width: `${
                          maxDailySales > 0
                            ? (day.sales / maxDailySales) * 100
                            : 0
                        }%`,
                      }}
                    >
                      {/* {day.sales > 0 && (
                        <span className="text-white text-xs font-medium">
                          {day.sales.toFixed(0)} ر.س
                        </span>
                      )} */}
                    </div>

                    {day.sales > 0 && (
                      <span className="text-green-500 text-xs font-bold absolute top-1/2 -translate-y-1/2 left-3">
                        {day.sales.toFixed(0)} ر.س
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSellingProducts.length > 0 ? (
                bestSellingProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        تم بيع {product.quantity} قطعة
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-[#27AE60]">
                        {product.subtotal.toFixed(2)} ر.س
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>لا توجد مبيعات في هذه الفترة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-[#E74C3C] border-2">
          <CardHeader>
            <CardTitle className="text-[#E74C3C] flex items-center gap-2">
              <Package className="h-5 w-5" />
              تنبيه: منتجات قليلة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {product.category?.name}
                    </div>
                  </div>
                  <div className="text-[#E74C3C] font-bold">
                    {product.quantity_in_stock === 0
                      ? "نفد"
                      : `متبقي: ${product.quantity_in_stock}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allBills &&
              allBills.slice(0, 10).map((bill) => (
                <div
                  key={bill.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {bill.type === "sale" ? "فاتورة بيع" : "فاتورة شراء"} #
                      {bill.id}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(bill.created_at).toLocaleDateString("en-GB")} -{" "}
                      {bill.items.length} منتج
                    </div>
                  </div>
                  <div
                    className={`font-bold ${
                      bill.type === "sale" ? "text-[#27AE60]" : "text-[#E74C3C]"
                    }`}
                  >
                    {bill.type === "sale" ? "+" : "-"}
                    {bill.total_amount.toFixed(2)} ر.س
                  </div>
                </div>
              ))}
            {allBills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد معاملات في هذه الفترة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
