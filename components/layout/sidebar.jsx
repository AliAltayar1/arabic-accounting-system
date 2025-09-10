"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  FolderOpen,
  FileText,
  Receipt,
  BarChart3,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/pos", label: "نقطة البيع", icon: ShoppingCart },
  { href: "/products", label: "المنتجات", icon: Package },
  { href: "/categories", label: "الفئات", icon: FolderOpen },
  { href: "/purchase-bills", label: "فواتير الشراء", icon: FileText },
  { href: "/sell-bills", label: "فواتير البيع", icon: Receipt },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`
        fixed right-0 top-0 h-full w-64 bg-white border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out pt-10 md:pt-0 
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        md:translate-x-0 md:static md:z-auto
      `}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-[#2C3E50]">نظام المحاسبة</h1>
          <p className="text-sm text-gray-600">إدارة المخزون والمبيعات</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-[#2E86DE] text-white"
                          : "text-[#2C3E50] hover:bg-[#F1F2F6]"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
