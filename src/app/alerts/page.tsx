"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, Download, AlertTriangle, Video, X, ChevronDown, ChevronRight, Calendar as CalendarIcon, Filter, BellRing } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function AlertsDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [dbData, setDbData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    fetch('/api/tests')
      .then(res => res.json())
      .then(res => {
        if(res.success && res.data) {
          const mapped = res.data
            .filter((row: any) => row.passed === 0) // Lọc riêng ca rớt
            .map((row: any) => {
               const d = new Date(row.createdAt);
               return {
                 id: row.id,
                 ticketId: row.ticketId,
                 fullName: row.fullName,
                 score: row.score,
                 passed: false,
                 videoUrl: row.videoUrl,
                 dateObj: d,
                 dateStr: row.createdAt.split(" ")[0],
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

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

    const groups: Record<string, typeof dbData> = {};
    filtered.forEach(test => {
      if (!groups[test.dateStr]) groups[test.dateStr] = [];
      groups[test.dateStr].push(test);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedGroupKeys.map(key => ({
      dateStr: key,
      tests: groups[key].sort((a, b) => b.id - a.id)
    }));
  }, [dbData, searchTerm, fromDate, toDate]);

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-red-50/30">
      {/* Header đỏ nổi bật */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-100/80 rounded-2xl text-red-600 shadow-sm border border-red-200">
            <BellRing size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Cảnh Báo YDSG</h1>
            <p className="text-red-500 font-medium mt-1 inline-flex items-center gap-2">
               Chỉ hiển thị bệnh nhân KHÔNG ĐẠT sắc giác (&lt; 4 câu)
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="w-full xl:w-auto flex flex-col lg:flex-row gap-3 lg:gap-4 flex-wrap">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white px-4 py-2 border border-red-200 rounded-xl shadow-sm w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-red-400 hidden sm:block" />
              <span className="text-sm font-medium sm:font-normal text-slate-500">Từ:</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent text-sm outline-none text-slate-700 flex-1 sm:flex-none p-1 sm:p-0 border sm:border-transparent border-red-200 rounded-lg sm:rounded-none focus:text-red-600" 
              />
            </div>
            <div className="w-full h-px sm:w-px sm:h-6 bg-slate-200 my-1 sm:my-0 sm:mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium sm:font-normal text-slate-500">Đến:</span>
              <input 
                type="date" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent text-sm outline-none text-slate-700 flex-1 sm:flex-none p-1 sm:p-0 border sm:border-transparent border-red-200 rounded-lg sm:rounded-none focus:text-red-600" 
              />
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-red-400" size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Tìm bệnh nhân bị cảnh báo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none rounded-xl transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {!isClient || isLoading ? (
        <div className="flex justify-center p-12 flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải biểu mẫu từ Hệ thống YDSG...</p>
        </div>
      ) : (
      <div className="space-y-6">
        {groupedData.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl text-slate-500 flex flex-col items-center">
            <AlertTriangle size={48} className="text-emerald-300 mb-4" />
            <p className="text-lg font-medium text-emerald-600">Tuyệt vời! Không có bệnh nhân nào bị cảnh báo mù màu.</p>
          </div>
        ) : (
          groupedData.map(group => {
            const isToday = group.dateStr === todayStr;
            const isExpanded = expandedGroups[group.dateStr] ?? isToday;
            const currentPage = pages[group.dateStr] || 1;
            const totalPages = Math.ceil(group.tests.length / ITEMS_PER_PAGE);
            const paginatedTests = group.tests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
            
            const [y, m, d] = group.dateStr.split("-");
            const formattedDate = `${d}/${m}/${y}`;

            return (
              <motion.div 
                key={group.dateStr}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl overflow-hidden shadow-lg shadow-red-900/5 border border-red-100"
              >
                {/* Accordion Header */}
                <button 
                  onClick={() => toggleGroup(group.dateStr)}
                  className="w-full px-4 md:px-6 py-4 bg-white/70 hover:bg-white flex items-center justify-between border-b border-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isToday ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      <CalendarIcon size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className={`text-base md:text-lg font-bold ${isToday ? 'text-red-700' : 'text-slate-700'}`}>
                        {isToday ? "Cảnh báo Hôm Nay" : `Phát hiện ngày ${formattedDate}`}
                      </h2>
                      <p className="text-xs md:text-sm font-medium text-red-500">{group.tests.length} trường hợp rối loạn</p>
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
                            <tr className="bg-red-50/50">
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">Thời Gian</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">ID Phiếu</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm">Họ và Tên</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm text-center">Mức Độ</th>
                              <th className="py-3 px-6 font-semibold text-slate-600 text-sm text-right">Theo Dõi Lại</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedTests.map(test => (
                              <tr key={test.id} className="border-t border-red-50 hover:bg-red-50/60 transition-colors">
                                <td className="py-3 px-6 text-slate-500 font-mono text-sm">{test.timeStr}</td>
                                <td className="py-3 px-6 text-slate-500 font-mono text-sm">{test.ticketId}</td>
                                <td className="py-3 px-6 font-bold text-slate-800">{test.fullName}</td>
                                <td className="py-3 px-6 text-center">
                                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 shadow-sm border border-red-200">
                                    Nghiêm trọng: {test.score} / 8
                                  </span>
                                </td>
                                <td className="py-3 px-6">
                                  <div className="flex justify-end">
                                    <button 
                                      onClick={() => setSelectedVideo(test.videoUrl)}
                                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2 font-bold text-xs whitespace-nowrap"
                                    >
                                      <Eye size={14} /> Kiểm tra AI/Gian lận
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
                        <div className="p-4 bg-white/50 border-t border-red-100 flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Trang báo cáo {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, group.tests.length)} của {group.tests.length} ca
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
                                      ? 'bg-red-500 text-white shadow-md' 
                                      : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
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
      )}

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
               className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500"
             >
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                 <h3 className="font-bold text-red-700 flex items-center gap-2">
                   <AlertTriangle className="text-red-500" size={20} />
                   Xem lại bài Test Bất Thường
                 </h3>
                 <button 
                   onClick={() => setSelectedVideo(null)}
                   className="p-1 hover:bg-red-200 rounded-full transition-colors text-slate-500 hover:text-red-700"
                 >
                   <X size={20} />
                 </button>
               </div>
               <div className="aspect-video bg-black relative flex items-center justify-center">
                 <video src={selectedVideo} controls autoPlay className="w-full h-full object-contain" />
               </div>
               <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                 <p className="text-sm text-slate-500 font-mono">File Bằng Chứng Lỗi</p>
                 <a href={selectedVideo} download className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors">
                  <Download size={16} /> Tải Xuống Báo Cáo
                </a>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </main>
  );
}
