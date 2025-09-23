"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, FolderOpen, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getAllCategory } from "@/lib/category/getAllCategory";
import { fetchProducts } from "@/lib/products-data/getAllProducts";
import { updateCategory } from "@/lib/category/updateCategory";
import { toast } from "react-toastify";
import { createCategory } from "../../lib/category/createCategory";
import { deleteCategoryById } from "@/lib/category/deleteCategory";

export default function CategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Reset form
  const resetForm = () => {
    setCategoryName("");
    setEditingCategory(null);
  };

  // Open dialog for adding
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.warning("يرجى إدخال اسم الفئة");
      return;
    }

    try {
      // Check if category name already exists
      const existingCategory = categories.find(
        (c) =>
          c.name.toLowerCase() === categoryName.toLowerCase() &&
          c.id !== editingCategory?.id
      );

      if (existingCategory) {
        toast.error("اسم الفئة موجود مسبقاً");
        return;
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName);
        toast.success("تم تحديث الفئة بنجاح");
      } else {
        await createCategory(categoryName);
        toast.success("تمت إضافة الفئة بنجاح");
      }
      getCategoriesFn();
    } catch (error) {
      toast.error(`فشلت العملية ${error.message}`);
      console.log(error);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  // Delete category
  const deleteCategory = async (id) => {
    // Check if category has products
    const hasProducts = products.some(
      (product) =>
        categories.find((cat) => cat.id === id)?.name === product.category.name
    );

    if (hasProducts) {
      toast.warn("لا يمكن حذف الفئة لأنها تحتوي على منتجات");
      return;
    }

    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      try {
        await deleteCategoryById(id);
        getCategoriesFn();
        toast.success("تم حذف الفئة بنجاح");
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Get product count for each category
  const getProductCount = (categoryName) => {
    return products.filter((product) => product.category?.name === categoryName)
      .length;
  };

  async function getCategoriesFn() {
    try {
      const fetchedCategories = await getAllCategory();
      setCategories(fetchedCategories);
    } catch (error) {
      console.log(error);
    }
  }

  const getProducts = async () => {
    try {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCategoriesFn();
    getProducts();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="إدارة الفئات"
        description="إضافة وتعديل وحذف فئات المنتجات"
        note="ملحوظة: أي فئة تحتوي على منتج واحد أو أكثر لا يمكنك حذف الفئة"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-[#27AE60] hover:bg-[#229954]"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة فئة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryName">اسم الفئة</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="أدخل اسم الفئة"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCategory ? "تحديث" : "إضافة"}
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const productCount = getProductCount(category.name);

          return (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2E86DE] bg-opacity-10 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-[#2E86DE]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {productCount} منتج
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="text-[#2E86DE] hover:text-[#1e5f99]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
                      className="text-[#E74C3C] hover:text-[#c0392b]"
                      disabled={productCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {productCount > 0 && (
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-500">
                    المنتجات في هذه الفئة:
                  </div>
                  <div className="mt-1 space-y-1">
                    {products
                      .filter(
                        (product) => product.category?.name === category.name
                      )
                      .slice(0, 3)
                      .map((product) => (
                        <div key={product.id} className="text-sm text-gray-700">
                          • {product.name}
                        </div>
                      ))}
                    {productCount > 3 && (
                      <div className="text-xs text-gray-500">
                        و {productCount - 3} منتج آخر...
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد فئات</p>
          <p className="text-sm text-gray-400 mt-2">
            ابدأ بإضافة فئة جديدة لتنظيم منتجاتك
          </p>
        </div>
      )}
    </MainLayout>
  );
}
