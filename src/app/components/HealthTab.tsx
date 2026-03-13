import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

interface VitalCardProps {
  type?: "hr" | "bp" | "spo2" | "temp";
  icon: string;
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
  gradFrom: string;
  gradTo: string;
  bgGlow: string;
  noShadow?: boolean;
}

function NumberTicker({ value }: { value: string }) {
  return (
    <div style={{ display: "inline-flex", overflow: "hidden" }}>
      <span key={value} style={{ display: "inline-block", animation: "numberRoll 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {value}
      </span>
    </div>
  );
}

const Spo2Icon = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg className="absolute w-[140%] h-[140%] pointer-events-none" viewBox="0 0 36 36" style={{ left: '-20%', top: '-20%' }}>
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="16" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="30 100" strokeLinecap="round" style={{ transformOrigin: "18px 18px", animation: "ringSpin 2s linear infinite" }} />
    </svg>
    <svg width="18" height="18" viewBox="0 0 24 24" className="z-10 relative">
      <defs>
        <clipPath id="dropClip">
          <path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3.3 6-12.5 6-12.5s6 9.2 6 12.5c0 3.3-2.7 6-6 6z" />
        </clipPath>
      </defs>
      <path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3.3 6-12.5 6-12.5s6 9.2 6 12.5c0 3.3-2.7 6-6 6z" fill="rgba(255,255,255,0.3)" />
      <g clipPath="url(#dropClip)">
        {/* Double wave to ensure seamless loop */}
        <path d="M -24 15 Q -18 10 -12 15 T 0 15 T 12 15 T 24 15 T 36 15 T 48 15 L 48 24 L -24 24 Z" fill="#ffffff" style={{ animation: "waveFlow 3s linear infinite" }} />
      </g>
    </svg>
  </div>
);

const TempIcon = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute w-[3px] h-[3px] bg-white rounded-full left-[25%] top-1/2" style={{ animation: "heatParticles 2s ease-out infinite" }} />
      <div className="absolute w-[3px] h-[3px] bg-white rounded-full right-[25%] top-1/3" style={{ animation: "heatParticles 2.5s ease-out infinite 1s" }} />
      <div className="absolute w-[3px] h-[3px] bg-white rounded-full left-[50%] top-1/2" style={{ animation: "heatParticles 1.8s ease-out infinite 0.5s" }} />
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" className="z-10 relative ml-0.5">
      <path d="M14 14.7V5c0-1.1-.9-2-2-2s-2 .9-2 2v9.7c-1.8 1.1-2.9 3.2-2.6 5.4.3 2.1 2 3.8 4.1 4.1 3.5.4 6.5-2.2 6.5-5.5 0-2.1-1.2-4-3-5z" fill="rgba(255,255,255,0.4)" />
      <circle cx="12" cy="18" r="3" fill="#ffffff" />
      <rect x="10.5" y="10" width="3" height="8" fill="#ffffff" style={{ transformOrigin: "bottom", animation: "thermoRise 1.5s ease-out infinite alternate" }} />
    </svg>
  </div>
);

function VitalCard({
  icon, label, value, unit, status, statusColor, gradFrom, gradTo, bgGlow, noShadow, type
}: VitalCardProps) {
  const isWarning = status !== "正常" && status !== "優良";
  const isBP = type === "bp";
  const isSpo2 = type === "spo2";
  const isTemp = type === "temp";

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="rounded-2xl p-4 flex flex-col gap-2 overflow-hidden relative glass-panel cursor-pointer"
      style={{
        background: isBP && isWarning ? "rgba(255, 241, 242, 0.6)" : "rgba(255, 255, 255, 0.45)",
        border: isBP && isWarning ? "1px solid rgba(244, 63, 94, 0.5)" : "1px solid rgba(255, 255, 255, 0.5)",
        animation: isBP && isWarning ? "breatheGlow 2s infinite alternate" : "none"
      }}
    >
      <div className="flex items-center justify-between z-10 relative">
        <div className="relative">
          {/* BP Ripple Effect */}
          {isBP && (
            <div
              className="absolute w-10 h-10 -left-0.5 -top-0.5 rounded-xl pointer-events-none z-0"
              style={{
                border: `2px solid ${statusColor}`,
                animation: "ripplePing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
          )}

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg relative z-10"
            style={{
              background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
              boxShadow: `0 4px 12px ${bgGlow}`,
              animation:
                type === "hr" ? "heartbeat 2s infinite" :
                  type === "bp" ? "pulseDrop 2.5s ease-in-out infinite" :
                    type === "spo2" ? "floatDrop 3.5s ease-in-out infinite" :
                      type === "temp" ? "thermometerPulse 2.8s ease-in-out infinite" : "none"
            }}
          >
            {isSpo2 ? <Spo2Icon /> : isTemp ? <TempIcon /> : icon}
          </div>
        </div>
        <span
          className="text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{
            background: `${statusColor}25`,
            color: statusColor,
            fontWeight: 800,
            animation: isSpo2 ? "textBreathe 3s ease-in-out infinite" : "none",
            border: `1px solid ${statusColor}40`
          }}
        >
          {status}
        </span>
      </div>
      <div className="z-10 relative">
        <p className="text-gray-500" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-gray-800 font-extrabold" style={{ fontSize: 24 }}>
            <span style={{ animation: (isTemp && isWarning) ? "shake 0.5s infinite" : "none", display: "inline-block" }}>
              <NumberTicker value={value} />
            </span>
          </span>
          <span className="text-gray-400 font-bold" style={{ fontSize: 12 }}>{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}

// --- ECG Monitor Component ---
function ECGMonitor({ isActive, currentBPM, isMobile = false }: { isActive: boolean, currentBPM: number, isMobile?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bpmRef = useRef(currentBPM);
  const dataRef = useRef<{ x: number; y: number }[]>([]);
  const cursorRef = useRef(0); // Current scan position
  const frameIdRef = useRef<number>(0);
  const segmentIdxRef = useRef(0);
  const framesCounterRef = useRef(0);

  useEffect(() => {
    bpmRef.current = currentBPM;
  }, [currentBPM]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // ECG Segment definitions
    const segment = [
      0, 0, 0, 0, 0, 0, 0, 0,
      1, 3, 5, 3, 1, 0, 0,
      0, 0,
      -2, -5, 15, 45, 10, -10, -15, -5, 0,
      0, 0,
      1, 4, 8, 10, 8, 4, 1, 0,
      0, 0, 0, 0, 0
    ];

    if (dataRef.current.length === 0) {
      dataRef.current = new Array(width).fill(0).map((_, i) => ({ x: i, y: centerY }));
    }

    const render = () => {
      if (!isActive) {
        frameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Optimization: On mobile, we can skip every other frame for drawing if needed,
      // but MJPEG usually consumes more. Let's focus on simplifying the canvas ops.

      const currentBpm = bpmRef.current;
      const totalCycleFrames = Math.floor(3600 / currentBpm);
      const waitFrames = Math.max(5, totalCycleFrames - segment.length);

      let nextVal = 0;
      if (segmentIdxRef.current < segment.length) {
        nextVal = segment[segmentIdxRef.current];
        segmentIdxRef.current++;
      } else {
        framesCounterRef.current++;
        if (framesCounterRef.current >= waitFrames) {
          segmentIdxRef.current = 0;
          framesCounterRef.current = 0;
        }
      }

      const x = cursorRef.current;
      dataRef.current[x] = { x, y: centerY - (nextVal * 1.5) };
      cursorRef.current = (cursorRef.current + (isMobile ? 2 : 1)) % width; // Speed up scan on mobile

      ctx.clearRect(0, 0, width, height);

      // Only draw grid on desktop to save fillRect calls
      if (!isMobile) {
        ctx.strokeStyle = "rgba(79, 172, 254, 0.08)";
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
        for (let j = 0; j < height; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke(); }
      }

      ctx.lineWidth = isMobile ? 1.5 : 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#4facfe";

      const gap = 20;

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < width; i++) {
        const distToCursor = (i - cursorRef.current + width) % width;
        if (distToCursor > gap) {
          const pt = dataRef.current[i];
          if (!started) {
            ctx.moveTo(pt.x, pt.y);
            started = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else if (started) {
          ctx.stroke();
          ctx.beginPath();
          started = false;
        }
      }
      ctx.stroke();

      // Simplified dot for mobile
      const headPt = dataRef.current[cursorRef.current];
      ctx.beginPath();
      ctx.arc(headPt.x, headPt.y, isMobile ? 2 : 3, 0, Math.PI * 2);
      ctx.fillStyle = "#00f2fe";
      if (!isMobile) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00f2fe";
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [isActive, isMobile]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl bg-black/10">
      <canvas
        ref={canvasRef}
        width={350}
        height={130}
        className="w-full h-full"
      />
    </div>
  );
}

// --- Smart Analysis Modal Component ---
function SmartAnalysisModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'30days' | '1year'>('30days');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-11

  if (!isOpen) return null;

  const handlePrev = () => {
    if (activeTab === '30days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else {
      setViewYear(y => y - 1);
    }
  };

  const handleNext = () => {
    if (activeTab === '30days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else {
      setViewYear(y => y + 1);
    }
  };

  // 模擬數據
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthlyLogs = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    avgHr: Math.floor(65 + Math.random() * 20),
    riskCount: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
    sys: Math.floor(110 + Math.random() * 20)
  }));

  const yearlySummary = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    avgRisk: Math.floor(10 + Math.random() * 30),
    maxHr: Math.floor(85 + Math.random() * 20)
  }));

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300"
      style={{ background: "rgba(20,30,48,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[32px] py-6 relative flex flex-col gap-4 glass-panel"
        style={{
          maxHeight: "85vh",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          background: "rgba(240, 244, 248, 0.8)",
          backdropFilter: "blur(24px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6">
          <div>
            <h3 className="text-xl font-bold text-[#3a4a5c] flex items-center gap-2">
              <span className="text-2xl">💡</span> 智慧分析中心
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">長期健康趨勢追蹤</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#F0F4F8] text-gray-400 transition-all active:scale-90"
            style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="px-6 relative">
          <div
            className="flex w-full bg-[#e2e8f0] p-1 rounded-[20px] mb-2"
            style={{ boxShadow: "inset 4px 4px 8px #cbd5e1, inset -4px -4px 8px #f1f5f9" }}
          >  <button
            onClick={() => setActiveTab('30days')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={activeTab === '30days' ? { background: "linear-gradient(135deg,#4facfe,#00f2fe)", color: "white", boxShadow: "2px 2px 6px rgba(79,172,254,0.4)" } : { color: "#9ba8b4" }}
          >詳細日誌 (30天)</button>
            <button
              onClick={() => setActiveTab('1year')}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={activeTab === '1year' ? { background: "linear-gradient(135deg,#a78bfa,#c4b5fd)", color: "white", boxShadow: "2px 2px 6px rgba(167,139,250,0.4)" } : { color: "#9ba8b4" }}
            >統計摘要 (1年)</button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center px-6 py-1">
          <button onClick={handlePrev} className="text-gray-400 hover:text-blue-500 font-bold p-1">◀</button>
          <span className="text-gray-700 font-bold text-sm tracking-wide">
            {activeTab === '30days' ? `${viewYear}年 ${viewMonth + 1}月` : `${viewYear}年度`}
          </span>
          <button onClick={handleNext} className="text-gray-400 hover:text-blue-500 font-bold p-1">▶</button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 px-6 pb-2 hide-scrollbar">
          {activeTab === '30days' ? (
            <div className="flex flex-col gap-4">
              {/* Avg HR Chart */}
              <div className="p-4 rounded-2xl" style={{ background: "#F0F4F8", boxShadow: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff" }}>
                <p className="text-xs font-bold text-gray-500 mb-3">平均心率波動 (bpm)</p>
                <div className="flex items-end gap-[1px] h-24 mt-2">
                  {monthlyLogs.map((log, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${Math.max(5, (log.avgHr - 50) * 1.5)}%`,
                          background: log.avgHr > 80 ? "linear-gradient(to top, #fca5a5, #f87171)" : "linear-gradient(to top, #89f7fe, #66a6ff)",
                          opacity: 0.9
                        }}
                      />
                      {/* Tooltip on hover */}
                      <span className="absolute -top-7 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                        {log.day}日: {log.avgHr}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-2">
                  <span>1日</span>
                  <span>15日</span>
                  <span>{daysInMonth}日</span>
                </div>
              </div>

              {/* Risk count Bubbles */}
              <div className="p-4 rounded-2xl" style={{ background: "#F0F4F8", boxShadow: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff" }}>
                <p className="text-xs font-bold text-gray-500 mb-3">每日極端風險次數</p>
                <div className="flex flex-wrap gap-1.5">
                  {monthlyLogs.map((log, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-bold cursor-pointer"
                      style={{
                        background: log.riskCount === 0 ? "transparent" : log.riskCount > 2 ? "#fee2e2" : "#fffbeb",
                        color: log.riskCount === 0 ? "#cbd5e1" : log.riskCount > 2 ? "#ef4444" : "#f59e0b",
                        boxShadow: log.riskCount > 0 ? "inset 1px 1px 2px rgba(255,255,255,0.5), 1px 1px 3px rgba(0,0,0,0.05)" : "none",
                        border: log.riskCount === 0 ? "1px dashed #cbd5e1" : "none"
                      }}
                      title={`${log.day}日: ${log.riskCount}次`}
                    >
                      {log.riskCount > 0 ? log.riskCount : "-"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Yearly Avg Risk Trend */}
              <div className="p-4 rounded-2xl relative" style={{ background: "#F0F4F8", boxShadow: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff" }}>
                <p className="text-xs font-bold text-gray-500 mb-4 z-10 relative">極端風險平均指標</p>
                <svg viewBox="0 0 120 40" className="w-full h-24 overflow-visible">
                  <path
                    d={`M 0,40 ${yearlySummary.map((s, i) => `L ${i * 10 + 5},${40 - s.avgRisk * 0.8}`).join(' ')}`}
                    fill="none"
                    stroke="url(#riskGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* points */}
                  {yearlySummary.map((s, i) => (
                    <circle key={i} cx={i * 10 + 5} cy={40 - s.avgRisk * 0.8} r="1.5" fill="#ef4444" />
                  ))}
                </svg>
                <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-1">
                  <span>1月</span><span>6月</span><span>12月</span>
                </div>
              </div>

              {/* Generic Stats List */}
              <div className="flex flex-col gap-2">
                {[
                  { label: "平均靜息心率", val: "72", unit: "bpm", color: "#4facfe" },
                  { label: "血氧濃度穩定度", val: "98.2", unit: "%", color: "#a78bfa" },
                  { label: "年度最高風險月", val: "8", unit: "月", color: "#f5516c" },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl flex justify-between items-center" style={{ background: "#F0F4F8", boxShadow: "inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff" }}>
                    <span className="text-xs font-bold text-gray-500">{stat.label}</span>
                    <span>
                      <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.val}</span>
                      <span className="text-[10px] text-gray-400 font-bold ml-1">{stat.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Diagnostic Modal Component ---
function DiagnosticModal({ isOpen, onClose, vitals, score, status }: {
  isOpen: boolean;
  onClose: () => void;
  vitals: any;
  score: number;
  status: string;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm rounded-[40px] p-8 glass-panel relative flex flex-col gap-6"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-400/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex justify-between items-start z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI 健康診斷報告</h3>
            <p className="text-slate-500 font-bold text-sm mt-1">智慧分析與個人化建議</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400 transition-all active:scale-90"
          >✕</button>
        </div>

        {/* Score Hero */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-[32px] p-6 text-white shadow-lg shadow-blue-200/50 z-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
            <Sparkles size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 font-bold text-xs uppercase tracking-widest">當前健康分</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black">{score}</span>
              <span className="text-xl font-bold opacity-80">/100</span>
            </div>
            <div className="mt-4 inline-flex px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/30 text-xs font-black">
              今日狀態：{status}
            </div>
          </div>
        </div>

        {/* Detailed Metrics Analysis */}
        <div className="flex flex-col gap-4 z-10">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-1">即時指標分析</p>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "心血管循環", desc: "心率穩定，血壓處於理想範圍。", icon: "❤️", color: "text-blue-500" },
              { label: "呼吸系統", desc: "血氧飽和度極佳，呼吸頻率規律。", icon: "🫁", color: "text-cyan-500" },
              { label: "體溫代謝", desc: "體溫恆定，無發炎或發燒跡象。", icon: "🌡️", color: "text-orange-500" }
            ].map((item, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={item.label}
                className="flex items-start gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50"
              >
                <div className="text-2xl mt-0.5">{item.icon}</div>
                <div>
                  <h4 className="font-black text-slate-700 text-sm">{item.label}</h4>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="flex flex-col gap-4 z-10">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-1">AI 專屬建議</p>
          <div className="p-5 rounded-[32px] bg-blue-50/50 border border-blue-100/50">
            <ul className="flex flex-col gap-3">
              {[
                "繼續保持目前的規律作息。",
                "建議下午進行 15 分鐘拉伸運動。",
                "夜間注意室溫變化，早點休息。"
              ].map((rec, i) => (
                <li key={i} className="flex gap-3 text-xs font-bold text-slate-600">
                  <span className="text-blue-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-3xl bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all z-10 mt-2"
        >
          了解，收下報告
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

export function HealthTab({ isActive = true, isMobile = false }: { isActive?: boolean; isMobile?: boolean }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [vitals, setVitals] = useState({
    hr: 73,
    bp: { sys: 118, dia: 76 },
    spo2: 98.4,
    temp: 36.7
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock score based on date
  const getHealthScore = (date: Date) => {
    const day = date.getDate();
    const scores = [91, 88, 94, 85, 92, 89, 93];
    return scores[day % scores.length];
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return "優良";
    if (score >= 80) return "良好";
    return "正常";
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const currentScore = getHealthScore(selectedDate);
  const currentStatus = getHealthStatus(currentScore);
  const statusColor = "#4facfe"; // Default color, not used in DiagnosticModal but needed for ECGMonitor prop

  // Mock vitals based on date
  const getVitalsByDate = (date: Date) => {
    const day = date.getDate();
    const seed = day % 5;
    return {
      hr: 70 + seed * 2 + (day % 3),
      bp: { sys: 110 + seed * 3, dia: 70 + seed * 2 },
      spo2: 97 + (day % 3) * 0.5,
      temp: 36.5 + (day % 5) * 0.1
    };
  };

  useEffect(() => {
    if (!isToday) {
      setVitals(getVitalsByDate(selectedDate));
      return;
    }

    if (!isActive) {
      return; // Do not start interval if tab is not active
    }

    // If today and active, start live simulation
    const vitalsInterval = setInterval(() => {
      setVitals((prev: any) => ({
        hr: prev.hr + (Math.floor(Math.random() * 3) - 1),
        bp: {
          sys: prev.bp.sys + (Math.floor(Math.random() * 3) - 1),
          dia: prev.bp.dia + (Math.floor(Math.random() * 2) - 1)
        },
        spo2: Math.min(100, prev.spo2 + (Math.random() * 0.2 - 0.1)),
        temp: Math.min(37.5, Math.max(36.4, prev.temp + (Math.random() * 0.1 - 0.05)))
      }));
    }, 4000);

    return () => clearInterval(vitalsInterval);
  }, [isToday, selectedDate, isActive]);

  return (
    <div
      className="flex flex-col gap-5 p-4 pb-32 overflow-y-auto h-full"
      style={{
        background: "transparent",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)"
      }}
    >
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.15); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
        }
        @keyframes ecgScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes modalFadeIn {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseDrop {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-2px); }
        }
        @keyframes floatDrop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes thermometerPulse {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.05); }
          50% { transform: rotate(0deg) scale(1); }
          75% { transform: rotate(-5deg) scale(1.05); }
        }
        @keyframes ripplePing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes breatheGlow {
          0%, 100% { background-color: #F0F4F8; }
          50% { background-color: #fff1f2; }
        }
        @keyframes numberRoll {
          from { transform: translateY(6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes waveFlow {
          from { transform: translateX(0); }
          to { transform: translateX(-24px); }
        }
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes textBreathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes thermoRise {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
        @keyframes heatParticles {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-12px) scale(0); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); color: #ef4444; }
          75% { transform: translateX(2px); color: #ef4444; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Header with Glassmorphism */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">健康數據</h2>
          <p className="text-gray-500 font-bold text-xs mt-0.5 opacity-70">
            {isToday ? "今日生理指標追蹤" : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 歷史數據`}
          </p>
        </div>
        <button
          onClick={() => setIsAnalysisOpen(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/60 active:scale-90 shadow-lg shadow-blue-500/10 border border-white"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-inner">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Smart Analysis Modal */}
      {mounted && <SmartAnalysisModal isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} />}

      {/* Diagnostic Modal */}
      {mounted && (
        <DiagnosticModal
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          vitals={vitals}
          score={currentScore}
          status={currentStatus}
        />
      )}

      {/* ECG Monitor Card */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="rounded-3xl p-6 glass-panel cursor-pointer border border-white"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(15px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-700" style={{ fontWeight: 800, fontSize: 15 }}>實時心電圖 (ECG)</p>
            <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 600 }}>即時波形監控</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-blue-500 font-extrabold text-2xl tracking-tighter" style={{ animation: "heartbeat 2s infinite" }}>{vitals.hr}</span>
              <span className="text-gray-400 font-bold text-xs">bpm</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden bg-black/5" style={{ height: 130 }}>
          <ECGMonitor isActive={isActive} currentBPM={vitals.hr} isMobile={isMobile} />
        </div>
      </motion.div>

      {/* Vital Signs 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="relative overflow-hidden rounded-2xl glass-panel border border-white"
          style={{
            background: "rgba(255, 255, 255, 0.45)",
            transition: "all 0.3s",
            boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
          }}
        >
          <VitalCard
            type="hr"
            icon="❤️"
            label="心率 HEART RATE"
            value={vitals.hr.toString()}
            unit="bpm"
            status="正常"
            statusColor="#4facfe"
            gradFrom="#4facfe"
            gradTo="#00c6fb"
            bgGlow="rgba(79,172,254,0.4)"
            noShadow={true} // Avoid double shadow
          />
          {/* ECG Line Decorative Overlay */}
          <div className="absolute right-[-10px] bottom-[-5px] w-24 h-12 pointer-events-none overflow-hidden opacity-30">
            <svg viewBox="0 0 200 100" className="w-[400px] h-full" style={{ animation: "ecgScroll 2s linear infinite" }}>
              <path
                d="M0 50 L20 50 L25 30 L35 70 L40 50 L60 50 L65 10 L75 90 L80 50 L100 50 M100 50 L120 50 L125 30 L135 70 L140 50 L160 50 L165 10 L175 90 L180 50 L200 50"
                fill="none"
                stroke="#4facfe"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Dynamic Cards */}
        {(() => {
          const isBpHigh = vitals.bp.sys >= 125;
          const isTempHigh = vitals.temp >= 37.0;
          return (
            <>
              <div className="rounded-2xl glass-panel border border-white" style={{ background: "rgba(255, 255, 255, 0.45)", boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}>
                <VitalCard
                  type="bp"
                  icon="🩸"
                  label="血壓 BLOOD PRESSURE"
                  value={`${vitals.bp.sys}/${vitals.bp.dia}`}
                  unit="mmHg"
                  status={isBpHigh ? "偏高" : "優良"}
                  statusColor={isBpHigh ? "#f97316" : "#00c48c"}
                  gradFrom={isBpHigh ? "#f97316" : "#00c48c"}
                  gradTo={isBpHigh ? "#fb923c" : "#00e5b0"}
                  bgGlow={isBpHigh ? "rgba(249,115,22,0.4)" : "rgba(0,196,140,0.4)"}
                />
              </div>
              <div className="rounded-2xl glass-panel border border-white" style={{ background: "rgba(255, 255, 255, 0.45)", boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}>
                <VitalCard
                  type="spo2"
                  icon="💧"
                  label="血氧 SpO₂"
                  value={vitals.spo2.toFixed(1)}
                  unit="%"
                  status="優良"
                  statusColor="#a78bfa"
                  gradFrom="#a78bfa"
                  gradTo="#c4b5fd"
                  bgGlow="rgba(167,139,250,0.4)"
                />
              </div>
              <div className="rounded-2xl glass-panel border border-white" style={{ background: "rgba(255, 255, 255, 0.45)", boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}>
                <VitalCard
                  type="temp"
                  icon="🌡️"
                  label="體溫 TEMPERATURE"
                  value={vitals.temp.toFixed(1)}
                  unit="°C"
                  status={isTempHigh ? "微燒" : "正常"}
                  statusColor={isTempHigh ? "#ef4444" : "#f9a825"}
                  gradFrom={isTempHigh ? "#ef4444" : "#f9a825"}
                  gradTo={isTempHigh ? "#fca5a5" : "#ffcc02"}
                  bgGlow={isTempHigh ? "rgba(239,68,68,0.4)" : "rgba(249,168,37,0.4)"}
                />
              </div>
            </>
          );
        })()}
      </div>

      {/* Health Score */}
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => setIsDiagnosticOpen(true)}
        className="rounded-[32px] p-5 glass-panel cursor-pointer shimmer-container relative"
        style={{
          background: "linear-gradient(135deg, rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8))",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 12px 30px -10px rgba(79, 172, 254, 0.4)",
        }}
      >
        <div className="shimmer-effect" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/80" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>{isToday ? "今日" : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`} 健康總評</p>
            <p className="text-white" style={{ fontWeight: 800, fontSize: 24, marginTop: 4 }}>
              {currentStatus} · {currentScore}<span style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>/100</span>
            </p>
            <p className="text-white/80" style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>
              {currentScore >= 90 ? "各項指標均在正常範圍內" : "部分指標略有波動，建議適度休息"}
            </p>
          </div>
          <div
            className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-xl"
            style={{ fontSize: 32 }}
          >
            🏆
          </div>
        </div>
      </motion.div>
    </div>
  );
}
