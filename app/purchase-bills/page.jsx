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
  FileText,
  Printer,
  Save,
  Search,
  Edit,
  Receipt,
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
import { getAllPurchases } from "@/lib/purchases/getAllPurchases";
import { toast } from "react-toastify";
import { getAllCategory } from "@/lib/category/getAllCategory";
import { getSupplierByName } from "../../lib/suppliers/getSupplierByName";
import { supabase } from "../../lib/supabase";
// import {s} from "../pages/api/suppliers"
export default function PurchaseBillsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchasesBill, setPurchasesBill] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [updatedBillId, setUpdatedBillId] = useState("");

  // Reset form
  const resetForm = () => {
    setVendorName("");
    setPurchaseItems([]);
    setIsEdit(false);
  };

  // Add item to purchase
  const addPurchaseItem = () => {
    const newItem = {
      product: {
        name: "",
        category: "",
        barcode: "",
        cost: 0,
        price: 0,
        quantity: 0,
        // discount: 0,
      },
      discount: 0,
      quantity: 1,
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };

  // Update purchase item
  const updatePurchaseItem = (index, field, value) => {
    const updatedItems = [...purchaseItems];

    if (field === "quantity" || field === "discount") {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        product: { ...updatedItems[index].product, [field]: value },
      };
    }
    setPurchaseItems(updatedItems);
  };

  // Remove purchase item
  const removePurchaseItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const subtotal = purchaseItems.reduce(
    (sum, item) => sum + item.product.cost * item.quantity,
    0
  );

  const totalDiscount = purchaseItems.reduce(
    (sum, item) => sum + item.discount,
    0
  );

  const total = subtotal - totalDiscount;

  const savePurchaseBill = async () => {
    if (purchaseItems.length === 0) {
      toast.warn("يرجى إضافة عناصر للفاتورة");
      return;
    }

    // Validate items
    for (const item of purchaseItems) {
      if (!item.product.name || item.product.cost <= 0 || item.quantity <= 0) {
        toast.warn("يرجى ملء جميع بيانات المنتجات");
        return;
      }
    }

    let supplierId;
    try {
      if (vendorName) supplierId = await getSupplierByName(vendorName);
    } catch (error) {
      console.log(error);
    }

    const purchaseData = {
      p_supplier_id: supplierId || null,
      p_total_amount: total,
      p_total_discount: totalDiscount,
      p_paid_amount: total, // أو المبلغ المدفوع إذا مختلف
      p_items: purchaseItems.map((item) => ({
        name: item.product.name,
        category: item.product.category,
        barcode: item.product.barcode,
        cost_price: item.product.cost,
        selling_price: item.product.cost * 1.2,
        quantity: item.quantity,
        discount: item.discount || 0,
      })),
      ...(isEdit && { p_purchase_id: updatedBillId }),
    };

    if (isEdit) {
      const { error } = await supabase.rpc(
        "update_purchase_with_items",
        purchaseData
      );

      if (error) {
        console.error("❌ خطأ في تعديل الفاتورة:", error);
        toast.error("فشل تعديل الفاتورة");
      } else {
        console.log("✅ تم تعديل الفاتورة بنجاح 🎉");
        toast.success("تم تعديل الفاتورة بنجاح");
      }
    } else {
      const { error } = await supabase.rpc(
        "add_purchase_with_items",
        purchaseData
      );
      if (error) {
        console.error("خطأ في الحفظ:", error);
      } else {
        console.log("تم الحفظ بنجاح 🎉");
        toast.success("تم الحفظ بنجاح 🎉");
      }
    }

    getPurchasesBill();
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
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة شراء</title>
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
          <h2>فاتورة شراء</h2>
          <p>رقم الفاتورة: ${bill.id}</p>
          <p>التاريخ: ${new Date(bill.created_at).toLocaleDateString(
            "en-GB"
          )}</p>
          <p>المورد: ${bill.supplier?.name || "غير محدد"}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الفئة</th>
              <th>الكمية</th>
              <th>سعر التكلفة</th>
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
                <td>${item.products.categoryName?.name || "عامة"}</td>
                <td>${item.quantity}</td>
                <td>${item.products.cost_price.toFixed(2)} د.إ</td>
                <td>${item.discount_amount.toFixed(2)} د.إ</td>
                <td>${(
                  item.products.cost_price * item.quantity -
                  item.discount_amount
                ).toFixed(2)} د.إ</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div style="margin-top: 20px;">
          <p>المجموع الفرعي: ${(
            bill.total_amount + bill.total_discount
          ).toFixed(2)} د.إ</p>
          <p>إجمالي الخصم: ${bill.total_discount.toFixed(2)} د.إ</p>
          <p class="total">المجموع الكلي: ${bill.total_amount.toFixed(
            2
          )} د.إ</p>
        </div>
      </body>
      </html>
    `;
  };

  // Filter bills based on search by bill id or vendor name
  const filteredBills = purchasesBill.filter(
    (bill) =>
      bill?.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.id.includes(searchTerm)
  );

  // Add edit bill function
  const editBill = (bill) => {
    const newItems = bill.items.map((b) => ({
      product: {
        name: b.products.name,
        category: b.products.category_id,
        barcode: b.products.barcode,
        cost: b.products.cost_price,
        price: b.products.selling_price,
        quantity: 0,
      },
      quantity: b.quantity,
      discount: b.discount_amount,
    }));

    setPurchaseItems([...newItems]);

    setIsEdit(true);
    setVendorName(bill.supplier?.name || "");
    setIsDialogOpen(true);
  };

  // Add delete bill function
  const deleteBill = async (purchaseId) => {
    if (
      confirm("هل أنت متأكد من حذف هذه الفاتورة؟ سيتم تعديل المخزون تلقائياً.")
    ) {
      const { error } = await supabase.rpc("delete_purchase_with_items", {
        p_purchase_id: purchaseId,
      });

      if (error) {
        console.error("خطأ أثناء الحذف:", error);
      } else {
        toast.success("تم حذف الفاتورة والعناصر بنجاح ✅");
        getPurchasesBill();
      }
    }
  };

  const getPurchasesBill = async () => {
    try {
      const bills = await getAllPurchases();
      setPurchasesBill(bills);
    } catch (error) {
      console.log(error);
    }
  };

  async function getCategoriesFn() {
    try {
      const fetchedCategories = await getAllCategory();
      setCategories(fetchedCategories);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPurchasesBill();
    getCategoriesFn();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="فواتير الشراء"
        description="إدارة فواتير الشراء وتحديث المخزون"
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
              فاتورة شراء جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "تعديل فاتورة الشراء" : "فاتورة شراء جديدة"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="vendor">اسم المورد (اختياري)</Label>
                <Input
                  id="vendor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="أدخل اسم المورد"
                  className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                />
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">عناصر الفاتورة</h3>
                <Button
                  onClick={addPurchaseItem}
                  size="sm"
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {purchaseItems.map((item, index) => {
                  return (
                    <Card
                      key={index}
                      className="p-4 transition-all duration-200 hover:shadow-md hover:border-[#2E86DE]"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                          <Label>اسم المنتج</Label>
                          <Input
                            value={item.product.name}
                            onChange={(e) =>
                              updatePurchaseItem(index, "name", e.target.value)
                            }
                            placeholder="اسم المنتج"
                            className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                          />
                        </div>

                        <div>
                          <Label>الفئة</Label>
                          <Select
                            value={item.product.category}
                            onValueChange={(value) =>
                              updatePurchaseItem(index, "category", value)
                            }
                          >
                            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]">
                              <SelectValue placeholder="الفئة" />
                            </SelectTrigger>

                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>الباركود</Label>
                          <Input
                            value={item.product.barcode}
                            onChange={(e) =>
                              updatePurchaseItem(
                                index,
                                "barcode",
                                e.target.value
                              )
                            }
                            placeholder="الباركود"
                            className="ltr transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                          />
                        </div>

                        <div>
                          <Label>سعر التكلفة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.product.cost || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                index,
                                "cost",
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                          />
                        </div>

                        <div>
                          <Label>الكمية</Label>
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                index,
                                "quantity",
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>الخصم</Label>
                            <Input
                              type="number"
                              value={item.discount || ""}
                              onChange={(e) => {
                                const discountValue =
                                  Number.parseFloat(e.target.value) || 0;
                                const maxDiscount =
                                  item.product.cost * item.quantity;

                                if (discountValue > maxDiscount) {
                                  toast.warn(
                                    `الخصم أكبر من سعر الشراء. الحد الأقصى للخصم: ${maxDiscount.toFixed(
                                      2
                                    )} د.إ`
                                  );
                                  return;
                                }

                                updatePurchaseItem(
                                  index,
                                  "discount",
                                  discountValue
                                );
                              }}
                              placeholder="0.00"
                              max={item.product.cost * item.quantity}
                              className="transition-all duration-200 focus:ring-2 focus:ring-[#2E86DE]"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removePurchaseItem(index)}
                            className="transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        المجموع:{" "}
                        {(
                          item.product.cost * item.quantity -
                          item.discount
                        ).toFixed(2)}{" "}
                        د.إ
                      </div>
                    </Card>
                  );
                })}
              </div>

              {purchaseItems.length > 0 && (
                <Card className="p-4 bg-gray-50 transition-all duration-200 hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{subtotal.toFixed(2)} د.إ</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>إجمالي الخصم:</span>
                      <span>-{totalDiscount.toFixed(2)} د.إ</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>المجموع الكلي:</span>
                      <span className="text-[#2E86DE]">
                        {total.toFixed(2)} د.إ
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {purchaseItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 animate-fade-in">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>لم يتم إضافة أي منتجات بعد</p>
                  <p className="text-sm">اختر منتج من القائمة أعلاه لإضافته</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={savePurchaseBill}
                  className="flex-1 bg-[#27AE60] hover:bg-[#229954] transition-all duration-200 hover:scale-105"
                >
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الفاتورة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsEdit(false);
                  }}
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
        {filteredBills.map((bill) => {
          return (
            <Card
              key={bill.id}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      فاتورة شراء #{bill.id}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>
                        التاريخ:{" "}
                        {new Date(bill.created_at).toLocaleDateString("en-GB")}
                      </p>
                      <p>المورد: {bill?.supplier?.name || "غير محدد"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <div className="text-lg font-bold text-[#2E86DE]">
                        {bill.total_amount.toFixed(2)} د.إ
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
              {
                <CardContent>
                  <div className="space-y-2">
                    {bill.items.slice(0, 3).map((item, index) => {
                      return (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.products.name} × {item.quantity}
                          </span>
                          <span>
                            {(
                              item.products.cost_price * item.quantity -
                              item.discount_amount
                            ).toFixed(2)}{" "}
                            د.إ
                          </span>
                        </div>
                      );
                    })}
                    {bill.items.length > 3 && (
                      <div className="text-sm text-gray-500">
                        و {bill.items.length - 3} منتج آخر...
                      </div>
                    )}
                  </div>
                </CardContent>
              }
            </Card>
          );
        })}
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد فواتير شراء</p>
        </div>
      )}
    </MainLayout>
  );
}
