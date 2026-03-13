import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { Plus, Trash2, CheckSquare, Clock, BookOpen, X, ChevronRight, Search, Mic, Calendar, SearchCheck, Info, MessageSquare } from "lucide-react";

import { Task, TaskCategory as Category, JournalEntry, Tab } from "../types";

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
    <div className="flex flex-col gap-4 px-4 pb-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-gray-700" style={{ fontWeight: 700, fontSize: 18 }}>照護管理</h2>
          <p className="text-xs text-gray-400" style={{ fontWeight: 500 }}>任務與事件紀錄</p>
        </div>
        {activeMode === "tasks" && (
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shimmer-container transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg, rgba(79, 172, 254, 0.9), rgba(0, 242, 254, 0.9))",
              boxShadow: "3px 3px 10px rgba(79,172,254,0.4), inset 0 0 0 1px rgba(255,255,255,0.3)",
            }}
          >
            <div className="shimmer-effect" />
            <Plus size={20} className="text-white relative z-10" />
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex p-1.5 rounded-2xl glass-panel relative">
        {(["tasks", "journal"] as const).map((mode) => (
          <motion.button
            key={mode}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => setActiveMode(mode)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 relative z-10"
          >
            {activeMode === mode && (
              <motion.div
                layoutId="active-mode-bg"
                className="absolute inset-0 bg-blue-500 rounded-xl shadow-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-20 flex items-center gap-2">
              {mode === "tasks" ? (
                <CheckSquare size={16} className={activeMode === mode ? "text-white" : "text-gray-400"} />
              ) : (
                <BookOpen size={16} className={activeMode === mode ? "text-white" : "text-gray-400"} />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: activeMode === mode ? "#fff" : "#9ba8b4",
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
            className="rounded-3xl px-5 py-4 glass-panel"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-extrabold" style={{ fontSize: 13 }}>
                今日進度 · {completedCount}/{tasks.length}
              </span>
              <span className="text-blue-500 font-black" style={{ fontSize: 13 }}>{progress}%</span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden bg-white/30 backdrop-blur-inner"
              style={{
                boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                style={{
                  background: "linear-gradient(90deg, #4facfe, #00f2fe)",
                  boxShadow: "0 0 10px rgba(79,172,254,0.5)",
                }}
              />
            </div>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center py-10 gap-3 rounded-2xl"
              style={{
                background: "#F0F4F8",
                boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
              }}
            >
              <span style={{ fontSize: 36 }}>🎉</span>
              <p className="text-gray-500" style={{ fontSize: 13, fontWeight: 700 }}>所有任務已完成！</p>
              <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 500 }}>點擊右上角「＋」新增任務</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-1">
              {tasks.map((task) => {
                const meta = CATEGORY_META[task.category];
                const isConfirming = confirmDeleteId === task.id;
                return (
                  <motion.div
                    key={task.id}
                    layout
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="flex items-center gap-4 px-4 py-4 rounded-[24px] cursor-pointer transition-all duration-300 glass-panel"
                    style={{
                      background: task.done ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.5)",
                      border: task.done ? "1px solid rgba(255, 255, 255, 0.3)" : "1.5px solid rgba(255, 255, 255, 0.6)",
                      opacity: task.done ? 0.65 : 1,
                    }}
                    onClick={() => toggleTask(task.id)}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300"
                      style={
                        task.done
                          ? {
                            background: "linear-gradient(135deg,#4facfe,#00f2fe)",
                            boxShadow: "0 0 12px rgba(79,172,254,0.5)",
                          }
                          : {
                            background: "rgba(255,255,255,0.4)",
                            border: "1.5px solid rgba(0,0,0,0.05)",
                          }
                      }
                    >
                      {task.done && (
                        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-gray-800"
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          textDecoration: task.done ? "line-through" : "none",
                          color: task.done ? "#9ba8b4" : "#2d3748",
                        }}
                      >
                        {task.title}
                      </p>
                      {task.note && (
                        <p className="text-gray-500 truncate mt-0.5" style={{ fontSize: 11, fontWeight: 600 }}>
                          {task.note}
                        </p>
                      )}
                      <div className="flex items-center gap-2.5 mt-2">
                        <span
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md"
                          style={{ background: `${meta.color}20`, color: meta.color, fontSize: 10, fontWeight: 800, border: `1px solid ${meta.color}30` }}
                        >
                          {meta.emoji} {task.category}
                        </span>
                        {task.time !== "--:--" && (
                          <span className="flex items-center gap-1 text-gray-400 font-bold" style={{ fontSize: 10 }}>
                            <Clock size={11} /> {task.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={(e) => handleDeleteClick(task.id, e)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 glass-panel"
                      style={
                        isConfirming
                          ? {
                            background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                            border: "none",
                          }
                          : {
                            background: "rgba(0,0,0,0.03)",
                            border: "1px solid rgba(0,0,0,0.05)",
                          }
                      }
                    >
                      <Trash2
                        size={16}
                        style={{ color: isConfirming ? "#fff" : "#a0aec0" }}
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
        <div className="flex flex-col gap-4 pb-20">
          {/* Top Control Bar: Search & Mic */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜尋事件或紀錄..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-panel outline-none text-sm font-semibold text-gray-700 transition-all focus:ring-2 focus:ring-blue-400/20"
                style={{ background: "rgba(255,255,255,0.4)" }}
              />
            </div>
          </div>

          {/* Quick Category Filters (Chips) */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                className={`flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-300 ${selectedCategory === cat.id
                  ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-400/30"
                  : "bg-white/40 text-gray-500 border-white/50 backdrop-blur-md"
                  }`}
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                {cat.icon} {cat.label}
              </motion.button>
            ))}
          </div>

          {/* Date Selector Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-blue-500" />
              <span style={{ fontSize: 13, fontWeight: 800 }}>歷史日期</span>
            </div>
            <div className="flex gap-2">
              {["2025-05-18", "2025-05-19", "2025-05-20"].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${selectedDate === d ? "bg-white text-blue-600 border-blue-200" : "bg-white/20 text-gray-400 border-transparent"
                    }`}
                >
                  {d.split('-')[2]}
                </button>
              ))}
            </div>
          </div>

          {/* AI Daily Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl glass-panel relative overflow-hidden shimmer-container"
            style={{
              background: "linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))",
              border: "1.5px solid rgba(79, 172, 254, 0.2)"
            }}
          >
            <div className="shimmer-effect" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Info size={16} />
              </div>
              <span className="text-blue-600" style={{ fontSize: 13, fontWeight: 800 }}>AI 今日生活觀察總結</span>
            </div>
            <p className="text-gray-600 leading-relaxed relative z-10" style={{ fontSize: 12, fontWeight: 600 }}>
              今日整體狀況穩定。上午完成散步活動，步態指標正常；血壓量測紀錄與服藥行為皆準時完成。中午有陌生訪客（推測為外送員），目前防護狀態良好。
            </p>
          </motion.div>

          {/* Log List */}
          <div className="flex flex-col gap-3">
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
                    className="rounded-2xl overflow-hidden glass-panel cursor-pointer transition-all duration-300"
                    style={{
                      background: isExpanded ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.45)",
                      border: isExpanded ? "1.5px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: isExpanded ? "0 20px 40px -15px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: entry.color, boxShadow: `0 0 10px ${entry.color}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 800, color: entry.color }}>
                            {entry.type}
                          </span>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={10} />
                            <span style={{ fontSize: 10, fontWeight: 600 }}>{entry.time}</span>
                          </div>
                        </div>
                        <p className={`text-gray-600 transition-all ${isExpanded ? 'font-bold' : 'font-medium'}`} style={{ fontSize: 13 }}>
                          {entry.message}
                        </p>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 border-t border-gray-100/50 pt-3"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/30">
                              <MessageSquare size={14} className="text-blue-500 mt-0.5" />
                              <p className="text-gray-600 leading-relaxed" style={{ fontSize: 12, fontWeight: 600 }}>
                                {entry.description}
                              </p>
                            </div>

                            {/* Mock AI Capture Snapshot */}
                            {(entry.category === 'person' || entry.category === 'alert') && (
                              <div className="relative rounded-xl overflow-hidden aspect-video group">
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                <img
                                  src={`https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80`}
                                  alt="Capture"
                                  className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-red-500/80 text-white text-[8px] font-bold backdrop-blur-sm">
                                  LIVE CAPTURE
                                </div>
                                <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded bg-black/40 text-white text-[8px] font-mono backdrop-blur-sm">
                                  CAM-01 · 14:32:05
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {confirmDeleteJournalId === entry.id ? (
                                <motion.button
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setJournalEntries(prev => prev.filter(item => item.id !== entry.id));
                                    setConfirmDeleteJournalId(null);
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[11px] font-bold shadow-lg shadow-red-500/30"
                                >
                                  確認刪除紀錄？
                                </motion.button>
                              ) : (
                                <>
                                  <button className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-[11px] font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                                    查看錄影回放
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteJournalId(entry.id);
                                    }}
                                    className="px-4 py-2 rounded-xl glass-panel text-red-400 text-[11px] font-bold active:scale-95 transition-transform"
                                    style={{ background: "rgba(245,81,108,0.1)" }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

            {/* Empty Search Result */}
            {journalEntries.filter((e: JournalEntry) => (selectedCategory === "all" || e.category === selectedCategory)).filter((e: JournalEntry) => e.message.includes(searchQuery) || e.type.includes(searchQuery)).length === 0 && (
              <div className="flex flex-col items-center py-10 gap-3">
                <SearchCheck size={32} className="text-gray-300" />
                <p className="text-gray-400 font-bold" style={{ fontSize: 13 }}>查無相關日誌紀錄</p>
              </div>
            )}

            <p className="text-center text-gray-400 py-6" style={{ fontSize: 11, fontWeight: 700 }}>
              — 今日記錄共 {journalEntries.length} 筆 · 已過濾 —
            </p>
          </div>

        </div>
      )}

      {/* Glassmorphism Bottom Sheet (Fixed positioning via Portal) */}
      {mounted && showForm && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: "rgba(20,30,48,0.45)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === overlayRef.current) setShowForm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl p-5"
            style={{
              background: "rgba(240,244,248,0.92)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 -8px 32px rgba(79,172,254,0.15), 0 -2px 10px rgba(0,0,0,0.1)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            {/* Form Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700" style={{ fontWeight: 700, fontSize: 16 }}>新增照護任務</p>
              <button
                onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#F0F4F8", boxShadow: "3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff" }}
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>

            {/* Task Name */}
            <div className="mb-3">
              <label className="text-gray-500 mb-1.5 block" style={{ fontSize: 11, fontWeight: 700 }}>
                任務名稱 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="輸入任務名稱..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-gray-700 placeholder-gray-300"
                style={{
                  background: "#F0F4F8",
                  boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                }}
              />
            </div>

            {/* Note */}
            <div className="mb-3">
              <label className="text-gray-500 mb-1.5 block" style={{ fontSize: 11, fontWeight: 700 }}>備註說明</label>
              <input
                type="text"
                placeholder="額外備注（選填）..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-gray-700 placeholder-gray-300"
                style={{
                  background: "#F0F4F8",
                  boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                }}
              />
            </div>

            {/* Time */}
            <div className="mb-3">
              <label className="text-gray-500 mb-1.5 block" style={{ fontSize: 11, fontWeight: 700 }}>時間設定</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-gray-700"
                style={{
                  background: "#F0F4F8",
                  boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                }}
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-gray-500 mb-2 block" style={{ fontSize: 11, fontWeight: 700 }}>類別選擇</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                  const m = CATEGORY_META[cat];
                  const selected = formCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className="flex flex-col items-center py-2 rounded-xl gap-1 transition-all duration-200"
                      style={
                        selected
                          ? {
                            background: m.bg,
                            boxShadow: `0 0 10px ${m.color}44, 2px 2px 4px ${m.color}22`,
                            border: `1.5px solid ${m.color}44`,
                          }
                          : {
                            background: "#F0F4F8",
                            boxShadow: "3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff",
                            border: "1.5px solid transparent",
                          }
                      }
                    >
                      <span style={{ fontSize: 16 }}>{m.emoji}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: selected ? m.color : "#9ba8b4" }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAddTask}
              disabled={!formTitle.trim()}
              className="w-full py-3.5 rounded-2xl text-white transition-all duration-300 shimmer-container relative"
              style={
                formTitle.trim()
                  ? {
                    background: "linear-gradient(135deg, rgba(79, 172, 254, 0.95), rgba(0, 242, 254, 0.95))",
                    boxShadow: "4px 4px 12px rgba(79,172,254,0.4), inset 0 0 0 1px rgba(255,255,255,0.2)",
                    fontSize: 15,
                    fontWeight: 800,
                  }
                  : {
                    background: "rgba(209, 217, 230, 0.5)",
                    boxShadow: "inset 2px 2px 4px #b8c1ce",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#9ba8b4",
                    cursor: "not-allowed",
                  }
              }
            >
              {formTitle.trim() && (
                <div className="shimmer-effect" />
              )}
              <span className="relative z-10">＋ 新增照護任務</span>
            </button>
          </div>
        </div>,
        document.body
      )
      }
    </div >
  );
}

