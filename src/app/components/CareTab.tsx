import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { Plus, Trash2, CheckSquare, Clock, BookOpen, X, ChevronRight, Search, Mic, Calendar, SearchCheck, Info, MessageSquare } from "lucide-react";
import { Task, TaskCategory as Category, JournalEntry, Tab, CATEGORY_META } from "../types";

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: "服用早晨藥物", note: "降血壓藥 × 1 顆", time: "08:00", category: "Medication", done: true },
  { id: 2, title: "量測血壓", note: "記錄數值回報醫師", time: "09:00", category: "Health", done: true },
  { id: 3, title: "午餐均衡飲食", note: "低鹽低糖原則", time: "12:00", category: "Nutrition", done: false },
  { id: 4, title: "散步 30 分鐘", note: "飯後緩步行走", time: "14:00", category: "Exercise", done: false },
  { id: 5, title: "服用晚間藥物", note: "助眠藥 × 1 顆", time: "21:00", category: "Medication", done: false },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  { id: 1, time: "14:32", type: "⚠️ 危險警報", category: "alert", message: "偵測到疑似火源，已通知管理員", description: "客廳視角辨識出 45cm 寬之明火火焰，系統於 2 秒內立即觸發警報並推播至管理端。建議立即前往確認。", color: "#f5516c" },
  { id: 2, time: "12:08", type: "👤 人員偵測", category: "person", message: "陌生訪客進入玄關區域", description: "門口攝影機捕捉到陌生中年男性停留超過 30 秒，特徵：藍色上衣、黑色後背包。已啟動鎖定追蹤。", color: "#4facfe" },
  { id: 3, time: "09:45", type: "🏃 活動記錄", category: "activity", message: "長者完成早晨散步 25 分鐘", description: "庭院區域偵測到受照護者穩定行走，平均步速 1.2m/s。活動指標符合今日健康規範。", color: "#00c48c" },
  { id: 4, time: "08:03", type: "💊 用藥提醒", category: "health", message: "早晨藥物服用確認完成", description: "AI 辨識到患者於藥盒提取動作，並有飲水吞服行為，標記為「已按時服用」。", color: "#a78bfa" },
  { id: 5, time: "07:30", type: "🌅 系統啟動", category: "system", message: "SmartGuard 日間防護模式已開啟", description: "全屋 4 處監控點已同步上線，AI 視覺引擎加載完畢，錄影儲存空間剩餘 1.2TB。", color: "#f9a825" },
];

export function CareTab({
  isActive = true,
  isMobile = false,
  tasks,
  setTasks,
  journalEntries,
  setJournalEntries
}: {
  isActive?: boolean,
  isMobile?: boolean,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  journalEntries: JournalEntry[],
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>
}) {
  const [activeMode, setActiveMode] = useState<"tasks" | "journal">("tasks");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Journal State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteJournalId, setConfirmDeleteJournalId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("General");

  const overlayRef = useRef<HTMLDivElement>(null);

  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleAddTask = () => {
    if (!formTitle.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title: formTitle.trim(),
      note: formNote.trim(),
      time: formTime || "--:--",
      category: formCategory,
      done: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setFormTitle("");
    setFormNote("");
    setFormTime("");
    setFormCategory("General");
    setShowForm(false);
  };

  // Dismiss delete confirm when clicking elsewhere
  useEffect(() => {
    if (confirmDeleteId === null) return;
    const handler = () => setConfirmDeleteId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [confirmDeleteId]);

  return (
    <div
      className="flex flex-col gap-5 p-4 pb-32 overflow-y-auto h-full"
      style={{
        background: "transparent"
      }}
    >
      {/* Header with Glassmorphism */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">智能照護</h2>
          <p className="text-gray-500 font-bold text-xs mt-0.5 opacity-70">AI 輔助日常追蹤與分析</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/60 active:scale-90 shadow-lg shadow-blue-500/10 border border-white"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-inner">
            <Plus size={20} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* Mode Switcher - Segmented Control Style */}
      <div className="flex p-1.5 rounded-2xl bg-white/40 border border-white/50 backdrop-blur-xl shadow-inner relative overflow-hidden mb-2">
        {(["tasks", "journal"] as const).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl gap-2 relative transition-all"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {activeMode === mode && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-x-0 inset-y-0.5 bg-white rounded-xl shadow-sm z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {mode === "tasks" ? (
                <CheckSquare size={16} className={activeMode === mode ? "text-blue-500" : "text-gray-400"} />
              ) : (
                <BookOpen size={16} className={activeMode === mode ? "text-blue-500" : "text-gray-400"} />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: activeMode === mode ? "#1e293b" : "#94a3b8",
                }}
              >
                {mode === "tasks" ? "待辦任務" : "事件日誌"}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tasks Mode */}
      {activeMode === "tasks" && (
        <>
          {/* Progress Bar */}
          <div
            className="rounded-3xl px-6 py-5 glass-panel relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              boxShadow: "0 10px 25px -10px rgba(59, 130, 246, 0.15)"
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#475569] font-black tracking-tight" style={{ fontSize: 13 }}>
                今日進度 · {completedCount}/{tasks.length}
              </span>
              <span className="text-blue-600 font-black" style={{ fontSize: 14 }}>{progress}%</span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden bg-slate-200/50"
              style={{
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  boxShadow: "0 0 12px rgba(59,130,246,0.3)",
                }}
              />
            </div>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 gap-4 rounded-3xl animate-in zoom-in-95 duration-500"
              style={{
                background: "rgba(255, 255, 255, 0.4)",
                border: "1px dashed rgba(59, 130, 246, 0.2)",
              }}
            >
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl shadow-inner">🎉</div>
              <div className="text-center">
                <p className="text-gray-700 font-black" style={{ fontSize: 15 }}>所有任務已完成！</p>
                <p className="text-gray-400 mt-1 font-bold" style={{ fontSize: 11 }}>點擊右上角「＋」新增今日任務</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tasks.map((task) => {
                const meta = CATEGORY_META[task.category];
                const isConfirming = confirmDeleteId === task.id;
                return (
                  <motion.div
                    key={task.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center gap-4 px-5 py-5 rounded-[28px] cursor-pointer transition-all duration-300 relative overflow-hidden group border border-white"
                    style={{
                      background: task.done ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.65)",
                      backdropFilter: "blur(12px)",
                      boxShadow: task.done ? "none" : "0 8px 30px rgba(0,0,0,0.04)",
                      opacity: task.done ? 0.7 : 1,
                    }}
                    onClick={() => toggleTask(task.id)}
                  >
                    {/* Checkbox */}
                    <motion.div
                      className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300 border"
                      animate={{
                        scale: task.done ? 1 : 1,
                        backgroundColor: task.done ? "rgba(59, 130, 246, 1)" : "rgba(255, 255, 255, 0.5)",
                        borderColor: task.done ? "rgba(59, 130, 246, 0.2)" : "rgba(203, 213, 225, 0.5)"
                      }}
                      style={{
                        boxShadow: task.done ? "0 4px 12px rgba(59,130,246,0.3)" : "inset 0 2px 4px rgba(0,0,0,0.02)"
                      }}
                    >
                      {task.done ? (
                        <CheckSquare size={18} className="text-white" strokeWidth={3} />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-gray-800 tracking-tight"
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          textDecoration: task.done ? "line-through" : "none",
                          color: task.done ? "#64748b" : "#1e293b",
                        }}
                      >
                        {task.title}
                      </p>
                      {task.note && (
                        <p className="text-slate-500 truncate mt-1 font-bold" style={{ fontSize: 11 }}>
                          {task.note}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md"
                          style={{ background: `${meta.color}15`, color: meta.color, fontSize: 10, fontWeight: 900, border: `1px solid ${meta.color}25` }}
                        >
                          {meta.emoji} {meta.label}
                        </span>
                        {task.time !== "--:--" && (
                          <span className="flex items-center gap-1.5 text-slate-400 font-black" style={{ fontSize: 10 }}>
                            <Clock size={12} strokeWidth={2.5} /> {task.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Icon Overlay */}
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleDeleteClick(task.id, e)}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background: isConfirming ? "#ef4444" : "transparent",
                        border: isConfirming ? "none" : "1px solid rgba(0,0,0,0.03)"
                      }}
                    >
                      <Trash2
                        size={18}
                        strokeWidth={2.5}
                        style={{ color: isConfirming ? "#fff" : "#94a3b8" }}
                      />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Journal Mode */}
      {activeMode === "journal" && (
        <div className="flex flex-col gap-5">
          {/* Top Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl transition-all group-focus-within:bg-blue-500/10" />
            <div className="relative flex items-center">
              <Search className="absolute left-4.5 text-gray-400" size={18} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="搜尋事件提醒或歷史紀錄..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/60 border border-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:shadow-xl focus:shadow-blue-500/5"
                style={{ backdropFilter: "blur(10px)" }}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "all", label: "全部", icon: <SearchCheck size={14} /> },
              { id: "alert", label: "警報", icon: "🚨" },
              { id: "health", label: "用藥", icon: "💊" },
              { id: "person", label: "人員", icon: "👤" },
              { id: "activity", label: "活動", icon: "🏃" }
            ].map(cat => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl flex items-center gap-2 border transition-all duration-300 ${selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                  : "bg-white/40 text-slate-500 border-white/60"
                  }`}
                style={{ fontSize: 13, fontWeight: 800, backdropFilter: "blur(10px)" }}
              >
                <span className="scale-110">{cat.icon}</span> {cat.label}
              </motion.button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="flex items-center justify-between bg-white/30 px-4 py-3 rounded-2xl border border-white/50">
            <div className="flex items-center gap-2.5">
              <Calendar size={15} className="text-blue-500" strokeWidth={2.5} />
              <span className="text-slate-600 font-black" style={{ fontSize: 13 }}>歷史日誌日期</span>
            </div>
            <div className="flex gap-2">
              {["2025-05-18", "2025-05-19", "2025-05-20"].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${selectedDate === d ? "bg-white text-blue-600 border-blue-200 shadow-sm" : "bg-transparent text-slate-400 border-transparent"
                    }`}
                >
                  {d.split('-')[2]}
                </button>
              ))}
            </div>
          </div>

          {/* Log List */}
          <div className="flex flex-col gap-4">
            {journalEntries
              .filter(e => (selectedCategory === "all" || e.category === selectedCategory))
              .filter(e => e.message.includes(searchQuery) || e.type.includes(searchQuery))
              .map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="rounded-3xl overflow-hidden transition-all duration-500 group"
                    style={{
                      background: isExpanded ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.55)",
                      border: isExpanded ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.8)",
                      boxShadow: isExpanded ? "0 20px 40px -12px rgba(0,0,0,0.12)" : "0 4px 15px rgba(0,0,0,0.03)",
                      backdropFilter: "blur(15px)"
                    }}
                  >
                    <div className="flex items-center gap-4 px-5 py-5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 relative"
                        style={{ background: entry.color }}
                      >
                        <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: entry.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black tracking-tight" style={{ fontSize: 14, color: entry.color }}>
                            {entry.type}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 font-bold" style={{ fontSize: 11 }}>
                            <Clock size={11} /> {entry.time}
                          </span>
                        </div>
                        <p className={`text-slate-700 leading-tight ${isExpanded ? 'font-black' : 'font-bold'}`} style={{ fontSize: 14 }}>
                          {entry.message}
                        </p>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} className="text-slate-300">
                        <ChevronRight size={18} strokeWidth={3} />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 border-t border-slate-100/60 pt-4"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/50">
                              <MessageSquare size={16} className="text-blue-500 mt-0.5" />
                              <p className="text-slate-600 leading-relaxed font-bold" style={{ fontSize: 13 }}>
                                {entry.description}
                              </p>
                            </div>

                            {(entry.category === 'person' || entry.category === 'alert') && (
                              <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg">
                                <img
                                  src={`https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80`}
                                  alt="Capture"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-red-600 text-white text-[9px] font-black tracking-widest">LIVE CAPTURE</div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                                查看錄影回放
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteJournalId(entry.id);
                                }}
                                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-400 text-xs active:scale-95 transition-all hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Glassmorphism Bottom Sheet */}
      {mounted && showForm && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === overlayRef.current) setShowForm(false); }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-sm rounded-t-[40px] p-7 border-t border-white"
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(30px)",
              boxShadow: "0 -20px 50px -10px rgba(0,0,0,0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">新增照護任務</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400 active:scale-90"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-slate-500 font-black text-[11px] uppercase tracking-wider ml-1">任務名稱</label>
                <input
                  type="text"
                  placeholder="例如：服用早晨藥物"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 text-slate-700 font-bold outline-none focus:bg-white focus:border-blue-400 focus:shadow-xl focus:shadow-blue-500/5 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-500 font-black text-[11px] uppercase tracking-wider ml-1">備註說明</label>
                <input
                  type="text"
                  placeholder="備註資訊 (選填)..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 text-slate-700 font-bold outline-none focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-slate-500 font-black text-[11px] uppercase tracking-wider ml-1">執行時間</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 text-slate-700 font-black outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-slate-500 font-black text-[11px] uppercase tracking-wider ml-1">類別標籤</label>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                    const m = CATEGORY_META[cat];
                    const selected = formCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`flex flex-col items-center py-2.5 rounded-2xl gap-1.5 transition-all border-2 ${selected ? 'shadow-lg' : 'border-transparent bg-slate-100/50'}`}
                        style={{
                          borderColor: selected ? m.color : "transparent",
                          background: selected ? `${m.color}10` : "",
                          boxShadow: selected ? `0 8px 15px -5px ${m.color}30` : ""
                        }}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[8px] font-black" style={{ color: selected ? m.color : "#94a3b8" }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAddTask}
                disabled={!formTitle.trim()}
                className="w-full py-5 rounded-[24px] text-white font-black text-base shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mt-4"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  boxShadow: "0 15px 30px -10px rgba(59, 130, 246, 0.4)"
                }}
              >
                ＋ 新增今日任務
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
