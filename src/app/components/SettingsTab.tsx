import React, { useState } from "react";
import { motion } from "motion/react";
import { Settings, Video, Mic, Volume2, Database, Bell, LayoutPanelLeft, ShieldAlert } from "lucide-react";
import { SettingsTabProps } from "../types";

export const SettingsTab: React.FC<SettingsTabProps> = ({
    backendUrl, setBackendUrl,
    webhookUrl, setWebhookUrl,
    videoQuality, setVideoQuality,
    micEnabled, setMicEnabled,
    speakerEnabled, setSpeakerEnabled,
    useLocalCamera, setUseLocalCamera,
    cameraSource, setCameraSource,
    handleRefreshCamera,
    isRefreshing
}: SettingsTabProps) => {
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [tempUrl, setTempUrl] = useState(backendUrl);
    const [isEditingWebhook, setIsEditingWebhook] = useState(false);
    const [tempWebhookUrl, setTempWebhookUrl] = useState(webhookUrl);

    const sectionStyle = {
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(20px)",
        borderRadius: "28px",
        padding: "24px",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
        marginBottom: "20px"
    };

    const inputInnerStyle = {
        background: "rgba(255, 255, 255, 0.6)",
        borderRadius: "16px",
        padding: "4px",
        display: "flex",
        gap: "4px",
        border: "1px solid rgba(0,0,0,0.03)",
        boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.02)",
        marginTop: "8px"
    };

    return (
        <div className="p-4 pb-32 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-white/50">
                        <Settings size={22} className="text-gray-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">系統設置</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Configuration</p>
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md border border-white/60 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-gray-500 font-mono">v1.2.8</span>
                </div>
            </div>

            {/* Network Section */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={sectionStyle}
            >
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Database size={16} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">後端連線設置</h3>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-tighter">伺服器位址 (Backend URL)</label>
                        <div style={inputInnerStyle}>
                            {isEditingUrl ? (
                                <>
                                    <input
                                        type="text"
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-xs font-bold text-gray-700"
                                        placeholder="http://192.168.x.x:8080"
                                    />
                                    <button
                                        onClick={() => {
                                            let formatted = tempUrl.trim();
                                            if (formatted && formatted.endsWith('/')) formatted = formatted.slice(0, -1);
                                            setBackendUrl(formatted);
                                            localStorage.setItem('smart_care_backend_url', formatted);
                                            setIsEditingUrl(false);
                                        }}
                                        className="px-5 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        儲存
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 truncate">{backendUrl}</span>
                                    <button
                                        onClick={() => { setTempUrl(backendUrl); setIsEditingUrl(true); }}
                                        className="px-5 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold shadow-sm border border-gray-100 active:scale-95 transition-all"
                                    >
                                        編輯
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-tighter">n8n 通知網址 (Webhook)</label>
                        <div style={inputInnerStyle}>
                            {isEditingWebhook ? (
                                <>
                                    <input
                                        type="text"
                                        value={tempWebhookUrl}
                                        onChange={(e) => setTempWebhookUrl(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-xs font-bold text-gray-700"
                                        placeholder="https://..."
                                    />
                                    <button
                                        onClick={() => {
                                            const formatted = tempWebhookUrl.trim();
                                            setWebhookUrl(formatted);
                                            localStorage.setItem('smart_care_webhook_url', formatted);
                                            setIsEditingWebhook(false);
                                        }}
                                        className="px-5 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        儲存
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 truncate">{webhookUrl || '未設定'}</span>
                                    <div className="flex gap-2">
                                        {webhookUrl && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${backendUrl}/test_webhook`);
                                                        const data = await res.json();
                                                        alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
                                                    } catch (e: any) { alert("❌ 發送失敗，請檢查網路"); }
                                                }}
                                                className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                                            >
                                                測試
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setTempWebhookUrl(webhookUrl); setIsEditingWebhook(true); }}
                                            className="px-5 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold shadow-sm border border-gray-100 active:scale-95 transition-all"
                                        >
                                            編輯
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Camera Control Section */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={sectionStyle}
            >
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Video size={16} className="text-purple-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">攝像頭監控</h3>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">Mobile YOLO 模式</span>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">使用手機本體鏡頭</span>
                        </div>
                        <button
                            onClick={() => {
                                const next = !useLocalCamera;
                                setUseLocalCamera(next);
                                localStorage.setItem("use_local_camera", String(next));
                            }}
                            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${useLocalCamera ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-all duration-300 flex items-center justify-center shadow-md ${useLocalCamera ? 'left-7.5' : 'left-0.5'}`}>
                                {useLocalCamera && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                            </div>
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-tighter">串流影像畫質</span>
                        <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100">
                            {["Low", "Mid", "High"].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setVideoQuality(level as any)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${videoQuality === level ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-tighter">WiFi 攝影機來源 (RTSP/URL)</label>
                        <div style={inputInnerStyle}>
                            <input
                                type="text"
                                placeholder="rtsp://192.168.1.1/live"
                                value={cameraSource}
                                onChange={(e) => {
                                    setCameraSource(e.target.value);
                                    localStorage.setItem("cameraSource", e.target.value);
                                }}
                                className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-xs font-bold text-gray-700"
                            />
                            <button
                                onClick={handleRefreshCamera}
                                disabled={isRefreshing}
                                className="px-5 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isRefreshing ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <Settings size={14} />
                                    </motion.div>
                                ) : "連接"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Integration Section */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={sectionStyle}
            >
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                        <Bell size={16} className="text-green-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">語音與互動交互</h3>
                </div>

                <div className="space-y-4">
                    {[
                        { label: "現場收音監聽", icon: <Mic size={16} />, state: micEnabled, setter: setMicEnabled, color: "green" },
                        { label: "雙向通話功能", icon: <Volume2 size={16} />, state: speakerEnabled, setter: setSpeakerEnabled, color: "blue" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${item.state ? `bg-${item.color}-100 text-${item.color}-600` : 'bg-gray-100 text-gray-400'} transition-colors`}>
                                    {item.icon}
                                </div>
                                <span className={`text-sm font-bold ${item.state ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
                            </div>
                            <button
                                onClick={() => item.setter(!item.state)}
                                className={`w-12 h-6 rounded-full relative transition-all duration-500 ${item.state ? `bg-${item.color}-400` : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-500 shadow-sm ${item.state ? 'left-6.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    ))}

                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex gap-2">
                            <ShieldAlert size={14} className="text-orange-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                系統偵測到 PWA 模式。請確保瀏覽器已授權攝影機與麥克風權限以獲得最佳辨識體驗。音訊雙向互動功能須配合雲端伺服器硬體規格。
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="flex flex-col items-center pt-4 pb-12 opacity-40 grayscale">
                <LayoutPanelLeft size={32} className="text-blue-500 mb-2" />
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Smart Safety Care System</p>
                <div className="h-[1px] w-12 bg-gray-300 my-2" />
                <p className="text-[8px] text-gray-400 font-bold uppercase">Advanced AI Home Integration</p>
            </div>
        </div>
    );
};
