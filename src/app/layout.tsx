import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YDSG - Kiểm Tra Sắc Giác",
  description: "Ứng dụng kiểm tra mù màu chuẩn Ishihara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${outfit.className} bg-slate-50 text-slate-900 min-h-screen relative overflow-x-hidden`} suppressHydrationWarning>
        {/* Background Gradients */}
        <div className="fixed inset-0 z-[-1] overflow-hidden opacity-50 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
        </div>
        
        <Header />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
