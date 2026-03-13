import React from 'react';

export type TaskCategory = "Medication" | "Nutrition" | "Exercise" | "Health" | "General";

export interface Task {
    id: number;
    time: string;
    category: TaskCategory;
    title: string;
    note: string;
    done: boolean;
}

export type Tab = "monitor" | "health" | "care" | "settings";

export type JournalCategory = "alert" | "person" | "health" | "activity" | "system";

export interface JournalEntry {
    id: number;
    time: string;
    type: string;
    category: JournalCategory;
    message: string;
    description: string;
    color: string;
}

export const CATEGORY_META: Record<TaskCategory, { label: string; emoji: string; color: string; bg: string }> = {
    Medication: { label: "服藥", emoji: "💊", color: "#f5516c", bg: "rgba(245,81,108,0.12)" },
    Nutrition: { label: "飲食", emoji: "🥗", color: "#00c48c", bg: "rgba(0,196,140,0.12)" },
    Exercise: { label: "運動", emoji: "🏃", color: "#4facfe", bg: "rgba(79,172,254,0.12)" },
    Health: { label: "檢查", emoji: "🩺", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
    General: { label: "一般", emoji: "📋", color: "#f9a825", bg: "rgba(249,168,37,0.12)" },
};

export interface MonitorTabProps {
    isActive?: boolean;
    isMobile?: boolean;
    tasks: Task[];
    onUpdateTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
    onTabChange?: (tab: Tab) => void;
    backendUrl: string;
    webhookUrl: string;
    videoQuality: "High" | "Mid" | "Low";
    micEnabled: boolean;
    speakerEnabled: boolean;
    useLocalCamera: boolean;
    setUseLocalCamera: (v: boolean) => void;
    cameraSource: string;
    setCameraSource: (v: string) => void;
    isRefreshing: boolean;
    setIsRefreshing: (v: boolean) => void;
    cameraNonce: number;
    setCameraNonce: (v: number) => void;
    handleRefreshCamera: () => void;
}

export interface SettingsTabProps {
    backendUrl: string;
    setBackendUrl: (url: string) => void;
    webhookUrl: string;
    setWebhookUrl: (url: string) => void;
    videoQuality: "High" | "Mid" | "Low";
    setVideoQuality: (q: "High" | "Mid" | "Low") => void;
    micEnabled: boolean;
    setMicEnabled: (v: boolean) => void;
    speakerEnabled: boolean;
    setSpeakerEnabled: (v: boolean) => void;
    useLocalCamera: boolean;
    setUseLocalCamera: (v: boolean) => void;
    cameraSource: string;
    setCameraSource: (v: string) => void;
    handleRefreshCamera: () => void;
    isRefreshing: boolean;
}
