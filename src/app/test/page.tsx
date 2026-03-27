"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getRandomQuestions, Question } from "@/data/questions";
import { AlertTriangle, CheckCircle, VideoOff, Home } from "lucide-react";
import Image from "next/image";

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Tự động sinh ra 8 câu hỏi
    setQuestions(getRandomQuestions(8));

    return () => {
      stopRecordingLocally();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Xin quyền camera và web screen
      const userMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(userMedia);
      
      const displayMedia = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "browser" }, 
        audio: false, 
        preferCurrentTab: true 
      } as any);
      
      // Mẹo gộp chung màn hình và webcam vào 1 luồng để quay (Sử dụng Canvas hoặc record riêng DisplayMedia tuỳ chiến lược).
      // Để đơn giản prototype: Record thẳng màn hình (người dùng sẽ chia sẻ toàn màn hình). 
      // Khuôn mặt (webcam) sẽ luôn nổi trên UI web => nó sẽ được record chung vào DisplayMedia!
      
      const combinedStream = new MediaStream([...displayMedia.getVideoTracks()]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        setVideoBlob(blob);
        
        // Tắt tất cả track
        displayMedia.getTracks().forEach(t => t.stop());
        userMedia.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsStarted(true);
      setPermissionError("");

    } catch (err) {
      console.error("Không xin được quyền camera/screen:", err);
      setPermissionError("Phải cấp quyền truy cập Camera và Màn hình để thực hiện bài test.");
      // Fallback nếu từ chối
    }
  };

  useEffect(() => {
    if (isStarted && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isStarted, webcamStream]);

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
    const isCorrect = option === questions[currentIndex].correct;
    if (isCorrect) setScore(prev => prev + 1);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      stopRecordingLocally();
      setIsFinished(true);
    }
  };

  if (questions.length === 0) return null;

  if (!isStarted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-lg w-full text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <VideoOff className="text-blue-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Chuẩn Bị Kiểm Tra</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Hệ thống yêu cầu ghi hình màn hình và camera trong suốt quá trình làm bài để đảm bảo minh bạch.
            Vui lòng nhấn nút bên dưới và cấp quyền truy cập thiết bị.
          </p>
          
          {permissionError && (
             <p className="text-red-500 text-sm font-medium mb-4">{permissionError}</p>
          )}

          <button 
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-[0.98] text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-300"
          >
            Bắt đầu và Cho phép ghi hình
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
    const passed = score >= 4;
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
            {score} <span className="text-2xl text-slate-400">/ 8</span>
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
    <main className="min-h-screen py-10 px-4 flex flex-col items-center justify-center relative">
      
      {/* Webcam overlay to be captured by display media */}
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

      <div className="w-full max-w-3xl glass rounded-3xl p-5 md:p-8 relative mt-24 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 sm:gap-0">
          <div className="text-slate-500 font-medium">Câu hỏi {currentIndex + 1} / 8</div>
          <div className="flex gap-1 w-full sm:w-auto h-2 sm:h-auto">
            {questions.map((_, idx) => (
               <div key={idx} className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-blue-500 flex-1 sm:w-12' : idx < currentIndex ? 'bg-emerald-400 flex-1 sm:w-10' : 'bg-slate-200 flex-1 sm:w-10'}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          
          <div className="flex-1 w-full bg-white rounded-2xl p-2 md:p-4 shadow-sm border border-slate-100 aspect-square relative flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full max-w-[350px] max-h-[350px]"
              >
                <Image 
                  src={question.image} 
                  alt="Ishihara Test Plate" 
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 350px"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center gap-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Bạn nhìn thấy gì trong hình?</h3>
            
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="group relative w-full text-left bg-white/50 hover:bg-white border border-slate-200 hover:border-blue-400 p-4 md:p-5 rounded-xl transition-all duration-300 transform md:hover:-translate-y-1 hover:shadow-md active:scale-[0.98]"
              >
                <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors text-base md:text-lg">
                  {opt}
                </span>
                <div className="absolute left-0 top-0 bottom-0 w-0 bg-blue-500/10 rounded-xl group-hover:w-full transition-all duration-500 ease-out" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}
