import { parse as parseDate, isValid as isValidDate } from 'date-fns';
import type { LogEntry, LogLevel, ParsingRule } from '../types';


export interface ParsingPreset {
    id: string;
    name: string;
    description: string;
    rule: ParsingRule;
    example?: string;
}

export const PARSING_PRESETS: ParsingPreset[] = [
    {
        id: 'default-bracket',
        name: '方括号时间戳 + 级别',
        description: "格式示例：[2023-01-01 12:00:00.123] INFO: message。级别可选，缺省将按关键字推断。",
        rule: {
            regex: /^\[(?<timestamp>[^\]]+)\]\s*(?<level>ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)?[:\s-]*(?<message>.*)$/,
            timestampGroup: 'timestamp',
            timestampFormats: ['yyyy-MM-dd HH:mm:ss.SSS', 'yyyy-MM-dd HH:mm:ss'],
            levelGroup: 'level',
            messageGroup: 'message'
        },
        example: '[2023-01-01 12:00:00.123] INFO: Started'
    },
    {
        id: 'iso8601-level',
        name: 'ISO8601 + 级别',
        description: '格式示例：2023-01-01T12:00:00.123Z ERROR message',
        rule: {
            regex: /^(?<timestamp>\S+)\s+(?<level>ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)\s+(?<message>.*)$/,
            timestampGroup: 'timestamp',
            timestampFormats: [
                "yyyy-MM-dd'T'HH:mm:ss.SSSX",
                "yyyy-MM-dd'T'HH:mm:ssX",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss"
            ],
            levelGroup: 'level',
            messageGroup: 'message'
        },
        example: '2023-01-01T12:00:00.123Z ERROR Something failed'
    },
    {
        id: 'date-time-pipe',
        name: '时间 | 级别 | 内容',
        description: '格式示例：2023-01-01 12:00:00 | WARN | message',
        rule: {
            regex: /^(?<timestamp>[^|]+)\s*\|\s*(?<level>ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)\s*\|\s*(?<message>.*)$/,
            timestampGroup: 'timestamp',
            timestampFormats: ['yyyy-MM-dd HH:mm:ss.SSS', 'yyyy-MM-dd HH:mm:ss'],
            levelGroup: 'level',
            messageGroup: 'message'
        },
        example: '2023-01-01 12:00:00 | WARN | Disk almost full'
    },
    {
        id: 'ddmmyyyy-level',
        name: 'dd/mm/yyyy + 级别',
        description: '格式示例：31/01/2026 10:22:33 INFO message',
        rule: {
            regex: /^(?<timestamp>.+?)\s+(?<level>ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)\s+(?<message>.*)$/,
            timestampGroup: 'timestamp',
            timestampFormats: ['dd/MM/yyyy HH:mm:ss.SSS', 'dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy'],
            levelGroup: 'level',
            messageGroup: 'message'
        },
        example: '31/01/2026 10:22:33 INFO User login'
    }
];
// Regex to catch level (unused currently as we use manual partial match logic in determineLogLevel, or could be used there)
// const LEVEL_REGEX = /(ERROR|FAIL|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)/i;

export const determineLogLevel = (line: string): LogLevel => {
    const upperLine = line.toUpperCase();
    if (upperLine.match(/ERROR|FAIL|FATAL/)) return 'ERROR';
    if (upperLine.match(/WARN|WARNING/)) return 'WARN';
    return 'INFO';
};

const normalizeLogLevel = (levelText?: string | null): LogLevel => {
    if (!levelText) return 'INFO';
    const upper = levelText.toUpperCase();
    if (upper.match(/ERROR|FAIL|FATAL/)) return 'ERROR';
    if (upper.match(/WARN|WARNING/)) return 'WARN';
    return 'INFO';
};

const getGroupValue = (match: RegExpMatchArray, group?: string | number): string | undefined => {
    if (group === undefined || group === null) return undefined;
    if (typeof group === 'number') {
        return match[group];
    }
    const numeric = Number(group);
    if (!Number.isNaN(numeric) && group.trim() !== '') {
        return match[numeric];
    }
    return match.groups?.[group];
};

const parseTimestamp = (value?: string, formats?: string[]): number => {
    if (!value) return 0;

    if (formats && formats.length > 0) {
        for (const format of formats) {
            const parsed = parseDate(value, format, new Date());
            if (isValidDate(parsed)) {
                const time = parsed.getTime();
                if (!Number.isNaN(time)) return time;
            }
        }
    }

    const ts = Date.parse(value);
    if (!Number.isNaN(ts)) return ts;

    return 0;
};

export interface ParseOptions {
    sort?: boolean;
}

export const parseLogs = (rawContent: string, rule?: ParsingRule, options: ParseOptions = {}): LogEntry[] => {
    const lines = rawContent.split(/\r?\n/);
    const logEntries: LogEntry[] = [];

    const activeRule = rule ?? PARSING_PRESETS[0].rule;

    let currentIndex = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        let timestamp = 0;
        let level: LogLevel | undefined;
        let message = line;

        const match = line.match(activeRule.regex);
        if (match) {
            const tsValue = getGroupValue(match, activeRule.timestampGroup);
            timestamp = parseTimestamp(tsValue, activeRule.timestampFormats);

            const levelValue = getGroupValue(match, activeRule.levelGroup);
            level = normalizeLogLevel(levelValue);

            const msgValue = getGroupValue(match, activeRule.messageGroup);
            if (msgValue !== undefined) message = msgValue;
        } else {
            // Multi-line support: if no timestamp at start, it might be a continuation.
            if (logEntries.length > 0) {
                logEntries[logEntries.length - 1].message += '\n' + line;
                logEntries[logEntries.length - 1].originalLine += '\n' + line;
                continue;
            }
            continue;
        }

        logEntries.push({
            id: currentIndex++,
            timestamp,
            level: level ?? determineLogLevel(line),
            message,
            originalLine: line,
        });
    }

    // Sort by timestamp just in case (as per PRD Edge Case 1)
    if (options.sort ?? true) {
        return logEntries.sort((a, b) => a.timestamp - b.timestamp);
    }

    return logEntries;
};
