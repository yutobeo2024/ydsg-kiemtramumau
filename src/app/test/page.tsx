"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Home, RotateCcw, X, ScreenShare, Loader2 } from "lucide-react";
import Image from "next/image";

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<{ id: number; image: string; options: string[]; correct: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [numInput, setNumInput] = useState(""); // bàn phím ảo
  const [isFinished, setIsFinished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [displayStream, setDisplayStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Fetch câu hỏi từ DB (theo cấu hình admin)
    fetch('/api/questions')
      .then(r => r.json())
      .then(d => { if (d.success) setQuestions(d.data); })
      .catch(console.error);

    return () => {
      stopRecordingLocally();
    };
  }, []);

  // Bước 1 (nhân viên): chỉ xin quyền và lưu stream, KHÔNG ghi
  const prepareStreams = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(userMedia);

      const displayMedia = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
        preferCurrentTab: true
      } as any);

      // Nếu user dừng chia sẻ giữa chừng → reset
      displayMedia.getVideoTracks()[0]?.addEventListener('ended', () => {
        setIsPrepared(false);
        setDisplayStream(null);
      });

      setDisplayStream(displayMedia);
      setIsPrepared(true);
      setPermissionError("");
    } catch (err) {
      console.error("Không xin được quyền camera/screen:", err);
      setPermissionError("Phải cấp quyền truy cập Camera và Màn hình để thực hiện bài test.");
    } finally {
      setIsPreparing(false);
    }
  };

  // Bước 2 (bệnh nhân): bắt đầu MediaRecorder từ stream đã có
  const startRecording = () => {
    if (!displayStream || !webcamStream) {
      setPermissionError("Mất stream ghi hình. Vui lòng cấp quyền lại.");
      setIsPrepared(false);
      return;
    }

    const combinedStream = new MediaStream([...displayStream.getVideoTracks()]);
    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
      setVideoBlob(blob);

      displayStream.getTracks().forEach(t => t.stop());
      webcamStream.getTracks().forEach(t => t.stop());
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setIsStarted(true);
  };

  useEffect(() => {
    if (isStarted && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isStarted, webcamStream]);

  // Preview webcam ở màn chấp thuận để bệnh nhân thấy mình trong khung hình
  useEffect(() => {
    if (isPrepared && !isStarted && webcamStream && previewVideoRef.current) {
      previewVideoRef.current.srcObject = webcamStream;
      previewVideoRef.current.play().catch(console.error);
    }
  }, [isPrepared, isStarted, webcamStream]);

  useEffect(() => {
    const uploadResult = async () => {
      if (isFinished && videoBlob && !isUploading) {
        setIsUploading(true);
        try {
          const patientInfoStr = sessionStorage.getItem("patientInfo");
          const info = patientInfoStr ? JSON.parse(patientInfoStr) : { fullName: "Bệnh Nhân Test", dob: "1990-01-01", ticketId: "YDSG-" + Math.floor(Math.random() * 900000) };
          
          const formData = new FormData();
          formData.append("video", videoBlob, "record.webm");
          formData.append("ticketId", info.ticketId || `YDSG-${Math.floor(Math.random() * 900000)}`);
          formData.append("fullName", info.fullName || "Khách Hàng YDSG");
          formData.append("dob", info.dob || "1900-01-01");
          formData.append("cccd", info.cccd || "");
          formData.append("examDate", info.examDate || "");
          formData.append("startTime", info.startTime || "");
          formData.append("score", score.toString());

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Server error');
          }
          console.log("Upload Success:", data);

        } catch (err: any) {
          console.error("Upload Error:", err);
          setUploadError(err.message);
        } finally {
          setIsUploading(false);
        }
      }
    };
    uploadResult();
  }, [isFinished, videoBlob]);

  const stopRecordingLocally = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnswer = (option: string) => {
    const isCorrect = option.trim() === questions[currentIndex].correct.trim();
    if (isCorrect) setScore(prev => prev + 1);
    setNumInput("");
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      stopRecordingLocally();
      setIsFinished(true);
    }
  };

  const handleRetake = async () => {
    setIsFinished(false);
    setIsStarted(false);
    setIsPrepared(false);
    setScore(0);
    setCurrentIndex(0);
    setNumInput("");
    setVideoBlobUrl(null);
    setVideoBlob(null);
    setUploadError("");
    setIsRecording(false);
    setWebcamStream(null);
    setDisplayStream(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    // Fetch bộ câu hỏi mới từ API
    try {
      const r = await fetch('/api/questions');
      const d = await r.json();
      if (d.success) setQuestions(d.data);
    } catch { /* giữ nguyên bộ cũ nếu lỗi mạng */ }
    // Cập nhật startTime mới
    const patientInfoStr = sessionStorage.getItem("patientInfo");
    if (patientInfoStr) {
      const info = JSON.parse(patientInfoStr);
      sessionStorage.setItem("patientInfo", JSON.stringify({ ...info, startTime: new Date().toISOString() }));
    }
  };

  if (questions.length === 0) return null;

  // Bước nhân viên y tế: cấp quyền ghi hình trước khi đưa máy cho bệnh nhân
  if (!isPrepared) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-lg w-full"
        >
          <div className="inline-block px-3 py-1 mb-4 mx-auto rounded-full bg-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wide text-center">
            Dành cho nhân viên y tế
          </div>
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
              <ScreenShare className="text-amber-600 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 text-center">Chuẩn bị ghi hình</h2>
          <p className="text-slate-600 mb-6 leading-relaxed text-center">
            Bấm nút bên dưới và chọn <span className="font-semibold">Cho phép</span> khi trình duyệt yêu cầu chia sẻ thẻ. Sau đó đưa máy cho người khám đọc cam kết.
          </p>

          {permissionError && (
             <p className="text-red-500 text-sm font-medium mb-4 text-center">{permissionError}</p>
          )}

          <button
            onClick={prepareStreams}
            disabled={isPreparing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPreparing ? (
              <><Loader2 className="animate-spin" size={20} /> Đang chờ cấp quyền...</>
            ) : (
              <><ScreenShare size={20} /> Cấp quyền ghi hình</>
            )}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 font-medium py-3 px-6 rounded-xl transition-all duration-300"
          >
            <Home size={18} />
            Quay về trang chủ
          </button>
        </motion.div>
      </main>
    );
  }

  // Bước bệnh nhân: đọc cam kết và xác nhận (popup quyền đã xong)
  if (!isStarted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-lg w-full"
        >
          <div className="mb-6 flex justify-center">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-black shadow-lg border-4 border-white">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute bottom-1 left-1 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold text-white drop-shadow">SẴN SÀNG</span>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 text-center">Chấp thuận Ghi hình Y tế</h2>
          <p className="text-slate-600 mb-6 leading-relaxed text-center">
            Để đảm bảo tính minh bạch và xác thực đúng người khám, bài test này sẽ được ghi hình lại.
          </p>

          <ul className="space-y-3 mb-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
            <li className="flex gap-3">
              <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-slate-700 text-sm leading-relaxed">
                Tôi đồng ý để hệ thống quay lại khuôn mặt trong suốt quá trình làm bài test mù màu.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-slate-700 text-sm leading-relaxed">
                Video này chỉ được sử dụng cho mục đích xác thực danh tính lái xe và lưu trữ hồ sơ y tế theo Nghị định 13/2023/NĐ-CP.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-slate-700 text-sm leading-relaxed">
                Tôi cam kết không đeo khẩu trang, kính râm khi thực hiện bài test này.
              </span>
            </li>
          </ul>

          {permissionError && (
             <p className="text-red-500 text-sm font-medium mb-4 text-center">{permissionError}</p>
          )}

          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 uppercase tracking-wide"
          >
            Tôi đồng ý &amp; Bắt đầu làm bài test
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 font-medium py-3 px-6 rounded-xl transition-all duration-300"
          >
            <Home size={18} />
            Khám mới / Quay về trang chủ
          </button>
        </motion.div>
      </main>
    );
  }

  if (isFinished) {
    const total = questions.length;
    const passed = score >= Math.ceil(total / 2);
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-lg w-full text-center"
        >
          <div className="mb-6 flex justify-center">
            {passed ? (
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-emerald-500 w-12 h-12" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-500 w-12 h-12" />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Kết Quả Bài Test</h2>
          <p className="text-slate-500 mb-6">Hồ sơ đã được lưu trữ an toàn</p>

          <div className="text-5xl font-black mb-2 text-slate-800">
            {score} <span className="text-2xl text-slate-400">/ {questions.length}</span>
          </div>
          
          <div className={`text-lg font-semibold mb-6 ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
            Đánh giá: {passed ? 'Bình thường' : 'Không đạt / Có dấu hiệu mù màu'}
          </div>
          
          {isUploading && (
             <div className="mb-6 text-blue-600 font-medium flex items-center justify-center gap-2">
               <div className="w-5 h-5 border-2 border-blue-500 border-t-white rounded-full animate-spin"></div>
               Đang nén và lưu video lên máy chủ...
             </div>
          )}
          
          {!isUploading && uploadError && (
             <div className="mb-6 p-3 bg-red-100 text-red-700 font-medium rounded-lg text-sm">
               Lỗi lưu tự động: {uploadError}
             </div>
          )}

          {!isUploading && !uploadError && videoBlobUrl && (
            <div className="mb-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-emerald-600 mb-2 flex items-center justify-center gap-2">
                <CheckCircle size={16}/> Đã lưu kết quả thành công System YDSG
              </p>
              <video src={videoBlobUrl} controls className="w-full rounded-lg shadow-sm" />
            </div>
          )}

          {/* Nút Làm Lại */}
          <button
            onClick={handleRetake}
            disabled={isUploading}
            className="w-full mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw size={20} />
            <span>Làm Lại Bài Kiểm Tra</span>
          </button>

          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300"
          >
            <Home size={20} />
            <span>Về Màn Hình Chính</span>
          </button>

        </motion.div>
      </main>
    );
  }

  const question = questions[currentIndex];

  return (
    <main className="min-h-screen py-6 px-4 flex flex-col items-center justify-center relative">
      
      {/* Webcam overlay */}
      <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 w-28 md:w-48 aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white/50 backdrop-blur-md">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover mirror" 
          style={{ transform: "scaleX(-1)" }} 
        />
        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-1.5 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] md:text-xs font-semibold text-white drop-shadow-md">[REC]</span>
        </div>
      </div>

      <div className="w-full max-w-5xl glass rounded-3xl p-5 md:p-8 relative mt-24 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <div className="text-slate-500 font-medium text-lg">Câu hỏi {currentIndex + 1} / {questions.length}</div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex gap-1.5 flex-1 sm:flex-none h-2.5 sm:h-auto">
              {questions.map((_, idx) => (
                 <div key={idx} className={`h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-blue-500 flex-1 sm:w-14' : idx < currentIndex ? 'bg-emerald-400 flex-1 sm:w-12' : 'bg-slate-200 flex-1 sm:w-12'}`} />
              ))}
            </div>
            {/* Nút huỷ bài */}
            <button
              onClick={() => {
                if (window.confirm('Huỷ bài kiểm tra và quay về trang chủ?')) {
                  stopRecordingLocally();
                  router.push('/');
                }
              }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl transition-all duration-200"
              title="Huỷ bài kiểm tra"
            >
              <X size={14} />
              <span className="hidden sm:inline">Huỷ bài</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
          
          {/* Image - Lớn hơn */}
          <div className="flex-[3] w-full bg-white rounded-2xl p-3 shadow-sm border border-slate-100 aspect-square relative flex items-center justify-center min-h-[300px] lg:min-h-[572px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
                style={{ maxWidth: '624px', maxHeight: '624px', margin: '0 auto' }}
              >
                <Image 
                  src={question.image} 
                  alt="Ishihara Test Plate" 
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 624px"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Answers: bàn phím ảo + nút không thấy số */}
          <div className="flex-[2] w-full flex flex-col justify-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Bạn nhìn thấy gì trong hình?</h3>

            {/* Hiển thị số đã nhập */}
            <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 min-h-[64px]">
              <span className="text-3xl font-bold tracking-widest text-blue-600 flex-1">
                {numInput || <span className="text-slate-300 text-xl font-normal">Nhập số bạn nhìn thấy...</span>}
              </span>
              {numInput && (
                <button
                  onClick={() => setNumInput(prev => prev.slice(0, -1))}
                  className="ml-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors font-mono text-sm"
                >
                  ←
                </button>
              )}
            </div>

            {/* Bàn phím ảo: 1-9 (không có 0) */}
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => setNumInput(prev => prev + n)}
                  className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 active:scale-95 font-bold text-2xl text-slate-700 hover:text-blue-600 py-4 rounded-xl transition-all duration-150 shadow-sm"
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Nút Xác nhận số - luôn render để giữ layout ổn định */}
            <button
              onClick={() => handleAnswer(numInput)}
              disabled={!numInput}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98] text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:from-blue-600 disabled:hover:to-blue-700"
            >
              {numInput ? <>Xác nhận: &ldquo;{numInput}&rdquo;</> : 'Xác nhận'}
            </button>

            {/* Nút Không thấy số */}
            <button
              onClick={() => handleAnswer('Không thấy số')}
              className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-semibold py-4 rounded-xl transition-all duration-200"
            >
              🚫 Không thấy số nào
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
