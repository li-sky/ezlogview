export type LogLevel = 'ERROR' | 'WARN' | 'INFO';

export interface LogEntry {
    id: number; // Unique index (0-based)
    timestamp: number; // Unix timestamp (ms)
    level: LogLevel;
    message: string;
    originalLine: string; // Keep original for display?
}

export interface ParsingRule {
    regex: RegExp;
    timestampGroup: string; // Group name or index
    levelGroup: string;
    messageGroup: string;
}

// Stats for the specific time window
export interface TimeWindowStats {
    errorCount: number;
    warnCount: number;
    infoCount: number;
}
// ECharts Event Types
export interface ECZoomEvent {
    type: 'dataZoom';
    batch?: Array<{ start: number; end: number; startValue?: number; endValue?: number }>;
    start?: number;
    end?: number;
    startValue?: number;
    endValue?: number;
}

export interface ECClickEvent {
    componentType: string;
    seriesType: string;
    seriesIndex: number;
    seriesName: string;
    name: string;
    dataIndex: number;
    data: unknown;
    dataType: string;
    value: number | number[];
    color: string;
}
