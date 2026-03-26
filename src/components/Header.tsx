"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, AlertTriangle } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  // Ẩn hoàn toàn thanh Header trong lúc bệnh nhân đang làm Test
  if (pathname === '/test') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/20 shadow-sm backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            Y
          </div>
          <span className="font-bold text-slate-800 text-lg hidden sm:block">YDSG System</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/" 
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/' ? 'bg-blue-100/60 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">Khám Mới</span>
          </Link>

          <Link 
            href="/admin" 
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/admin' ? 'bg-blue-100/60 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <Shield size={18} />
            <span className="hidden sm:inline">Quản Trị</span>
          </Link>

          <Link 
            href="/alerts" 
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/alerts' ? 'bg-red-100/60 text-red-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <AlertTriangle size={18} />
            <span className="hidden sm:inline">Cảnh Báo</span>
          </Link>
        </nav>
        
      </div>
    </header>
  );
}
