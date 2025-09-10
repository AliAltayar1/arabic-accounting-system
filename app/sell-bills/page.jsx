"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Receipt,
  Printer,
  Save,
  Search,
  Minus,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fetchProducts } from "@/lib/products-data/getAllProducts";
import { supabase } from "../../lib/supabase";
import { getAllSalesBill } from "@/lib/sales/getAllSalesBill";
import { toast } from "react-toastify";
import { getCustomerByName } from "@/lib/customers/getCustomerByName";

export default function SellBillsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [sellItems, setSellItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [salesBill, setSalesBill] = useState([]);
  const [isEdit, setIsEdit] = useState(true);
  const [updatedBillId, setUpdatedBillId] = useState(null);

  const subTotal = sellItems.reduce(
    (acc, item) => acc + item.products.selling_price * item.quantity,
    0
  );

  const totalDiscount = sellItems.reduce(
    (acc, item) => acc + item.discount_amount,
    0
  );

  const total = subTotal - totalDiscount;

  console.log(salesBill);

  // Reset form
  const resetForm = () => {
    setCustomerName("");
    setSellItems([]);
    setIsEdit(false);
    setIsDialogOpen(false);
  };

  // Add existing product to sell items
  const addExistingProduct = (productId) => {
    const products = fetchedProducts.find((p) => p.id === productId);
    if (!products || products.quantity <= 0) {
      toast.warning("المنتج غير متوفر أو نفد من المخزون");
      return;
    }

    console.log(products);

    const existingItem = sellItems.find(
      (item) => item.products.id === productId
    );

    if (existingItem) {
      if (existingItem.quantity >= products.quantity) {
        toast.warning("لا يمكن إضافة كمية أكثر من المتوفر في المخزون");
        return;
      }
      updateSellItem(
        sellItems.indexOf(existingItem),
        "quantity",
        existingItem.quantity + 1
      );
    } else {
      const newItem = {
        products,
        discount_amount: 0,
        quantity: 1,
      };
      console.log(newItem);
      setSellItems([...sellItems, newItem]);
    }
  };

  // Update sell item
  const updateSellItem = (index, field, value) => {
    const updatedItems = [...sellItems];
    const item = updatedItems[index];

    if (field === "quantity") {
      if (value > item.products.quantity_in_stock) {
        toast.warning("الكمية المطلوبة أكبر من المتوفر في المخزون");
        return;
      }
      if (value <= 0) {
        removeSellItem(index);
        return;
      }
    }
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSellItems(updatedItems);
  };

  // Remove sell item
  const removeSellItem = (index) => {
    setSellItems(sellItems.filter((_, i) => i !== index));
  };

  const saveSellBill = async () => {
    if (sellItems.length === 0 && isEdit) {
      if (confirm("اذا اصبحت الفاتورة فارغة فسيتم حذفها"))
        deleteBill(updatedBillId);
      return;
    }

    if (sellItems.length === 0) {
      toast.warning("يرجى إضافة عناصر للفاتورة");
      return;
    }

    // Check stock availability
    for (const item of sellItems) {
      const currentProduct = fetchedProducts.find(
        (p) => p.id === item.products.id
      );
      if (!currentProduct) continue;

      let availableQuantity = currentProduct.quantity_in_stock;

      if (item.quantity > availableQuantity) {
        toast.warn(
          `الكمية المطلوبة من ${item.products.name} أكبر من المتوفر في المخزون`
        );
        return;
      }
    }

    let customerId;
    if (customerName) {
      try {
        customerId = await getCustomerByName(customerName);
      } catch (error) {
        console.log(error);
      }
    }

    console.log(customerId);

    const salesData = {
      ...(isEdit && { p_sale_id: updatedBillId }),
      p_customer_id: customerId || null,
      // p_paid_amount: total, // أو المبلغ المدفوع إذا مختلف
      p_items: sellItems.map((item) => ({
        barcode: item.products.barcode,
        selling_price: item.products.selling_price,
        quantity: item.quantity,
        discount: item.discount_amount || 0,
      })),
    };

    try {
      const procedure = isEdit ? "edit_sale_with_items" : "add_sale_with_items";
      const { error } = await supabase.rpc(procedure, salesData);

      if (error) throw error;

      toast.success(
        isEdit
          ? "✅ تم تعديل الفاتورة بنجاح 🎉"
          : "✅ تم إنشاء الفاتورة بنجاح 🎉"
      );
    } catch (err) {
      toast.warn(err.message || "حدث خطأ غير متوقع");
      console.error("Unexpected error:", err.message || err);
    }

    fetchAllSalesBill();
    fetchAllProducts();
    resetForm();
  };

  // Print bill
  const printBill = (bill) => {
    const printContent = generatePrintContent(bill);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate print content
  const generatePrintContent = (bill) => {
    console.log(bill);
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة بيع</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
          .header { text-align: center; margin-bottom: 20px; }
          .bill-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>فاتورة بيع</h2>
          <p>رقم الفاتورة: ${bill.id}</p>
          <p>التاريخ: ${new Date(bill.created_at).toLocaleDateString(
            "en-GB"
          )}</p>
          <p>العميل: ${bill.customer?.name || "عميل عادي"}</p>
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
            ${bill.items
              .map(
                (item) => `
              <tr>
                <td>${item.products.name}</td>
                <td>${item.quantity}</td>
                <td>${item.products.selling_price.toFixed(2)} ر.س</td>
                <td>${item.discount_amount.toFixed(2)} ر.س</td>
                <td>${(
                  item.products.selling_price * item.quantity -
                  item.discount_amount
                ).toFixed(2)} ر.س</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div style="margin-top: 20px;">
          <p>المجموع الفرعي: ${(
            bill.total_amount + bill.total_discount
          ).toFixed(2)} ر.س</p>
          <p>إجمالي الخصم: ${bill.total_discount.toFixed(2)} ر.س</p>
          <p class="total">المجموع الكلي: ${bill.total_amount.toFixed(
            2
          )} ر.س</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p>شكراً لتسوقكم معنا</p>
        </div>
      </body>
      </html>
    `;
  };

  // Filter bills based on search
  const filteredBills = salesBill.filter(
    (bill) =>
      bill.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.id.includes(searchTerm)
  );

  const editBill = (bill) => {
    const newItem = bill.items.map((item) => ({
      products: item.products,
      discount_amount: item.discount_amount,
      quantity: item.quantity,
    }));
    setCustomerName(bill.customer?.name || "");
    setSellItems([...newItem]);
    setIsDialogOpen(true);
    setIsEdit(true);
  };

  const deleteBill = async (p_sale_id) => {
    if (
      confirm("هل أنت متأكد من حذف هذه الفاتورة؟ سيتم إرجاع الكميات للمخزون.")
    ) {
      try {
        const { error } = await supabase.rpc("delete_sale_with_items", {
          p_sale_id,
        });
        if (error) throw Error(error);

        toast.success("تم حذف الفاتورة بنجاح");
      } catch (err) {
        toast.warn(err.message || "حدث خطأ غير متوقع");
        console.error("Unexpected error:", err.message || err);
      }

      fetchAllSalesBill();
    }
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
      const salesBill = await getAllSalesBill();
      setSalesBill(salesBill);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    fetchAllSalesBill();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="فواتير البيع اليدوية"
        description="إنشاء فواتير بيع يدوية للمبيعات خارج نقطة البيع"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEdit(false);
              }}
              className="bg-[#27AE60] hover:bg-[#229954] transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 ml-2" />
              فاتورة بيع جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "تعديل فاتورة البيع" : "فاتورة بيع يدوية جديدة"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">اسم العميل (اختياري)</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                />
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">عناصر الفاتورة</h3>
                <Select onValueChange={addExistingProduct}>
                  <SelectTrigger className="w-64 transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]">
                    <SelectValue placeholder="اختر منتج لإضافته" />
                  </SelectTrigger>
                  <SelectContent>
                    {fetchedProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - متوفر: {product.quantity_in_stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sellItems.map((item, index) => {
                  return (
                    <Card
                      key={item.products.id}
                      className="p-4 transition-all duration-200 hover:shadow-md hover:border-[#2E86DE]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {item.products.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            الفئة: {item.products.categoryName?.name} | متوفر:{" "}
                            {item.products.quantity_in_stock}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSellItem(index)}
                          className="transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label>الكمية</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateSellItem(
                                  index,
                                  "quantity",
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 0}
                              className="transition-all duration-200 hover:scale-110"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateSellItem(
                                  index,
                                  "quantity",
                                  Number.parseInt(e.target.value) || 1
                                )
                              }
                              className="text-center transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                              min="1"
                              max={item.products.quantity_in_stock}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateSellItem(
                                  index,
                                  "quantity",
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >= item.products.quantity_in_stock
                              }
                              className="transition-all duration-200 hover:scale-110"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>السعر</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.products.selling_price}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label>الخصم</Label>
                          <Input
                            type="number"
                            value={item.discount_amount || ""}
                            onChange={(e) => {
                              const discountValue =
                                Number.parseFloat(e.target.value) || 0;
                              console.log(discountValue);
                              const maxDiscount =
                                item.products.selling_price * item.quantity;
                              console.log(maxDiscount);
                              if (discountValue > maxDiscount) {
                                toast.warn(
                                  `الخصم أكبر من سعر البيع. الحد الأقصى للخصم: ${maxDiscount.toFixed(
                                    2
                                  )} ر.س`
                                );
                                return;
                              }

                              updateSellItem(
                                index,
                                "discount_amount",
                                discountValue
                              );
                            }}
                            placeholder="0.00"
                            max={item.products.selling_price * item.quantity}
                            className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                          />
                        </div>

                        <div>
                          <Label>المجموع</Label>
                          <Input
                            value={`${(
                              item.products.selling_price * item.quantity -
                              item.discount_amount
                            ).toFixed(2)} ر.س`}
                            readOnly
                            className="bg-gray-50 font-semibold"
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {sellItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 animate-fade-in">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>لم يتم إضافة أي منتجات بعد</p>
                  <p className="text-sm">اختر منتج من القائمة أعلاه لإضافته</p>
                </div>
              )}

              {sellItems.length > 0 && (
                <Card className="p-4 bg-gray-50 transition-all duration-200 hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{subTotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>إجمالي الخصم:</span>
                      <span>-{totalDiscount.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>المجموع الكلي:</span>
                      <span className="text-[#2E86DE]">
                        {total.toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveSellBill}
                  className="flex-1 bg-[#27AE60] hover:bg-[#229954] transition-all duration-200 hover:scale-105"
                >
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الفاتورة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="transition-all duration-200 hover:scale-105"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400 transition-colors" />
          <Input
            placeholder="البحث في الفواتير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
          />
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <Card
            key={bill.id}
            className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    فاتورة بيع #{bill.id}
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>
                      التاريخ:{" "}
                      {new Date(bill.created_at).toLocaleDateString("en-GB")}
                    </p>
                    <p>العميل: {bill.customer?.name || "عميل عادي"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <div className="text-lg font-bold text-[#2E86DE]">
                      {bill.total_amount.toFixed(2)} ر.س
                    </div>
                    <div className="text-sm text-gray-600">
                      {bill.items.length} منتج
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUpdatedBillId(bill.id);
                      editBill(bill);
                    }}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printBill(bill)}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBill(bill.id)}
                    className="text-red-500 hover:text-red-700 transition-all duration-200 hover:scale-110"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bill.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.products.name} × {item.quantity}
                    </span>
                    <span>
                      {(
                        item.products.selling_price * item.quantity -
                        item.discount_amount
                      ).toFixed(2)}{" "}
                      ر.س
                    </span>
                  </div>
                ))}
                {bill.items.length > 3 && (
                  <div className="text-sm text-gray-500">
                    و {bill.items.length - 3} منتج آخr...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {salesBill.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد فواتير بيع</p>
        </div>
      )}
    </MainLayout>
  );
}
