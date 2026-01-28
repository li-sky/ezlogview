import { create } from 'zustand';
import type { LogEntry } from '../types';

interface LogState {
    logs: LogEntry[];
    isParsing: boolean;
    fileName: string | null;

    // Timeline State
    startTime: number; // Global start
    endTime: number;   // Global end
    granularity: number; // ms, 0 = auto

    // Selection State
    selectedRange: [number, number] | null; // [start, end] in ms

    // Actions
    setLogs: (logs: LogEntry[], fileName: string) => void;
    setParsing: (isParsing: boolean) => void;
    setSelectedRange: (range: [number, number] | null) => void;
    setGranularity: (ms: number) => void;
    clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
    logs: [],
    isParsing: false,
    fileName: null,
    startTime: 0,
    endTime: 0,
    granularity: 0, // auto
    selectedRange: null,

    setLogs: (logs, fileName) => {
        if (logs.length === 0) {
            set({ logs: [], fileName, startTime: 0, endTime: 0, selectedRange: null });
            return;
        }
        const startTime = logs[0].timestamp;
        const endTime = logs[logs.length - 1].timestamp;
        set({ logs, fileName, startTime, endTime, selectedRange: null });
    },

    setParsing: (isParsing) => set({ isParsing }),

    setSelectedRange: (range) => set({ selectedRange: range }),

    setGranularity: (granularity) => set({ granularity }),

    clearLogs: () => set({ logs: [], fileName: null, startTime: 0, endTime: 0, selectedRange: null, granularity: 0 }),
}));
