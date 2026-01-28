import type { LogEntry, LogLevel } from '../types';

// Default regex to match standard logs: [2023-01-01 12:00:00] INFO: message
// Supports variations where level might not be explicitly strictly formatted.
// We'll try to find a date at the start.
const DEFAULT_TIMESTAMP_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{3})?)\]/;
// Regex to catch level (unused currently as we use manual partial match logic in determineLogLevel, or could be used there)
// const LEVEL_REGEX = /(ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)/i;

export const determineLogLevel = (line: string): LogLevel => {
    const upperLine = line.toUpperCase();
    if (upperLine.match(/ERROR|FAIL|FATAL/)) return 'ERROR';
    if (upperLine.match(/WARN|WARNING/)) return 'WARN';
    return 'INFO';
};

export const parseLogs = (rawContent: string): LogEntry[] => {
    const lines = rawContent.split(/\r?\n/);
    const logEntries: LogEntry[] = [];

    let currentIndex = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        // 1. Extract Timestamp
        const timestampMatch = line.match(DEFAULT_TIMESTAMP_REGEX);
        let timestamp = 0;

        if (timestampMatch) {
            // Parse timestamp
            // Format: YYYY-MM-DD HH:mm:ss.SSS
            const dateStr = timestampMatch[1];
            timestamp = Date.parse(dateStr);
            if (isNaN(timestamp)) {
                // If native parse fails, maybe fallback or ignore? 
                // For now, if invalid date, we might treat it as 0 or not a log line start?
                // If we want to support multi-line logs, we would append to previous.
                // Let's assume single line logs for MVP Step 1.
                timestamp = 0;
            }
        } else {
            // Multi-line support: if no timestamp at start, it might be a continuation.
            // For simple MVP without multi-line logic yet: skip or append.
            // Let's try to append to previous if exists, else skip.
            if (logEntries.length > 0) {
                logEntries[logEntries.length - 1].message += '\n' + line;
                logEntries[logEntries.length - 1].originalLine += '\n' + line;
                continue;
            }
            // If it's the very first line and no timestamp, we probably can't use it efficiently?
            // Or assign current time? Let's skip for robust strictness first.
            continue;
        }

        // 2. Extract Level
        const level = determineLogLevel(line);

        // 3. Message (everything else, or technically the whole line is fine for display)
        // We already have the original line.

        logEntries.push({
            id: currentIndex++,
            timestamp,
            level,
            message: line, // We store the full line as message for simple display, or we could strip timestamp.
            originalLine: line,
        });
    }

    // Sort by timestamp just in case (as per PRD Edge Case 1)
    return logEntries.sort((a, b) => a.timestamp - b.timestamp);
};
