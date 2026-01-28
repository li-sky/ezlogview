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

    // Selection State (for highlighting clicked bar)
    selectedRange: [number, number] | null; // [start, end] in ms

    // DataZoom State (for filtering/dimming logs based on chart zoom)
    dataZoomRange: [number, number] | null; // [start, end] in ms

    // Search State
    searchQuery: string;
    isSearchPanelOpen: boolean;
    focusedLogId: number | null; // ID of log to scroll to and highlight

    // Actions
    setLogs: (logs: LogEntry[], fileName: string) => void;
    setParsing: (isParsing: boolean) => void;
    setSelectedRange: (range: [number, number] | null) => void;
    setDataZoomRange: (range: [number, number] | null) => void;
    setGranularity: (ms: number) => void;
    setSearchQuery: (query: string) => void;
    setSearchPanelOpen: (open: boolean) => void;
    setFocusedLogId: (id: number | null) => void;
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
    dataZoomRange: null,
    searchQuery: '',
    isSearchPanelOpen: false,
    focusedLogId: null,

    setLogs: (logs, fileName) => {
        if (logs.length === 0) {
            set({ logs: [], fileName, startTime: 0, endTime: 0, selectedRange: null, dataZoomRange: null, searchQuery: '', isSearchPanelOpen: false, focusedLogId: null });
            return;
        }
        const startTime = logs[0].timestamp;
        const endTime = logs[logs.length - 1].timestamp;
        set({ logs, fileName, startTime, endTime, selectedRange: null, dataZoomRange: null, searchQuery: '', focusedLogId: null });
    },

    setParsing: (isParsing) => set({ isParsing }),

    setSelectedRange: (range) => set({ selectedRange: range }),

    setDataZoomRange: (range) => set({ dataZoomRange: range }),

    setGranularity: (granularity) => set({ granularity }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setSearchPanelOpen: (isSearchPanelOpen) => set({ isSearchPanelOpen }),

    setFocusedLogId: (focusedLogId) => set({ focusedLogId }),

    clearLogs: () => set({ logs: [], fileName: null, startTime: 0, endTime: 0, selectedRange: null, dataZoomRange: null, granularity: 0, searchQuery: '', isSearchPanelOpen: false, focusedLogId: null }),
}));

