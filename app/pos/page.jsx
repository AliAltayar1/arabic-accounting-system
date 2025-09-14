"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { fetchProducts } from "@/lib/products-data/getAllProducts";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";
import { getAllCategory } from "@/lib/category/getAllCategory";

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Filter products based on search and category
  const filteredProducts = fetchedProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    const matchesCategory =
      !selectedCategory || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
    // && matchesCategory
    // && product.quantity > 0;
  });

  // Calculate cart totals
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  );
  const cartDiscount = cartItems.reduce(
    (sum, item) => sum + item.discount_amount,
    0
  );
  const cartTotal = cartSubtotal - cartDiscount;

  // Handle barcode scan/search
  const handleBarcodeSearch = () => {
    if (!barcode.trim()) return;

    const product = fetchedProducts.find((p) => p.barcode === barcode.trim());
    if (product && product.quantity_in_stock > 0) {
      addToCart(product.id);
      toast.success("تمت إضافة المنتج إلى السلة");
    } else {
      toast.warning("المنتج غير موجود أو نفد من المخزون");
    }
  };

  const addToCart = (productId) => {
    const product = fetchedProducts.find((p) => p.id === productId);
    if (!product || product.quantity_in_stock <= 0) {
      toast.warning("المنتج غير متوفر أو نفد من المخزون");
      return;
    }

    const existingItem = cartItems.find(
      (item) => item.product.id === productId
    );

    if (existingItem) {
      if (existingItem.quantity >= product.quantity_in_stock) {
        toast.warning("لا يمكن إضافة كمية أكثر من المتوفر في المخزون");
        return;
      }
      updateCartItem(
        cartItems.indexOf(existingItem),
        "quantity",
        existingItem.quantity + 1
      );
    } else {
      const newItem = {
        product,
        discount_amount: 0,
        quantity: 1,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Update cart item
  const updateCartItem = (index, field, value) => {
    const updatedItems = [...cartItems];
    const item = updatedItems[index];

    if (field === "quantity") {
      if (value > item.product.quantity_in_stock) {
        toast.warning("الكمية المطلوبة أكبر من المتوفر في المخزون");
        return;
      }
      if (value <= 0) {
        removeSellItem(index);
        return;
      }
    }

    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setCartItems(updatedItems);
  };

  // Remove cart item
  const removeCartItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const saveCartBill = async () => {
    if (cartItems.length === 0) {
      toast.warning("يرجى إضافة عناصر للفاتورة");
      return;
    }

    // Check stock availability
    for (const item of cartItems) {
      const currentProduct = fetchedProducts.find(
        (p) => p.id === item.product.id
      );
      if (!currentProduct) continue;

      if (item.discount_amount > item.quantity * currentProduct.selling_price) {
        toast.warn(
          `الخصم ${item.discount_amount} أكبر من سعر البيع ${
            item.quantity * currentProduct.selling_price
          }`
        );
        return;
      }

      let availableQuantity = currentProduct.quantity_in_stock;

      if (item.quantity > availableQuantity) {
        toast.warn(
          `الكمية المطلوبة من ${item.products.name} أكبر من المتوفر في المخزون`
        );
        return;
      }
    }

    let customerId;
    // if (customerName) {
    //   try {
    //     customerId = await getCustomerByName(customerName);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }

    const salesData = {
      p_customer_id: customerId || null,
      p_items: cartItems.map((item) => ({
        barcode: item.product.barcode,
        selling_price: item.product.selling_price,
        quantity: item.quantity,
        discount: item.discount_amount || 0,
      })),
    };

    try {
      const procedure = "add_sale_with_items";
      const { error } = await supabase.rpc(procedure, salesData);

      if (error) throw error;

      toast.success("✅ تم حفظ الفاتورة بنجاح 🎉");
    } catch (err) {
      toast.warn(err.message || "حدث خطأ غير متوقع");
      console.error("Unexpected error:", err.message || err);
    }

    setCartItems([]);
    fetchAllProducts();
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  const printBill = () => {
    if (cartItems.length === 0) {
      toast.warning("السلة فارغة");
      return;
    }

    const printContent = generatePrintContent();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintContent = () => {
    const now = new Date();
    return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة بيع</title>
      <style>
        @page {
          margin: 0.5in;
          size: A4;
          /* Hide default headers and footers */
          @top-left { content: ""; }
          @top-center { content: ""; }
          @top-right { content: ""; }
          @bottom-left { content: ""; }
          @bottom-center { content: ""; }
          @bottom-right { content: ""; }
        }

        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          text-align: right;
          margin: 0;
          padding: 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .header { text-align: center; margin-bottom: 20px; }
        .bill-info { margin-bottom: 20px; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: right;
        }

        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .total {
          font-weight: bold;
          font-size: 18px;
        }

        .summary {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 20px;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }

        /* Hide any potential browser elements */
        @media print {
          body { margin: 0 !important; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>فاتورة بيع</h2>
          <p>التاريخ: ${now.toLocaleDateString("en-GB")}</p>
          <p>الوقت: ${now.toLocaleTimeString("en-GB")}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>الخصم</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems
            .map(
              (item) => `
            <tr>
              <td>${item.product.name}</td>
              <td>${item.quantity}</td>
              <td>${item.product.selling_price.toFixed(2)} ر.س</td>
              <td>${item.discount_amount.toFixed(2)} ر.س</td>
              <td>${(
                item.product.selling_price * item.quantity -
                item.discount_amount
              ).toFixed(2)} ر.س</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="summary">
        <p>المجموع الفرعي: ${cartSubtotal.toFixed(2)} ر.س</p>
        <p>إجمالي الخصم: ${cartDiscount.toFixed(2)} ر.س</p>
        <p class="total">المجموع الكلي: ${cartTotal.toFixed(2)} ر.س</p>
      </div>

      <div class="footer">
        <p>شكراً لتسوقكم معنا</p>
      </div>
    </body>
    </html>
  `;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        saveCartBill();
      } else if (e.key === "F10") {
        e.preventDefault();
        printBill();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearCart();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [cartItems]);

  const fetchAllProducts = async () => {
    try {
      const products = await fetchProducts();
      setFetchedProducts(products);
    } catch (error) {
      console.log(error);
    }
  };

  async function getCategories() {
    try {
      const fetchedCategories = await getAllCategory();
      setCategories(fetchedCategories);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAllProducts();
    getCategories();
  }, []);

  return (
    <MainLayout>
      <PageHeader title="نقطة البيع" description="إجراء عمليات البيع السريعة" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400 transition-colors" />
              <Input
                ref={searchInputRef}
                placeholder="البحث عن منتج... (F1)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-lg h-12 transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE] focus:border-[#2E86DE]"
              />
            </div>
            <div className="flex gap-2">
              <Input
                ref={barcodeInputRef}
                placeholder="مسح الباركود... (F2)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleBarcodeSearch()}
                className="text-lg h-12 ltr transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE] focus:border-[#2E86DE]"
              />
              <Button
                onClick={handleBarcodeSearch}
                size="lg"
                className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                بحث
              </Button>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              onClick={() => setSelectedCategory("")}
              className="mb-2 transition-all duration-200 hover:scale-105"
            >
              جميع الفئات
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category?.name ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category?.name)}
                className="mb-2 transition-all duration-200 hover:scale-105"
              >
                {category?.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  product.quantity_in_stock === 0
                    ? "bg-gray-100 border-2 border-red-400 opacity-75"
                    : "hover:shadow-lg hover:-translate-y-1"
                }`}
                onClick={() => {
                  product.quantity_in_stock > 0 && addToCart(product.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="w-full h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center transition-colors duration-200">
                      <Package
                        className={`h-8 w-8 transition-colors duration-200 ${
                          product.quantity_in_stock === 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3
                      className={`font-semibold text-sm mb-1 line-clamp-2 transition-colors duration-200 ${
                        product.quantity_in_stock === 0 ? "text-gray-500" : ""
                      }`}
                    >
                      {product.name}
                      {product.quantity_in_stock === 0 && (
                        <span className="text-red-500 text-xs block animate-pulse">
                          نفد من المخزون
                        </span>
                      )}
                    </h3>
                    <Badge
                      variant={
                        product.quantity_in_stock === 0
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs mb-2 transition-all duration-200"
                    >
                      {product.category?.name || "لا يوجد فئة"}
                    </Badge>
                    <div className="space-y-1">
                      <p
                        className={`text-lg font-bold transition-colors duration-200 ${
                          product.quantity_in_stock === 0
                            ? "text-gray-400"
                            : "text-[#2E86DE]"
                        }`}
                      >
                        {product.selling_price.toFixed(2)} ر.س
                      </p>
                      <p
                        className={`text-xs transition-colors duration-200 ${
                          product.quantity_in_stock === 0
                            ? "text-red-500 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        متوفر: {product.quantity_in_stock}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد منتجات متاحة</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                سلة التسوق ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 animate-fade-in">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">السلة فارغة</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cartItems.map((item, index) => {
                      return (
                        <div
                          key={item.product.id}
                          className="border rounded-lg p-3 transition-all duration-200 hover:shadow-md hover:border-[#2E86DE]"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm flex-1">
                              {item.product.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCartItem(index)}
                              className="text-red-500 hover:text-red-700 p-1 transition-all duration-200 hover:scale-110"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateCartItem(
                                    index,
                                    "quantity",
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="transition-all duration-200 hover:scale-110"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateCartItem(
                                    index,
                                    "quantity",
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.product.quantity_in_stock
                                }
                                className="transition-all duration-200 hover:scale-110"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-medium">
                              {item.product.selling_price.toFixed(2)} ر.س
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <Input
                              type="number"
                              placeholder="خصم"
                              value={item.discount_amount || ""}
                              onChange={(e) => {
                                const discountValue =
                                  Number.parseFloat(e.target.value) || 0;
                                const maxDiscount =
                                  item.product.slling_price * item.quantity;

                                if (discountValue > maxDiscount) {
                                  toast.warning(
                                    `الخصم أكبر من سعر البيع. الحد الأقصى للخصم: ${maxDiscount.toFixed(
                                      2
                                    )} ر.س`
                                  );
                                  return;
                                }

                                updateCartItem(
                                  index,
                                  "discount_amount",
                                  discountValue
                                );
                              }}
                              className="w-20 h-8 text-xs transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                              min="0"
                              max={item.product.selling_price * item.quantity}
                            />
                            <span className="font-bold">
                              {(
                                item.product.selling_price * item.quantity -
                                item.discount_amount
                              ).toFixed(2)}{" "}
                              ر.س
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{cartSubtotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>إجمالي الخصم:</span>
                      <span>-{cartDiscount.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>المجموع الكلي:</span>
                      <span className="text-[#2E86DE]">
                        {cartTotal.toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={saveCartBill}
                      className="w-full bg-[#27AE60] hover:bg-[#229954] text-lg h-12 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <Save className="h-5 w-5 ml-2" />
                      حفظ الفاتورة (F9)
                    </Button>
                    <Button
                      onClick={printBill}
                      variant="outline"
                      className="w-full text-lg h-12 bg-transparent transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <Printer className="h-5 w-5 ml-2" />
                      طباعة (F10)
                    </Button>
                    <Button
                      onClick={clearCart}
                      variant="destructive"
                      className="w-full transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      مسح السلة (Esc)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Help */}
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm">اختصارات لوحة المفاتيح</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>F1: البحث عن منتج</div>
              <div>F2: مسح الباركود</div>
              <div>F9: حفظ الفاتورة</div>
              <div>F10: طباعة الفاتورة</div>
              <div>Esc: مسح السلة</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
