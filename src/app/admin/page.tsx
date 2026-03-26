"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, Download, CheckCircle, AlertTriangle, Video, X, ChevronDown, ChevronRight, Calendar as CalendarIcon, Filter } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbData, setDbData] = useState<any[]>([]);
  
  useEffect(() => {
    setIsClient(true);
    fetch('/api/tests')
      .then(res => res.json())
      .then(res => {
        if(res.success && res.data) {
          // Format DB timestamps to match mock structures
          const mapped = res.data.map((row: any) => {
            const d = new Date(row.createdAt);
            // Sửa lỗi nếu SQLite datetime là UTC hay local thì bù trừ cho đúng
            // Tạm thời hiển thị raw string hoặc parse tùy the server
            return {
              id: row.id,
              ticketId: row.ticketId,
              fullName: row.fullName,
              score: row.score,
              passed: row.passed === 1,
              videoUrl: row.videoUrl,
              dateObj: d,
              dateStr: row.createdAt.split(" ")[0], // format SQLite YYYY-MM-DD
              timeStr: row.createdAt.split(" ")[1]?.substring(0, 5) || "00:00"
            };
          });
          setDbData(mapped);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  // Date Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Accordion & Pagination State by Date
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    [todayStr]: true
  });
  const [pages, setPages] = useState<Record<string, number>>({});

  const toggleGroup = (dateStr: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  const changePage = (dateStr: string, page: number) => {
    setPages(prev => ({
      ...prev,
      [dateStr]: page
    }));
  };

  // Grouped and filtered data
  const groupedData = useMemo(() => {
    let filtered = dbData;
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (fromDate) {
      filtered = filtered.filter(t => t.dateStr >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter(t => t.dateStr <= toDate);
    }

    // Grouping
    const groups: Record<string, typeof dbData> = {};
    filtered.forEach(test => {
      if (!groups[test.dateStr]) groups[test.dateStr] = [];
      groups[test.dateStr].push(test);
    });

    // Sort groups descending (newer days first)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedGroupKeys.map(key => ({
      dateStr: key,
      tests: groups[key].sort((a, b) => b.id - a.id) // Sort by ID desc inside same day
    }));
  }, [dbData, searchTerm, fromDate, toDate]);

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Quản Trị YDSG</h1>
          <p className="text-slate-500 mt-1">Danh sách hồ sơ kiểm tra sắc giác bệnh nhân</p>
        </div>
        
        {/* Filters */}
        <div className="w-full xl:w-auto flex flex-col lg:flex-row gap-3 lg:gap-4 flex-wrap">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400 hidden sm:block" />
              <span className="text-sm font-medium sm:font-normal text-slate-500">Từ:</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent text-sm outline-none text-slate-700 flex-1 sm:flex-none p-1 sm:p-0 border sm:border-transparent border-slate-200 rounded-lg sm:rounded-none" 
              />
            </div>
            <div className="w-full h-px sm:w-px sm:h-6 bg-slate-200 my-1 sm:my-0 sm:mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium sm:font-normal text-slate-500">Đến:</span>
              <input 
                type="date" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent text-sm outline-none text-slate-700 flex-1 sm:flex-none p-1 sm:p-0 border sm:border-transparent border-slate-200 rounded-lg sm:rounded-none" 
              />
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Tìm theo tên, mã phiếu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {!isClient || isLoading ? (
        <div className="flex justify-center p-12 flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải biểu mẫu từ Hệ thống YDSG...</p>
        </div>
      ) : (
      <>
      {/* Grouped Lists */}
      <div className="space-y-6">
        {groupedData.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl text-slate-500 flex flex-col items-center">
            <Search size={48} className="text-slate-300 mb-4" />
            <p>Không tìm thấy hồ sơ nào đáp ứng điều kiện lọc.</p>
          </div>
        ) : (
          groupedData.map(group => {
            const isToday = group.dateStr === todayStr;
            const isExpanded = expandedGroups[group.dateStr] ?? isToday;
            const currentPage = pages[group.dateStr] || 1;
            const totalPages = Math.ceil(group.tests.length / ITEMS_PER_PAGE);
            
            // Lấy data cho trang hiện tại
            const paginatedTests = group.tests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
            
            // Format ngày
            const [y, m, d] = group.dateStr.split("-");
            const formattedDate = `${d}/${m}/${y}`;

            return (
              <motion.div 
                key={group.dateStr}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50"
              >
                {/* Accordion Header */}
                <button 
                  onClick={() => toggleGroup(group.dateStr)}
                  className="w-full px-4 md:px-6 py-4 bg-white/50 hover:bg-white flex items-center justify-between border-b border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <CalendarIcon size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-base md:text-lg font-bold text-slate-800">
                        {isToday ? "Hôm Nay" : `Ngày ${formattedDate}`}
                      </h2>
                      <p className="text-xs md:text-sm font-medium text-slate-500">{group.tests.length} hồ sơ</p>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                  </div>
                </button>

                {/* Accordion Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80">
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">Thời Gian</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">ID Phiếu</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">Họ và Tên</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm text-center">Biểu Điểm</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">Trạng Thái</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm text-right">Bằng Chứng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedTests.map(test => (
                              <tr key={test.id} className="border-t border-slate-100/50 hover:bg-white/40 transition-colors">
                                <td className="py-3 px-6 text-slate-500 font-mono text-sm">{test.timeStr}</td>
                                <td className="py-3 px-6 text-slate-500 font-mono text-sm">{test.ticketId}</td>
                                <td className="py-3 px-6 font-semibold text-slate-800">{test.fullName}</td>
                                <td className="py-3 px-6 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    test.score >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {test.score} / 8
                                  </span>
                                </td>
                                <td className="py-3 px-6">
                                  {test.passed ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                                      <CheckCircle size={16} /> Đạt
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 font-medium text-sm">
                                      <AlertTriangle size={16} /> Rối loạn
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-6">
                                  <div className="flex justify-end">
                                    <button 
                                      onClick={() => setSelectedVideo(test.videoUrl)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center gap-2 font-medium text-xs whitespace-nowrap"
                                    >
                                      <Eye size={14} /> Xem Video
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controller */}
                      {totalPages > 1 && (
                        <div className="p-4 bg-white/50 border-t border-slate-200/60 flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, group.tests.length)} trong số {group.tests.length}
                          </p>
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, pIdx) => {
                              const pNum = pIdx + 1;
                              return (
                                <button
                                  key={pNum}
                                  onClick={() => changePage(group.dateStr, pNum)}
                                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                                    currentPage === pNum 
                                      ? 'bg-blue-500 text-white shadow-md' 
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {pNum}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Video Modal Pseudo-implementation */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Video className="text-blue-500" size={20} />
                  Băng Hình Giám Sát Chi Tiết
                </h3>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="aspect-video bg-black relative flex items-center justify-center">
                <video src={selectedVideo} controls autoPlay className="w-full h-full object-contain" />
              </div>
              <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                <p className="text-sm text-slate-500">Mã file: {selectedVideo.split('/').pop()}</p>
                <a href={selectedVideo} download className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                  <Download size={16} /> Tải Video Về Máy
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>)}
    </main>
  );
}
