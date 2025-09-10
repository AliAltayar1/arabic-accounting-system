import { Cairo } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "نظام المحاسبة والمخزون",
  description: "نظام محاسبة ومخزون للمحلات التجارية الصغيرة",
  generator: "v0.dev",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
