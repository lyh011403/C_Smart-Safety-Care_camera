import React, { useState, useEffect, useRef } from "react";
import { Wifi, Eye, RefreshCw, History, Settings, X, Video, Mic, Volume2, Play, Rewind, FastForward, PlayCircle, BellRing, Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MonitorTabProps, Task, CATEGORY_META, Tab } from "../types";



function RiskRing({ score, isMobile = false }: { score: number; isMobile?: boolean }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const [animated, setAnimated] = useState(score);

  useEffect(() => {
    let animationFrameId: number;

    const updateScore = () => {
      setAnimated((prev: number) => {
        const nextValue = prev * 0.8 + score * 0.2;
        // Stop animating if we're close enough (e.g. less than 0.1 difference)
        if (Math.abs(nextValue - score) < 0.1) {
          return score;
        }
        return nextValue;
      });
      animationFrameId = requestAnimationFrame(updateScore);
    };

    animationFrameId = requestAnimationFrame(updateScore);
    return () => cancelAnimationFrame(animationFrameId);
  }, [score]);

  const animFilled = (animated / 100) * circ;
  const color = score >= 70 ? "#ef4444" : score > 30 ? "#3b82f6" : "#10b981";
  const glowColor = score >= 70 ? "rgba(239, 68, 68, 0.5)" : score > 30 ? "rgba(59, 130, 246, 0.5)" : "rgba(16, 185, 129, 0.5)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
      <style>{`
        @keyframes riskRipple {
          0% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(245, 81, 108, 0.7); }
          70% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 20px rgba(245, 81, 108, 0); }
          100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 0 rgba(245, 81, 108, 0); }
        }
        @keyframes riskTextBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(245, 81, 108, 0.8); }
          50% { opacity: 0.5; text-shadow: none; }
        }
      `}</style>

      {/* Risk Ripple Effects for High Score - Disabled on mobile to save GPU */}
      {score >= 70 && !isMobile && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500/10 pointer-events-none" style={{ animation: 'riskRipple 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          <div className="absolute inset-0 rounded-full bg-red-500/10 pointer-events-none" style={{ animation: 'riskRipple 2s cubic-bezier(0, 0, 0.2, 1) 0.6s infinite' }} />
          <div className="absolute inset-0 rounded-full bg-red-500/10 pointer-events-none" style={{ animation: 'riskRipple 2s cubic-bezier(0, 0, 0.2, 1) 1.2s infinite' }} />
        </>
      )}

      <div
        className={`absolute inset-0 rounded-full transition-all duration-700`}
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(10px)",
          boxShadow: `
            4px 4px 10px rgba(0, 0, 0, 0.03), 
            inset 2px 2px 5px rgba(255, 255, 255, 0.8),
            inset -2px -2px 5px rgba(0, 0, 0, 0.02)
          `,
          border: "1px solid rgba(255, 255, 255, 0.5)"
        }}
      />
      <svg width="148" height="148" className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            {score >= 90 ? (
              <>
                <stop offset="0%" stopColor="#f97316" />   {/* 極度危險: 橘色起點 */}
                <stop offset="100%" stopColor="#ef4444" /> {/* 極度危險: 紅色終點 */}
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#10b981" />   {/* 起點: 綠色 (因 -90deg 旋轉，0% 會在正上方) */}
                <stop offset="50%" stopColor="#3b82f6" />  {/* 中點: 藍色 */}
                <stop offset="100%" stopColor="#ef4444" /> {/* 終點: 紅色 */}
              </>
            )}
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="74" cy="74" r={radius} fill="none" stroke="#d1d9e6" strokeWidth="10"
          style={{
            transition: "filter 0.5s ease-in-out",
            filter: score >= 90 ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))" : "none"
          }}
        />
        {/* Progress */}
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${animFilled} ${circ - animFilled}`}
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>
      <div className="relative flex flex-col items-center z-10">
        <div style={{ animation: score >= 70 ? "riskTextBlink 1.5s ease-in-out infinite" : "none" }}>
          <span
            className={`text-3xl tabular-nums bg-clip-text text-transparent ${score >= 70 ? "bg-gradient-to-br from-orange-500 to-red-500" : score > 30 ? "bg-gradient-to-br from-blue-500 to-orange-500" : "bg-gradient-to-br from-green-500 to-blue-500"
              }`}
            style={{ fontWeight: 700 }}
          >
            {Math.round(animated)}
          </span>
        </div>
        <span className="text-xs text-gray-500 mt-0.5" style={{ fontWeight: 600, letterSpacing: "0.08em" }}>RISK</span>
      </div>
    </div>
  );
}

type ViewMode = "1CH" | "4CH" | "ALL";

export function MonitorTab({
  isActive = true,
  isMobile = false,
  tasks,
  onUpdateTasks,
  onTabChange,
  backendUrl,
  webhookUrl,
  videoQuality,
  micEnabled,
  speakerEnabled,
  useLocalCamera,
  setUseLocalCamera,
  cameraSource,
  setCameraSource,
  isRefreshing,
  setIsRefreshing,
  cameraNonce,
  setCameraNonce,
  handleRefreshCamera,
}: MonitorTabProps) {
  const [pulse, setPulse] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localProcessedImage, setLocalProcessedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localLoopRef = useRef<number | null>(null);

  const [riskScore, setRiskScore] = useState(0);
  const [subScores, setSubScores] = useState({ distance: 0, level: 0, duration: 0 });
  const [showAlert, setShowAlert] = useState(false);
  const [hasDismissedAlert, setHasDismissedAlert] = useState(false);
  const [riskHistory, setRiskHistory] = useState<number[]>(new Array(10).fill(0));

  useEffect(() => {
    // 輪詢後端確認實體攝影機是否真的連線，並取得風險評估數據
    const checkStatusAndRisk = async () => {
      try {
        // 1. 檢查攝影機連線狀態 (加上時間戳避免快取問題)
        const ts = Date.now();
        const statusRes = await fetch(`${backendUrl}/camera_status?t=${ts}`);
        const statusData = await statusRes.json();
        setCameraConnected(statusData.connected || Object.keys(statusData).length > 0);

        // 2. 獲取即時風險數據
        const riskRes = await fetch(`${backendUrl}/risk_data?t=${ts}`);
        const riskData = await riskRes.json();

        if (riskData) {
          setRiskScore(riskData.score);
          setRiskHistory((prev) => [...prev.slice(1), riskData.score]);
          setSubScores(riskData.subScores);
        }
      } catch (e) {
        console.error("Data Fetch Error:", e);
        setCameraConnected(false);
      }
    };

    if (!isActive) return;

    const pollInterval = setInterval(checkStatusAndRisk, 1000); // 每一秒更新一次數據
    checkStatusAndRisk();

    return () => {
      clearInterval(pollInterval);
    };

  }, [isActive, backendUrl]);

  // Sync Webhook to Backend
  useEffect(() => {
    if (webhookUrl && backendUrl) {
      fetch(`${backendUrl}/set_webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      }).catch(err => console.error("Webhook Sync Error:", err));
    }
  }, [webhookUrl, backendUrl]);

  // Local Camera Management
  useEffect(() => {
    if (useLocalCamera && isActive) {
      startLocalCamera();
    } else {
      stopLocalCamera();
    }
    return () => stopLocalCamera();
  }, [useLocalCamera, isActive]);

  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: false
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // 啟動處理循環
      startProcessingLoop();
    } catch (err) {
      console.error("Local Camera Error:", err);
      alert("無法存取鏡頭，請檢查權限設定");
      setUseLocalCamera(false);
    }
  };

  const toggleFacingMode = () => {
    setCameraFacingMode((prev: "user" | "environment") => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (useLocalCamera && isActive) {
      stopLocalCamera(); // 重啟以更換鏡頭
      startLocalCamera();
    }
  }, [cameraFacingMode]);

  const stopLocalCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setLocalStream(null);
    }
    if (localLoopRef.current) {
      clearInterval(localLoopRef.current);
      localLoopRef.current = null;
    }
    setLocalProcessedImage(null);
  };

  const startProcessingLoop = () => {
    if (localLoopRef.current) clearInterval(localLoopRef.current);

    localLoopRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !useLocalCamera) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 當影片已經載入且有尺寸時才繪製
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = 480; // 統一寬度以節省流量
        canvas.height = (video.videoHeight / video.videoWidth) * 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Img = canvas.toDataURL('image/jpeg', 0.5); // 品質 0.5

        try {
          const res = await fetch(`${backendUrl}/process_frame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Img })
          });

          if (res.ok) {
            const data = await res.json();
            setLocalProcessedImage(data.image);
            if (data.risk) {
              setRiskScore(data.risk.score);
              setRiskHistory((prev) => [...prev.slice(1), data.risk.score]);
              setSubScores(data.risk.subScores);
            }
          }
        } catch (e) {
          console.error("Process Frame Error:", e);
        }
      }
    }, 150); // 約 6-7 FPS，節省負擔又能維持反應
  };


  // Sparkline Generator
  const generatePath = (data: number[], w: number, h: number) => {
    if (data.length < 2) return "";
    const xStep = w / (data.length - 1);
    const min = 0;
    const max = 100;
    const range = max - min || 1;
    return data.map((d, i) => `${i * xStep},${h - ((d - min) / range) * h}`).join(" L");
  };

  // Find next incomplete task
  const nextTask = tasks.find(t => !t.done);
  const nextTaskMeta = nextTask ? CATEGORY_META[nextTask.category] : null;
  const completedCount = tasks.filter(t => t.done).length;

  // 移除原始模擬動態計分邏輯，改用上方 checkStatusAndRisk 輪詢後端數據


  // Alert Trigger Logic
  useEffect(() => {
    if (riskScore >= 90) {
      if (!hasDismissedAlert) {
        setShowAlert(true);

        // --- 系統級推送通知 (PWA 核心功能) ---
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const n = new Notification("⚠️ 高風險安全警報", {
              body: "偵測到疑似危險物品或行為，請立即確認監視畫面！",
              tag: "risk-alert", // 避免重複跳出
              renotify: true,
              silent: false
            } as any);
            n.onclick = () => {
              window.focus();
              setShowAlert(false);
            };
          } catch (e) {
            console.error("Notification Error:", e);
          }
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          // 強烈的警告震動節奏：震動 400ms，暫停 200ms，再震動 400ms
          navigator.vibrate([400, 200, 400]);
        }
      }
    } else {
      // 當風險降低，重置已關閉狀態，以便下次風險升高時能再次觸發
      setHasDismissedAlert(false);
    }
  }, [riskScore, hasDismissedAlert]);

  const [clock, setClock] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });
  const [camNames, setCamNames] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem("camNames");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return {
      1: "CAM-01 · 客廳",
      2: "CH-02",
      3: "CH-03",
      4: "CH-04",
      5: "CH-05",
      6: "CH-06",
    };
  });
  const [editingChId, setEditingChId] = useState<number | null>(null);
  const [liveChannels, setLiveChannels] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("1CH");
  const [activeChannel, setActiveChannel] = useState<number>(1);
  const [showPlayback, setShowPlayback] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(50);
  const [searchTime, setSearchTime] = useState("");

  const handleTimeSearch = () => {
    if (!searchTime) return;
    const [hours, minutes] = searchTime.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const percentage = ((hours * 60 + minutes) / (24 * 60)) * 100;
      setPlaybackTime(Math.max(0, Math.min(100, percentage)));
    }
  };

  const getPlaybackTimeString = (percent: number) => {
    const totalSecondsValue = Math.floor((percent / 100) * 24 * 60 * 60);
    const h = Math.floor(totalSecondsValue / 3600);
    const m = Math.floor((totalSecondsValue % 3600) / 60);
    const s = totalSecondsValue % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCompleteTask = () => {
    // 如果還有任務未完成，則執行完成動作
    if (nextTask && !nextTask.done && onUpdateTasks) {
      onUpdateTasks(prev => prev.map(t => t.id === nextTask.id ? { ...t, done: true } : t));
      return;
    }

    // 如果所有進度已完成（或沒有任務），點擊跳轉到照護分頁
    if (onTabChange) {
      onTabChange("care");
    }
  };
  const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, "/");

  // 改用後端輪詢結果作為連線指標，或是本地鏡頭已啟動
  const [cameraConnected, setCameraConnected] = useState(false);

  // 改用後端輪詢結果作為連線指標，或是本地鏡頭已啟動
  const effectiveLive = cameraConnected || useLocalCamera;

  useEffect(() => {
    const id = setInterval(() => setPulse((p: boolean) => !p), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setClock(now.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col gap-5 p-4 pb-32 overflow-y-auto h-full"
      style={{
        background: "transparent",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)"
      }}
    >

      <style>{`
        @keyframes selectionGlow {
          0%, 100% { box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.6), 0 0 12px rgba(59, 130, 246, 0.4); border-color: rgba(255, 255, 255, 0.7); }
          50% { box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.9), 0 0 20px rgba(59, 130, 246, 0.7); border-color: rgba(255, 255, 255, 1); }
        }
        @keyframes smoothBreathe {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.4), inset 5px 5px 12px #d1d9e6, inset -5px -5px 12px #ffffff; }
          50% { box-shadow: 0 0 18px rgba(59, 130, 246, 0.9), inset 0 0 12px rgba(59, 130, 246, 0.6); }
        }
        @keyframes alertShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
          45% { transform: scale(1.2); }
          60% { transform: scale(1); }
        }
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 0.5; }
          50% { opacity: 0.3; }
          95% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scanMoving {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        .haptic-btn {
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .haptic-btn:active {
          box-shadow: inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff !important;
          transform: scale(0.96);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div />
        <div className="flex gap-2 items-center">
          {/* View Mode Switcher */}
          <div className="flex glass-panel rounded-xl p-1 mr-1">
            {(["1CH", "4CH", "ALL"] as ViewMode[]).map(mode => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === mode ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:bg-white/30'
                  }`}
              >
                {mode}
              </motion.button>
            ))}
          </div>

          {/* Refresh Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleRefreshCamera}
            disabled={isRefreshing}
            className={`w-9 h-9 rounded-xl flex items-center justify-center glass-panel transition-all ${isRefreshing ? 'opacity-50' : 'hover:bg-white/40'}`}
          >
            <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-500`} />
          </motion.button>

          <motion.div
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel transition-all"
            style={{
              background: effectiveLive ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 238, 238, 0.6)",
              cursor: effectiveLive ? "default" : "pointer"
            }}
            onClick={() => {
              if (!effectiveLive) {
                // 如果沒連上，引導使用者去授權隧道
                window.open(backendUrl, '_blank');
              }
            }}
          >
            <Wifi size={14} className={effectiveLive ? "text-blue-500" : "text-red-500"} />
            <div className="flex flex-col items-start leading-none">
              <span className={`text-[10px] ${effectiveLive ? 'text-gray-600' : 'text-red-600'}`} style={{ fontWeight: 700 }}>
                {useLocalCamera ? 'MOBILE' : (effectiveLive ? 'LIVE' : 'OFF')}
              </span>
              {!effectiveLive && (
                <span className="text-[8px] text-red-500 font-bold mt-0.5">點擊授權</span>
              )}
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full ${effectiveLive ? (useLocalCamera ? 'bg-blue-400' : 'bg-green-500') : 'bg-red-500'}`}
              style={{
                boxShadow: effectiveLive ? (useLocalCamera ? "0 0 8px #60a5fa" : "0 0 8px #22c55e") : "none",
                animation: (effectiveLive && pulse) ? "heartbeat 2s infinite" : "none"
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Camera Feed Grid */}
      <motion.div
        layout
        className={`grid gap-2 ${viewMode === "1CH" ? "grid-cols-1" : viewMode === "4CH" ? "grid-cols-2" : "grid-cols-3"
          }`}
      >
        <AnimatePresence mode="popLayout">
          {Array.from({ length: viewMode === "1CH" ? 1 : viewMode === "4CH" ? 4 : 6 }).map((_, i) => {
            const chId = viewMode === "1CH" ? activeChannel : i + 1;

            return (
              <motion.div
                key={chId}
                layoutId={`cam-${chId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => {
                  if (viewMode !== "1CH") {
                    setActiveChannel(chId);
                  }
                }}
                onDoubleClick={() => {
                  if (viewMode !== "1CH") {
                    setActiveChannel(chId);
                    setViewMode("1CH");
                  }
                }}
                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${chId === activeChannel ? "z-10" : "z-0"
                  }`}
                style={{
                  boxShadow: chId === activeChannel
                    ? (viewMode === "1CH"
                      ? "0 15px 40px -10px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.15), 6px 6px 15px #d1d9e6, -6px -6px 15px #ffffff"
                      : "0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.5)")
                    : "0 2px 8px rgba(0, 0, 0, 0.05), 5px 5px 12px #d1d9e6, -5px -5px 12px #ffffff",
                  height: viewMode === "1CH" ? 210 : viewMode === "4CH" ? 100 : 70,
                  background: "#F0F4F8", // 跟下方 UI 同色
                  padding: "4px", // 創造實體邊框感
                  border: chId === activeChannel && viewMode === "1CH" ? "1.5px solid rgba(59, 130, 246, 0.4)" : "1.5px solid transparent",
                  transform: (chId === activeChannel && viewMode !== "1CH") ? "scale(0.985)" : "scale(1)",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                title={viewMode !== "1CH" ? "點擊選擇，雙擊放大畫面" : ""}
              >
                {/* 強化的選取內縮白框與發光 Overlay - 僅在非 1CH 模式下顯示 */}
                {chId === activeChannel && viewMode !== "1CH" && (
                  <div
                    className="absolute inset-[4px] pointer-events-none z-30 border-[3px] rounded-[14px]"
                    style={{
                      animation: "selectionGlow 2s ease-in-out infinite",
                    }}
                  />
                )}

                {/* 統一所有頻道的影像載入容器，確保待機與連線效果完全一致 */}
                <div className="w-full h-full relative overflow-hidden rounded-[12px] bg-[#111827]"
                  style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>

                  {/* Hidden elements for local camera processing */}
                  <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                  <canvas ref={canvasRef} className="hidden" />

                  {isActive && (
                    useLocalCamera && chId === activeChannel ? (
                      <img
                        src={localProcessedImage || ""}
                        alt="Local Camera Processing"
                        className="w-full h-full object-cover"
                        style={{ opacity: localProcessedImage ? 1 : 0, transition: 'opacity 0.3s' }}
                      />
                    ) : (
                      <img
                        src={`${backendUrl}/video_feed?ch=${chId}&nonce=${cameraNonce}`}
                        alt={`Live Camera Feed CH-${chId}`}
                        className="w-full h-full object-cover"
                        onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = '1';
                          setLiveChannels(prev => ({ ...prev, [chId]: true }));
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          setLiveChannels(prev => ({ ...prev, [chId]: false }));
                          (e.currentTarget as HTMLImageElement).style.opacity = '0';
                        }}
                        style={{ transition: 'opacity 0.5s', opacity: 0 }}
                      />
                    )
                  )}
                  {!useLocalCamera && !liveChannels[chId] && (
                    <div className="absolute inset-0 bg-[#111827] flex flex-col items-center justify-center gap-4">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Wifi size={viewMode === "1CH" ? 32 : 20} className="text-gray-600" />
                        <span className="text-[10px] font-bold text-gray-700 tracking-widest">NO SIGNAL</span>
                      </div>

                      {chId === activeChannel && viewMode === "1CH" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUseLocalCamera(true);
                            localStorage.setItem("use_local_camera", "true");
                          }}
                          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-[11px] font-bold backdrop-blur-sm active:bg-blue-500/40 transition-all"
                        >
                          使用手機鏡頭
                        </motion.button>
                      )}
                    </div>
                  )}
                  {useLocalCamera && chId === activeChannel && (
                    <div className="absolute top-2 right-2 z-40 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFacingMode();
                        }}
                        className="p-2 rounded-lg bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
                      >
                        <RefreshCw size={14} className={cameraFacingMode === 'environment' ? 'rotate-180' : ''} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUseLocalCamera(false);
                          localStorage.setItem("use_local_camera", "false");
                        }}
                        className="p-2 rounded-lg bg-red-500/40 text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {useLocalCamera && chId === activeChannel && !localProcessedImage && (
                    <div className="absolute inset-0 bg-[#111827] flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={viewMode === "1CH" ? 32 : 20} className="text-blue-500 animate-spin opacity-40" />
                      <span className="text-[10px] font-bold text-gray-700 tracking-widest opacity-40">CARING STARTING...</span>
                    </div>
                  )}
                </div>


                {/* Camera label - 可點擊編輯 */}
                <div
                  className="absolute bottom-2.5 left-2.5 px-3 py-1.5 rounded-xl flex items-center gap-1.5 z-20"
                  style={{
                    background: "rgba(240, 244, 248, 0.85)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "3px 3px 6px rgba(0,0,0,0.15), -2px -2px 6px rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    cursor: "pointer"
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setEditingChId(chId);
                  }}
                  title={"點擊修改名稱"}
                >
                  <Eye size={viewMode === "1CH" ? 13 : 11} className="text-blue-500" />
                  {editingChId === chId ? (
                    <input
                      autoFocus
                      defaultValue={camNames[chId] || `CH-0${chId}`}
                      style={{
                        fontSize: 11, fontWeight: 700, background: "transparent",
                        color: "#374151", border: "none", outline: "none", width: 100,
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const newNames = { ...camNames, [chId]: e.target.value };
                        setCamNames(newNames);
                        localStorage.setItem("camNames", JSON.stringify(newNames));
                        setEditingChId(null);
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          const newNames = { ...camNames, [chId]: (e.currentTarget as HTMLInputElement).value };
                          setCamNames(newNames);
                          localStorage.setItem("camNames", JSON.stringify(newNames));
                          setEditingChId(null);
                        }
                      }}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()} // 避免雙擊時切換視角
                      onDoubleClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-gray-700 truncate" style={{ fontSize: viewMode === "1CH" ? 11 : 9, fontWeight: 700, maxWidth: viewMode === "1CH" ? 150 : 80 }}>
                      {camNames[chId] || `CH-0${chId}`}
                    </span>
                  )}
                </div>

                {/* AI Scanning Line Overlay - Simplified for mobile */}
                {
                  liveChannels[chId] && !isMobile && (
                    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                      <div
                        className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
                        style={{
                          animation: "scanline 3s linear infinite",
                          boxShadow: "0 0 15px rgba(59, 130, 246, 0.8)"
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                          backgroundSize: "100% 2px, 3px 100%"
                        }}
                      />
                    </div>
                  )
                }

                {/* Ultra-simple static scanline for mobile */}
                {liveChannels[chId] && isMobile && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400/20 z-10 pointer-events-none" />
                )}

                {/* Only show timestamp on full 1CH mode to avoid cluttering grids */}
                {
                  viewMode === "1CH" && (
                    <div
                      className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl z-20"
                      style={{
                        background: "rgba(240, 244, 248, 0.85)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "3px 3px 6px rgba(0,0,0,0.15), -2px -2px 6px rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.5)"
                      }}
                    >
                      <span className="text-gray-600" style={{ fontSize: 11, fontWeight: 700 }}>{clock}</span>
                    </div>
                  )
                }
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div >

      {/* High Risk Alert Banner (Inline Dynamic) */}
      <motion.div
        initial={false}
        animate={{
          opacity: showAlert ? 1 : 0,
          scale: showAlert ? 1 : 0.9,
          y: showAlert ? 0 : -20,
        }}
        className={`overflow-hidden cursor-pointer rounded-2xl shimmer-container relative`}
        style={{
          maxHeight: showAlert ? "100px" : "0px",
          marginTop: showAlert ? "4px" : "0px",
          zIndex: 50,
          background: "linear-gradient(90deg, #f43f5e, #f97316)",
          boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
        onClick={() => {
          setShowAlert(false);
          setHasDismissedAlert(true);
        }}
      >
        <div className="shimmer-effect" />
        <div className="p-4 flex items-center gap-3 w-full relative z-10 transition-transform active:scale-[0.98]">
          {/* Bell Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md">
            <BellRing size={20} className="text-white" />
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚠️</span>
              <span className="text-white font-bold text-[15px] tracking-wide">高風險警報已觸發</span>
            </div>
            <span className="text-white/90 text-[11px] mt-0.5">偵測到疑似危險物品，建議立即確認</span>
          </div>

          {/* Right text */}
          <span className="text-white/80 text-[11px] font-bold tracking-wider">NOW</span>
        </div>
      </motion.div >

      {/* Risk Assessment Center */}
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="rounded-2xl p-4 flex items-center gap-4 glass-panel cursor-pointer"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <RiskRing score={riskScore} isMobile={isMobile} />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-700" style={{ fontWeight: 700, fontSize: 14 }}>風險評估中心</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontWeight: 500 }}>即時動態評分</p>
            </div>
            {/* Sparkline Overlay */}
            <div className="w-16 h-8 opacity-60">
              <svg width="64" height="32" viewBox="0 0 64 32" className="overflow-visible">
                <path
                  d={`M ${generatePath(riskHistory, 64, 32)}`}
                  fill="none"
                  stroke={riskScore >= 70 ? "#ef4444" : "#3b82f6"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "stroke 0.3s" }}
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {[
              { label: "距離 (近度)", value: subScores.distance, color: subScores.distance > 70 ? "#f43f5e" : "#3b82f6" },
              { label: "危險等級", value: subScores.level, color: subScores.level > 70 ? "#f43f5e" : "#3b82f6" },
              { label: "持續時間", value: subScores.duration, color: subScores.duration > 70 ? "#f43f5e" : "#3b82f6" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-gray-500" style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: item.color }}>{item.value}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden bg-white/30"
                >
                  <motion.div
                    className="h-full rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    style={{
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div >

      {/* Health Vitals Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Heart Rate Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl p-4 glass-panel flex flex-col items-center justify-center border border-white"
          style={{ background: "rgba(255, 255, 255, 0.5)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-2 shadow-sm">
            <div className="animate-pulse">
              <span className="text-lg">❤️</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Heart Rate</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-800 tabular-nums">78</span>
            <span className="text-[10px] font-bold text-gray-500">BPM</span>
          </div>
        </motion.div>

        {/* SpO2 Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-2xl p-4 glass-panel flex flex-col items-center justify-center border border-white"
          style={{ background: "rgba(255, 255, 255, 0.5)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 shadow-sm">
            <span className="text-lg">🩸</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SpO2 Oxygen</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-800 tabular-nums">98</span>
            <span className="text-[10px] font-bold text-gray-500">%</span>
          </div>
        </motion.div>
      </div>

      {/* Daily Care Progress Island */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCompleteTask}
        className="rounded-3xl p-5 relative overflow-hidden cursor-pointer shadow-xl shadow-blue-500/10 border border-white"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(20px)"
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-800">今日照護任務</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{currentDate}</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-[10px] font-black text-blue-500">{completedCount}/{tasks.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {nextTask ? (
              <div className="bg-white/40 p-3 rounded-2xl border border-white/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white shadow-sm text-blue-500`}>
                    <span className="text-xl">{CATEGORY_META[nextTask.category].emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-700">{nextTask.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium">下一步：點擊標記為完成</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50/50 p-3 rounded-2xl border border-green-100/50 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <X size={12} strokeWidth={4} />
                </div>
                <p className="text-xs font-bold text-green-600">所有任務皆已完成！期待明天。</p>
              </div>
            )}

            <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* History Search Section */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowPlayback(true)}
        className="rounded-2xl p-4 flex items-center justify-center gap-3 glass-panel border border-white"
        style={{ background: "rgba(255, 255, 255, 0.4)" }}
      >
        <History size={18} className="text-blue-500" />
        <span className="text-sm font-bold text-gray-700">搜尋歷史回放紀錄</span>
      </motion.button>




      {/* Playback Modal */}
      <AnimatePresence>
        {showPlayback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#111827] text-white"
          >
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <span className="text-gray-600 font-bold opacity-50 tracking-widest text-sm">VIDEO PLAYBACK</span>
              <button
                onClick={() => setShowPlayback(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-red-500/80 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <PlayCircle size={64} className="text-white" />
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-6" style={{ background: "linear-gradient(180deg, #111827 0%, #0f131a 100%)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{camNames[activeChannel] || "CAM-01"}</h3>
                  <p className="text-blue-400 text-xs mt-1 font-mono">{currentDate} {getPlaybackTimeString(playbackTime)}</p>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <Rewind size={20} className="hover:text-white cursor-pointer transition-colors" />
                  <Play size={24} className="text-white cursor-pointer fill-white" />
                  <FastForward size={20} className="hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>

              {/* Time Search Field */}
              <div className="flex items-center gap-2 mt-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700">
                <Search size={16} className="text-gray-400 ml-2" />
                <input
                  type="time"
                  value={searchTime}
                  onChange={(e) => setSearchTime(e.target.value)}
                  className="bg-transparent text-sm text-white border-none outline-none focus:ring-0 font-mono"
                  style={{ colorScheme: "dark" }}
                />
                <button
                  onClick={handleTimeSearch}
                  className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-colors"
                >
                  搜尋時間
                </button>
              </div>

              <div className="relative mt-8">
                <div className="w-full h-12 bg-gray-800 rounded-lg overflow-hidden relative border border-gray-700">
                  {/* Fake events on timeline */}
                  <div className="absolute top-0 bottom-0 left-[20%] w-1 bg-red-500/80" />
                  <div className="absolute top-0 bottom-0 left-[45%] w-1 bg-orange-500/80" />
                  <div className="absolute top-0 bottom-0 left-[75%] w-1 bg-blue-500/80" />

                  {/* Progress bar */}
                  <div className="absolute top-0 bottom-0 left-0 bg-blue-600/30" style={{ width: `${playbackTime}%` }} />
                </div>

                {/* Playhead */}
                <input
                  type="range"
                  min="0" max="100"
                  value={playbackTime}
                  onChange={(e) => setPlaybackTime(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-12 opacity-0 cursor-ew-resize z-10"
                />

                <div
                  className="absolute top-[-10px] bottom-[-10px] w-0.5 bg-blue-400 pointer-events-none"
                  style={{ left: `${playbackTime}%` }}
                >
                  <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 font-mono font-bold px-1">
                <span>00:00:00</span>
                <span>12:00:00</span>
                <span>23:59:59</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div >
  );
}
