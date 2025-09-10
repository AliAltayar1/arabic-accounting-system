import { Sidebar } from "./sidebar";

export function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F1F2F6]">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pt-16">{children}</main>
    </div>
  );
}
