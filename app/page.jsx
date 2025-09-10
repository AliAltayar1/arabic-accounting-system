"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAllSalesBill } from "@/lib/sales/getAllSalesBill";
import { fetchProducts } from "@/lib/products-data/getAllProducts";

export default function HomePage() {
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [salesBill, setSalesBill] = useState([]);

  // Calculate statistics
  const totalProducts = fetchedProducts.length;
  const lowStockProducts = fetchedProducts.filter(
    (p) => p.quantity_in_stock < 10
  ).length;

  const todaySales = salesBill
    .filter(
      (bill) =>
        new Date(bill.created_at).toDateString() === new Date().toDateString()
    )
    .reduce((sum, bill) => sum + bill.total_amount, 0);

  const totalRevenue = salesBill.reduce(
    (sum, bill) => sum + bill.total_amount,
    0
  );

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
      const salesBill = await getAllSalesBill();
      setSalesBill(salesBill);
    } catch (error) {
      console.log(error.message);
    }
  };
  console.log(fetchedProducts);
  console.log(salesBill);

  useEffect(() => {
    fetchAllProducts();
    fetchAllSalesBill();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="لوحة التحكم الرئيسية"
        description="نظرة عامة على أداء المتجر"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              إجمالي المنتجات
            </CardTitle>
            <Package className="h-4 w-4 text-[#2E86DE]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2C3E50]">
              {totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              مبيعات اليوم
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#27AE60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2C3E50]">
              {todaySales.toFixed(2)} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              إجمالي الإيرادات
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#27AE60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2C3E50]">
              {totalRevenue.toFixed(2)} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              منتجات قليلة المخزون
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-[#E74C3C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#E74C3C]">
              {lowStockProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Link href="/pos">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#2E86DE] bg-opacity-10 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-[#2E86DE]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2C3E50]">نقطة البيع</h3>
                  <p className="text-sm text-gray-600">
                    إجراء عمليات البيع السريعة
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Link href="/products">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#27AE60] bg-opacity-10 rounded-lg">
                  <Package className="h-8 w-8 text-[#27AE60]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2C3E50]">
                    إدارة المنتجات
                  </h3>
                  <p className="text-sm text-gray-600">إضافة وتعديل المنتجات</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Link href="/reports">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#E74C3C] bg-opacity-10 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-[#E74C3C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2C3E50]">التقارير</h3>
                  <p className="text-sm text-gray-600">
                    عرض تقارير المبيعات والأرباح
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <Card className="border-[#E74C3C] border-2">
          <CardHeader>
            <CardTitle className="text-[#E74C3C] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: منتجات قليلة المخزون (
              {
                fetchedProducts.filter((p) => p.quantity_in_stock < 10).length
              }{" "}
              منتج)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fetchedProducts
                .filter((p) => p.quantity_in_stock < 10)
                .slice(0, 5)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-2 bg-red-50 rounded"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-[#E74C3C] font-bold">
                      متبقي: {product.quantity_in_stock}
                    </span>
                  </div>
                ))}
            </div>
            <Link href="/products">
              <Button className="mt-4 bg-[#E74C3C] hover:bg-[#C0392B]">
                عرض جميع المنتجات
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
