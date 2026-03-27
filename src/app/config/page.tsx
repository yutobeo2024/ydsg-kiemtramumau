"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Settings, LogIn, LogOut, Plus, Pencil, Trash2,
  Eye, EyeOff, CheckCircle, AlertTriangle, Upload, X, Save, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

interface QuestionRow {
  id: number;
  image: string;
  options: string[];
  correct: string;
  active: number;
  sortOrder: number;
}

const emptyForm = { image: "", options: ["", "", "", ""], correct: "", active: true };

export default function ConfigPage() {
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Data state
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [questionCount, setQuestionCount] = useState(8);
  const [dataLoading, setDataLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [previewImg, setPreviewImg] = useState<string>("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => {
        setIsAdmin(d.isAdmin);
        if (d.isAdmin) loadData();
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const d = await res.json();
      if (res.ok) {
        setIsAdmin(true);
        setUsername(""); setPassword("");
        loadData();
      } else {
        setLoginError(d.error || "Đăng nhập thất bại");
      }
    } catch {
      setLoginError("Lỗi kết nối");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "POST" });
    setIsAdmin(false);
    setQuestions([]);
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [qRes, cfgRes] = await Promise.all([
        fetch("/api/questions/admin"),
        fetch("/api/config")
      ]);
      const qData = await qRes.json();
      const cfgData = await cfgRes.json();
      if (qRes.ok) setQuestions(qData.data);
      if (cfgRes.ok) setQuestionCount(cfgData.questionCount);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionCount })
    });
    if (res.ok) toast.success("Đã lưu cấu hình số câu hỏi!");
    else toast.error("Lỗi lưu cấu hình");
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setPreviewImg("");
    setShowForm(true);
  };

  const openEdit = (q: QuestionRow) => {
    setEditId(q.id);
    setForm({ image: q.image, options: [...q.options], correct: q.correct, active: q.active === 1 });
    setPreviewImg(q.image);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/questions/upload-image", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) {
        setForm(prev => ({ ...prev, image: d.url }));
        setPreviewImg(d.url);
        toast.success("Tải ảnh thành công!");
      } else {
        toast.error(d.error || "Lỗi upload ảnh");
      }
    } catch {
      toast.error("Lỗi upload ảnh");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!form.image) return toast.error("Vui lòng chọn hình ảnh");
    if (!form.correct) return toast.error("Vui lòng nhập đáp án đúng");
    const opts = form.options.filter(o => o.trim());
    if (opts.length < 2) return toast.error("Cần ít nhất 2 đáp án");
    if (!opts.includes(form.correct)) return toast.error("Đáp án đúng phải có trong danh sách đáp án");

    setSaving(true);
    try {
      const body = { image: form.image, options: opts, correct: form.correct, active: form.active };
      const res = editId
        ? await fetch(`/api/questions/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editId ? "Đã cập nhật câu hỏi!" : "Đã thêm câu hỏi!");
        setShowForm(false);
        loadData();
      } else {
        const d = await res.json();
        toast.error(d.error || "Lỗi lưu câu hỏi");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa câu hỏi"); loadData(); }
    else toast.error("Lỗi xóa câu hỏi");
    setDeleteId(null);
  };

  const toggleActive = async (q: QuestionRow) => {
    await fetch(`/api/questions/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: q.image, options: q.options, correct: q.correct, active: !q.active })
    });
    loadData();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // ── Login Screen ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Cấu Hình YDSG</h1>
          <p className="text-slate-500 text-sm mb-6">Chỉ quản trị viên mới được truy cập</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Tên đăng nhập</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white/60"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white/60"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <LogIn size={18} /> Đăng nhập
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  // ── Admin Dashboard ──────────────────────────────────────────────────────
  const activeCount = questions.filter(q => q.active).length;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            Cấu Hình Câu Hỏi YDSG
          </h1>
          <p className="text-slate-500 mt-1">{questions.length} câu hỏi · {activeCount} đang hoạt động</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
            <RefreshCw size={18} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-xl transition-colors text-sm">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Config: Số câu hỏi */}
      <div className="glass rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-lg">Số câu hỏi mỗi lần kiểm tra</h2>
          <p className="text-slate-500 text-sm mt-1">Tối đa {activeCount} câu đang hoạt động</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={activeCount || 50}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
            className="w-24 text-center text-2xl font-bold border-2 border-blue-200 focus:border-blue-500 rounded-xl py-2 outline-none"
          />
          <button onClick={handleSaveConfig} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-xl transition-all">
            <Save size={18} /> Lưu
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="glass rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">Danh sách câu hỏi</h2>
          <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> Thêm câu hỏi
          </button>
        </div>

        {dataLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map(q => (
              <div key={q.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors ${!q.active ? 'opacity-50' : ''}`}>
                {/* Preview ảnh */}
                <div className="w-16 h-16 relative flex-shrink-0 bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <Image src={q.image} alt="question" fill className="object-contain p-1" sizes="64px" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">#{q.id}</span>
                    {q.active ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Hoạt động</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Tắt</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{q.options.join(" · ")}</p>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">✓ {q.correct}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(q)} className={`p-2 rounded-lg transition-colors text-sm ${q.active ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`} title={q.active ? 'Tắt câu hỏi' : 'Bật câu hỏi'}>
                    {q.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => openEdit(q)} className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteId(q.id)} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-lg">{editId ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                {/* Image */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Hình ảnh <span className="text-red-500">*</span></label>
                  {previewImg && (
                    <div className="mb-3 relative w-full aspect-square max-w-[200px] mx-auto bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                      <Image src={previewImg} alt="preview" fill className="object-contain p-2" sizes="200px" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="/images/tam-so-1.jpg"
                      value={form.image}
                      onChange={e => { setForm(prev => ({ ...prev, image: e.target.value })); setPreviewImg(e.target.value); }}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-xl transition-colors text-sm whitespace-nowrap disabled:opacity-50">
                      {uploadingImg ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={15} />}
                      Tải lên
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Các đáp án (tối thiểu 2)</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm w-6 text-center">{i + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => setForm(prev => { const o = [...prev.options]; o[i] = e.target.value; return { ...prev, options: o }; })}
                          placeholder={`Đáp án ${i + 1}`}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct answer */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Đáp án đúng <span className="text-red-500">*</span></label>
                  <select
                    value={form.correct}
                    onChange={e => setForm(prev => ({ ...prev, correct: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
                  >
                    <option value="">-- Chọn đáp án đúng --</option>
                    {form.options.filter(o => o.trim()).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-6' : ''}`} />
                  </button>
                  <span className="text-sm text-slate-700 font-medium">{form.active ? "Đang hoạt động" : "Tắt câu hỏi này"}</span>
                </div>

                {/* Save */}
                <button onClick={handleSaveQuestion} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={18} />}
                  {editId ? "Lưu thay đổi" : "Thêm câu hỏi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500 w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Xác nhận xóa</h3>
              <p className="text-slate-500 text-sm mb-6">Câu hỏi #{deleteId} sẽ bị xóa vĩnh viễn. Không thể khôi phục!</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl transition-colors">Hủy</button>
                <button onClick={() => handleDelete(deleteId!)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors">Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
