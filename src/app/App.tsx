import React, { useState, useEffect } from "react";
import { MonitorTab } from "./components/MonitorTab";
import { motion, AnimatePresence } from "motion/react";
import { HealthTab } from "./components/HealthTab";
import { CareTab, Task, INITIAL_TASKS, INITIAL_JOURNAL_ENTRIES, JournalEntry } from "./components/CareTab";
import { Mic, MicOff, Sparkles } from "lucide-react";

type Tab = "monitor" | "health" | "care";

const NAV_ITEMS: { id: Tab; label: string; emoji: string }[] = [
  { id: "monitor", label: "監控", emoji: "🔍" },
  { id: "health", label: "健康", emoji: "❤️" },
  { id: "care", label: "照護", emoji: "🤝" },
];

const orbStyles = `
  @keyframes orb-ripple {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes orb-breathe {
    0%, 100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 5px rgba(255,255,255,0.4)); }
    50% { transform: scale(1.1); filter: brightness(1.3) drop-shadow(0 0 15px rgba(255,255,255,0.8)); }
  }
  .ripple-layer {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    border: 2px solid rgba(6, 182, 212, 0.5);
    animation: orb-ripple 2s linear infinite;
    pointer-events: none;
  }
  .ripple-layer:nth-child(2) { animation-delay: 0.6s; border-color: rgba(59, 130, 246, 0.4); }
  .ripple-layer:nth-child(3) { animation-delay: 1.2s; border-color: rgba(167, 139, 250, 0.3); }
`;

export default function App() {
  return (
    <>
      <style>{orbStyles}</style>
      <AppContent />
    </>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("monitor");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);

  // --- Voice Assistant State & Logic ---
  const [voicePosition, setVoicePosition] = useState({ x: 300, y: 450 });
  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'zh-TW';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          alert("🎤 麥克風權限被拒絕。\n請在瀏覽器設定中允許此網站使用麥克風。");
        } else if (event.error === 'network') {
          alert("🌐 網路連線不穩定，無法使用語音辨識。");
        }
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice Result:", transcript);

        // --- 核心優化：將語音結果匯入日誌 ---
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newEntry: JournalEntry = {
          id: Date.now(),
          time: timeStr,
          type: "🎤 語音紀錄",
          category: "activity", // 預設為活動類別
          message: transcript,
          description: `此紀錄由語音助理於 ${timeStr} 自動辨識生成。`,
          color: "#06b6d4" // 青色
        };

        setJournalEntries(prev => [newEntry, ...prev]);
        setActiveTab("care"); // 自動跳轉到照護分頁查看結果
      };
      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("您的瀏覽器不支援語音辨識功能。");
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      alert("⚠️ 安全性限制\n\n行動端瀏覽器（Chrome/Safari）規定必須在 HTTPS 安全連線下才能使用麥克風。\n\n目前您使用的是非安全連線 (HTTP)，請嘗試使用主機名稱或設定 HTTPS。");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Start recognition failed:", e);
      }
    }
  };

  // 閒置收縮邏輯
  useEffect(() => {
    let timer: any;
    if (!isVoiceCollapsed && !isListening) {
      timer = setTimeout(() => setIsVoiceCollapsed(true), 5000);
    }
    return () => clearTimeout(timer);
  }, [isVoiceCollapsed, isListening]);

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = NAV_ITEMS.findIndex(item => item.id === activeTab);

    if (isLeftSwipe && currentIndex < NAV_ITEMS.length - 1) {
      setActiveTab(NAV_ITEMS[currentIndex + 1].id);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(NAV_ITEMS[currentIndex - 1].id);
    }
  };

  useEffect(() => {
    // 全域 Haptic Feedback
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.haptic-btn') || target.closest('button')) {
        if (navigator.vibrate) {
          // 短暫的 15ms 震動提供真實按壓感
          navigator.vibrate(15);
        }
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-0 sm:p-4"
      style={{ background: isMobile ? "#f0f4f8" : "linear-gradient(135deg,#e8edf2 0%,#dde4ed 100%)" }}
    >
      {/* Phone Frame - Full screen on mobile */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: isMobile ? "100%" : 375,
          height: isMobile ? "100vh" : 812,
          borderRadius: isMobile ? 0 : 40,
          background: "rgba(240, 244, 248, 0.7)",
          backdropFilter: isMobile ? "none" : "blur(20px)",
          boxShadow: isMobile
            ? "none"
            : "20px 20px 60px #b8c4d4, -20px -20px 60px #ffffff, 0 0 0 1px rgba(255,255,255,0.8)",
          border: isMobile ? "none" : "1px solid rgba(255,255,255,0.4)"
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
            20% { opacity: 0; }
            50% { opacity: 1; }
            80% { opacity: 0; }
            100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
          }
          .glass-panel {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
          }
          .shimmer-container {
            position: relative;
            overflow: hidden;
          }
          .shimmer-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.5) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            pointer-events: none;
            z-index: 5;
            animation: shimmer 4s ease-in-out infinite;
          }
        `}</style>
        {/* Tab Content with Conditional Rendering for Performance */}
        <div
          className="flex-1 relative" // 移除 overflow-hidden 避免 Modal 被切掉
          style={{
            zIndex: 100, // 極高層級確保覆蓋一切
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)"
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {activeTab === "monitor" && (
                <MonitorTab
                  isActive={true}
                  isMobile={isMobile}
                  tasks={tasks}
                  onUpdateTasks={setTasks}
                  onTabChange={setActiveTab}
                />
              )}
              {activeTab === "health" && (
                <HealthTab
                  isActive={true}
                  isMobile={isMobile}
                />
              )}
              {activeTab === "care" && (
                <CareTab
                  isActive={true}
                  isMobile={isMobile}
                  tasks={tasks}
                  setTasks={setTasks}
                  journalEntries={journalEntries}
                  setJournalEntries={setJournalEntries}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div
          className="flex-shrink-0 px-4 pb-5 pt-3 relative"
          style={{ background: "#F0F4F8", zIndex: 1 }} // 降低層級
        >
          <div
            style={{
              height: 1,
              marginBottom: 10,
              background: "linear-gradient(90deg,transparent,#d1d9e688,transparent)",
            }}
          />
          <div
            className="flex rounded-2xl p-1"
            style={{
              background: "#F0F4F8",
              boxShadow: "inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex-1 flex flex-col items-center py-2.5 rounded-xl gap-1 relative transition-all duration-300 active:scale-95"
                  style={{
                    background: "transparent",
                    WebkitTapHighlightColor: "transparent"
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-xl z-0"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        mass: 0.8 // 輕微減輕質量增加 Q 彈感
                      }}
                      style={{
                        background: "linear-gradient(135deg,#4facfe,#00c6fb)",
                        boxShadow: "4px 4px 10px rgba(79,172,254,0.45), -2px -2px 8px rgba(255,255,255,0.7)",
                      }}
                    />
                  )}
                  <motion.span
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    className="z-10"
                    style={{
                      fontSize: 18,
                      filter: isActive ? "none" : "grayscale(0.5) opacity(0.6)",
                      transition: "filter 0.3s",
                    }}
                  >
                    {item.emoji}
                  </motion.span>
                  <span
                    className="z-10"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isActive ? "#ffffff" : "#9ba8b4",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center mt-3">
            <div
              className="rounded-full"
              style={{ width: 120, height: 4, background: "#c8d0dc" }}
            />
          </div>
        </div>

        {/* Global Floating Voice Assistant Orb */}
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => setIsVoiceCollapsed(false)}
          onDragEnd={(e, info) => {
            // 螢幕寬度約 390px (Phone Frame)
            const newX = info.point.x > 195 ? 320 : 10;
            setVoicePosition({ x: newX, y: voicePosition.y + info.offset.y });
          }}
          animate={{
            x: isVoiceCollapsed ? (voicePosition.x > 100 ? voicePosition.x + 40 : voicePosition.x - 40) : voicePosition.x,
            y: voicePosition.y,
            scale: isVoiceCollapsed ? 0.65 : (isListening ? 1.15 : 1),
            opacity: isVoiceCollapsed ? 0.5 : 1,
            rotate: isVoiceCollapsed ? (voicePosition.x > 100 ? 15 : -15) : 0
          }}
          whileHover={{ scale: isVoiceCollapsed ? 0.8 : 1.05, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed z-[9999] cursor-pointer"
          style={{ width: 62, height: 62, touchAction: "none" }}
        >
          <div
            onClick={() => {
              if (isVoiceCollapsed) {
                setIsVoiceCollapsed(false);
              } else {
                toggleListening();
              }
            }}
            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.4))",
              backdropFilter: "blur(25px)",
              border: "1.2px solid rgba(255, 255, 255, 0.45)",
              boxShadow: isListening
                ? "0 0 35px rgba(6, 182, 212, 0.6), inset 0 0 15px rgba(255,255,255,0.4)"
                : "0 15px 35px rgba(0,0,0,0.2), inset 0 0 12px rgba(255,255,255,0.3)",
            }}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <div
                  key="mic-on"
                  style={{ animation: "orb-breathe 1.5s ease-in-out infinite" }}
                >
                  <Sparkles size={30} className="text-white" />
                </div>
              ) : (
                <motion.div key="mic-off" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <Mic size={28} className="text-white drop-shadow-md" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing CSS ripples when listening */}
            {isListening && (
              <>
                <div className="ripple-layer" />
                <div className="ripple-layer" />
                <div className="ripple-layer" />
              </>
            )}
          </div>

          {/* Collapse indicator label (貼邊時顯示一小條) */}
          {isVoiceCollapsed && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-10 bg-white/50 rounded-full blur-[1px]"
              style={{ left: voicePosition.x > 100 ? "auto" : -8, right: voicePosition.x > 100 ? -8 : "auto" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
