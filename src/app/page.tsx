"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { QrCode, User, Calendar, FileText, ArrowRight, ShieldCheck, Video, CreditCard, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    dob: new Date().toISOString().split("T")[0],
    ticketId: "",
    cccd: "",
    examDate: ""
  });

  useEffect(() => {
    let active = true;
    let timerId: ReturnType<typeof setTimeout>;
    if (showScanner) {
      // setTimeout ensures the <video> element is mounted before we access it
      timerId = setTimeout(() => {
        if (!active || !videoRef.current) return;
        import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
          if (!active) return;
          const codeReader = new BrowserMultiFormatReader();
          // decodeFromVideoDevice returns a Promise<IScannerControls>
          codeReader.decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
            if (result && active) {
              const decodedText = result.getText();
              controls?.stop();
              readerRef.current = null;
              active = false;
              setShowScanner(false);
              // Format: DD/MM/YYYY-CCCD e.g. 27/03/2026-051094005597
              const dashIdx = decodedText.indexOf('-');
              if (dashIdx !== -1) {
                const examDate = decodedText.substring(0, dashIdx);
                const cccd = decodedText.substring(dashIdx + 1);
                setFormData(prev => ({
                  ...prev,
                  ticketId: decodedText,
                  examDate,
                  cccd
                }));
                toast.success('Quét mã QR thành công!');
              } else {
                toast.error('Mã QR không đúng định dạng YDSG (DD/MM/YYYY-CCCD)');
              }
            }
          }).then(controls => {
            if (active) readerRef.current = controls;
            else controls?.stop();
          }).catch((e: any) => {
            if (active) toast.error('Không mở được camera: ' + e.message);
          });
        });
      }, 0);
    }
    return () => {
      active = false;
      clearTimeout(timerId);
      if (readerRef.current) {
        try { readerRef.current.stop(); } catch(e) {}
        readerRef.current = null;
      }
    };
  }, [showScanner]);



  const handleSimulateScan = () => {
    setShowScanner(true);
  };

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.dob || !formData.ticketId || !formData.cccd) {
      toast.error("Vui lòng nhập đầy đủ thông tin hoặc quét mã QR");
      return;
    }
    setLoading(true);
    // Lưu thông tin tạm vào sessionStorage để trang test dùng
    // Update: add startTime
    const submitData = { ...formData, startTime: new Date().toISOString() };
    sessionStorage.setItem("patientInfo", JSON.stringify(submitData));
    
    // Yêu cầu quyền camera/screen trước khi chuyển trang (trong thực tế có thể làm thẳng bên trang test)
    setTimeout(() => {
      router.push("/test");
    }, 800);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Title & Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center md:text-left space-y-6"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4 border border-blue-200">
            Hệ thống quản lý YDSG
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">
            Kiểm Tra Sắc Giác <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Minh Bạch & Chuẩn Xác
            </span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Hệ thống thực hiện bài test Ishihara tự động, tích hợp ghi hình khuôn mặt và màn hình nhằm đảm bảo tính toàn vẹn cho hồ sơ khám sức khỏe.
          </p>
          
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center gap-3 text-slate-700">
              <ShieldCheck className="text-emerald-500" size={20} />
              <span>Chống gian lận với Picture-in-Picture Record</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Video className="text-purple-500" size={20} />
              <span>Lưu trữ Video an toàn trên máy chủ VPS</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
            
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-outfit">Thông tin Khách Hàng</h2>
            
            {showScanner && (
              <div className="mb-6 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-slate-700">Đưa mã QR vào khung hình</span>
                  <button
                    type="button"
                    onClick={() => setShowScanner(false)}
                    className="text-red-500 p-1 hover:bg-red-50 rounded-full transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="relative w-full bg-black rounded-xl overflow-hidden border border-slate-200" style={{ aspectRatio: '4/3' }}>
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-blue-400 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md"/>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md"/>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md"/>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md"/>
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 animate-[scan_2s_linear_infinite]"
                        style={{ animation: 'scan 2s linear infinite' }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Hướng camera vào mã QR trên phiếu khám</p>
              </div>
            )}

            {!showScanner && (
              <button 
                onClick={handleSimulateScan}
                type="button"
                className="w-full mb-6 relative overflow-hidden flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform active:scale-[0.98]"
              >
                <QrCode size={20} />
                <span>Quét Mã QR Phiếu Khám</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            )}

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Hoặc nhập thủ công</span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <form onSubmit={handleStartTest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 ml-1">Họ và Tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">Ngày Kiểm Tra</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="date" 
                      required
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">Số CCCD</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formData.cccd}
                      onChange={e => setFormData({...formData, cccd: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl transition-all"
                      placeholder="Số căn cước công dân"
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Mã Phiếu (Ngày khám - CCCD)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formData.ticketId}
                      onChange={e => setFormData({...formData, ticketId: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl transition-all"
                      placeholder="YDSG-..."
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Bắt đầu Bài Kiểm Tra</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
