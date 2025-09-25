"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Table,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
// import { supabase } from "@/lib/supabase";
import { fetchProducts } from "@/lib/products-data/getAllProducts";
import { addProduct } from "@/lib/products-data/addProduct";
import { getCategoryByName } from "@/lib/category/getCategoryByName";
import { getAllCategory } from "@/lib/category/getAllCategory";
import { deleteProductById } from "@/lib/products-data/deleteProduct";
import { updateProduct } from "@/lib/products-data/updateProduct";
import { toast } from "react-toastify";
import { getProductsByCategory } from "@/lib/products-data/getProductByCategory";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    barcode: "",
    cost: "",
    price: "",
    quantity: "",
  });
  const [fetchAllProducts, setFetchAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCards, setIsCards] = useState(true);

  // Filter products
  const filteredProducts = fetchAllProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);

    return matchesSearch;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      barcode: "",
      cost: "",
      price: "",
      quantity: "",
    });
    setEditingProduct(false);
  };

  // Open dialog for adding
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (product) => {
    setEditingProduct(true);

    setFormData({
      id: product.id,
      name: product.name,
      category: product.category?.name || null,
      barcode: product.barcode,
      cost: product.cost_price.toString(),
      price: product.selling_price.toString(),
      quantity: product.quantity_in_stock.toString(),
    });

    setIsDialogOpen(true);
  };

  // Load the product into state
  const loadProducts = async () => {
    try {
      const products = await fetchProducts();
      setFetchAllProducts(products);
    } catch (err) {
      console.error("Failed to load products: ", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من إدخال جميع الحقول المطلوبة
    if (
      !formData.name ||
      !formData.barcode ||
      !formData.cost ||
      !formData.price ||
      !formData.quantity
    ) {
      toast.warning("يرجى ملء جميع الحقول");
      return;
    }

    try {
      // تحقق من عدم وجود باركود مكرر (في حالة الإضافة فقط)
      const existing = fetchAllProducts.find((p) => {
        return p.barcode === formData.barcode && p.id !== formData.id;
      });

      if (existing) {
        toast.warning("الباركود موجود مسبقاً");
        return;
      }

      // get the category id by its name
      let categoryId;
      if (formData.category) {
        categoryId = await getCategoryByName(formData?.category);
        if (!categoryId) {
          toast.warning("⚠️ لم يتم الحصول على معرف الفئة");
          return;
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        barcode: formData.barcode,
        cost_price: parseFloat(formData.cost),
        selling_price: parseFloat(formData.price),
        quantity_in_stock: parseInt(formData.quantity),
        category_id: categoryId || null,
      };

      if (editingProduct) {
        // تحديث منتج موجود
        const updated = await updateProduct(formData.id, productData);
        toast.success("تم تحديث المنتج");
      } else {
        // إضافة منتج جديد
        const added = await addProduct(productData);
        toast.success("تمت إضافة المنتج");
      }

      // تحديث الواجهة بعد العملية
      loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("❌ فشلت العملية:", err.message);
      toast.warning("حدث خطأ أثناء تنفيذ العملية: " + err.message);
    }
  };

  //get Products by category
  const productsByCategory = async (categoryId) => {
    try {
      if (categoryId === "all") {
        loadProducts();
        return;
      }

      const getProductByCategoryFn = await getProductsByCategory(categoryId);

      setFetchAllProducts(getProductByCategoryFn);
    } catch (error) {
      console.log(error);
    }
  };

  // Delete product
  const deleteProduct = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProductById(id);
        toast.success("تم حذف المنتج");
        loadProducts();
      } catch (error) {
        toast.error("حدث خطأ أثناء حذف المنتج");
        console.log(error);
      }
    }
  };

  useEffect(() => {
    loadProducts();

    const loadCategories = async () => {
      try {
        const getCatgories = await getAllCategory();
        setCategories(getCatgories);
      } catch (err) {
        console.error("Failed to load products: ", err);
      }
    };

    const displayMethod = localStorage.getItem("display-method");
    setIsCards(displayMethod == "true" ? true : false);

    loadCategories();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="إدارة المنتجات"
        description="إضافة وتعديل وحذف المنتجات"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="text-white bg-[#27AE60] hover:bg-[#229954]"
            >
              <Plus className="h-4 w-4 ml-2 " />
              إضافة منتج جديد
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المنتج</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="أدخل اسم المنتج"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">وصف المنتج</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="أدخل وصف المنتج"
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories &&
                      categories.map((category, idx) => (
                        <SelectItem key={idx} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="barcode">الباركود</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  placeholder="أدخل الباركود"
                  className="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">سعر التكلفة</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">سعر البيع</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">الكمية</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? "تحديث" : "إضافة"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            productsByCategory(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="جميع الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Method of displaying the products*/}
      <div className="flex gap-8 items-center mb-6">
        <h2>طريقة عرض المنتجات:</h2>
        <div className="flex gap-3">
          <button
            className="flex gap-1 px-3 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => {
              setIsCards(false);
              localStorage.setItem("display-method", false);
            }}
          >
            جدول
            <span>
              <Table />
            </span>
          </button>
          <button
            className="flex gap-1 px-3 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => {
              setIsCards(true);
              localStorage.setItem("display-method", true);
            }}
          >
            بطاقات
            <span>
              <LayoutGrid />
            </span>
          </button>
        </div>
      </div>

      {/* products card grid */}
      {isCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts &&
            filteredProducts.map((product) => {
              return (
                <Card
                  key={product.id}
                  className={`transition-shadow ${
                    product.quantity_in_stock === 0
                      ? "bg-gray-100 border-2 border-red-400 opacity-75"
                      : "hover:shadow-lg"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3
                          className={`font-semibold text-lg mb-1 ${
                            product.quantity_in_stock === 0
                              ? "text-gray-500"
                              : ""
                          }`}
                        >
                          {product.name}
                          {product.quantity_in_stock === 0 && (
                            <span className="text-red-500 text-sm block">
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
                          className="mb-2"
                        >
                          {product.category?.name || "لا يوجد فئة"}
                        </Badge>

                        <p className="text-gray-500 text-xs mb-3">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                          className="text-[#2E86DE] hover:text-[#1e5f99]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="text-[#E74C3C] hover:text-[#c0392b]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الباركود:</span>
                        <span className="ltr">{product.barcode}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">التكلفة:</span>
                        <span
                          className={
                            product.quantity_in_stock === 0
                              ? "text-gray-400"
                              : ""
                          }
                        >
                          {product.cost_price.toFixed(2)} د.إ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">سعر البيع:</span>
                        <span
                          className={`font-semibold ${
                            product.quantity_in_stock === 0
                              ? "text-gray-400"
                              : "text-[#2E86DE]"
                          }`}
                        >
                          {product.selling_price.toFixed(2)} د.إ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الكمية:</span>
                        <span
                          className={`font-semibold ${
                            product.quantity_in_stock === 0
                              ? "text-red-500"
                              : product.quantity_in_stock < 10
                              ? "text-[#E74C3C]"
                              : "text-[#27AE60]"
                          }`}
                        >
                          {product.quantity_in_stock}
                          {product.quantity_in_stock < 10 &&
                            product.quantity_in_stock > 0 && (
                              <AlertTriangle className="inline h-3 w-3 mr-1" />
                            )}
                          {product.quantity_in_stock === 0 && (
                            <span className="mr-1">نفد</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">الربح:</span>
                        <span
                          className={`font-semibold ${
                            product.quantity_in_stock === 0
                              ? "text-gray-400"
                              : "text-[#27AE60]"
                          }`}
                        >
                          {(product.selling_price - product.cost_price).toFixed(
                            2
                          )}{" "}
                          د.إ
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* products table*/}
      {!isCards && (
        <div className="scrollable overflow-x-auto w-full ">
          {filteredProducts && (
            <table className="min-w-[200px] border-2 mt-10 border-collapse w-full">
              <thead>
                <tr className="text-center ">
                  <th className="border p-2">اسم المنتج</th>
                  <th className="border p-2">الوصف</th>
                  <th className="border p-2">الباركود</th>
                  <th className="border p-2">الفئة</th>
                  <th className="border p-2">الكمية</th>
                  <th className="border p-2">التكلفة</th>
                  <th className="border p-2">سعرالبيع</th>
                  <th className="border p-2">الربح</th>
                  <th className="border p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const profit = product.selling_price - product.cost_price;
                  return (
                    <tr
                      key={product.id}
                      className={`text-center border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ${
                        product.quantity_in_stock == 0 ? "bg-red-100" : ""
                      }`}
                    >
                      <td className={` p-2`}>{product.name}</td>
                      <td className=" p-2">
                        {product.description || "لا يوجد وصف"}
                      </td>
                      <td className=" p-2">{product.barcode}</td>
                      <td className=" p-2">
                        {product.category?.name || "لا يوجد فئة"}
                      </td>
                      <td
                        className={`p-2 ${
                          product.quantity_in_stock == 0 ? "text-red-400" : ""
                        }`}
                      >
                        {product.quantity_in_stock == 0 ? (
                          <span className="flex flex-col items-center gap-1 text-red-500">
                            نفذ من المخزون
                            <AlertTriangle size={16} />
                          </span>
                        ) : (
                          product.quantity_in_stock
                        )}
                      </td>
                      <td className=" p-2">{product.cost_price} د.إ</td>
                      <td className=" p-2">{product.selling_price} د.إ</td>
                      <td className=" p-2">{profit} د.إ</td>
                      <td className=" p-2 ">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            className="text-[#2E86DE] hover:text-[#1e5f99]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="text-[#E74C3C] hover:text-[#c0392b]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {fetchAllProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد منتجات</p>
        </div>
      )}
    </MainLayout>
  );
}
