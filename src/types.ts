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
