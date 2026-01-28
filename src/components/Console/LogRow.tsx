import React from 'react';
import clsx from 'clsx';
import type { LogEntry } from '../../types';

interface LogRowProps {
    log: LogEntry;
    isDimmed: boolean;
    style?: React.CSSProperties;
}

const HIGHLIGHT_REGEX = /((?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{3})?))|(\b(?:ERROR|FAIL|FATAL|WARN|WARNING|INFO)\b)|(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)|(0x[0-9A-F]+)/gi;

// Simple highlighter: split by regex and colorize
const HighlightedText: React.FC<{ text: string }> = React.memo(({ text }) => {
    // const parts = text.split(HIGHLIGHT_REGEX).filter(part => part !== undefined && part !== ''); // unused

    // Basic heuristic to identify what each part matched. 
    // Ideally use matchAll to get groups or indices.
    // This split method is a bit weak because we lose context of which group matched.
    // Better approach: matchAll and rebuild string.

    // Re-implementation using matchAll for correctness
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Reset regex state if needed (not needed for local var with matchAll, but good hygiene)
    const regex = new RegExp(HIGHLIGHT_REGEX); // Clone

    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) return <span>{text}</span>;

    matches.forEach((match, i) => {
        const matchIndex = match.index!;
        const fullMatch = match[0];

        // Push text before match
        if (matchIndex > lastIndex) {
            fragments.push(<span key={`text-${i}`}>{text.slice(lastIndex, matchIndex)}</span>);
        }

        // Identify type
        let className = 'text-zinc-300';
        if (match[1]) className = 'text-log-time'; // Timestamp
        else if (match[2]) { // Level
            const lvl = match[2].toUpperCase();
            if (lvl.match(/ERROR|FAIL|FATAL/)) className = 'text-log-error font-bold';
            else if (lvl.match(/WARN|WARNING/)) className = 'text-log-warn font-bold';
            else className = 'text-log-info font-bold';
        }
        else if (match[3]) className = 'text-purple-400'; // IP
        else if (match[4]) className = 'text-orange-400'; // Hex Code

        fragments.push(
            <span key={`match-${i}`} className={className}>
                {fullMatch}
            </span>
        );

        lastIndex = matchIndex + fullMatch.length;
    });

    // Tail
    if (lastIndex < text.length) {
        fragments.push(<span key="tail">{text.slice(lastIndex)}</span>);
    }

    return <>{fragments}</>;
});

export const LogRow: React.FC<LogRowProps> = React.memo(({ log, isDimmed, style }) => {
    return (
        <div
            style={style}
            className={clsx(
                "font-mono text-sm whitespace-pre px-4 py-0.5 border-b border-zinc-800/50 hover:bg-zinc-800/50",
                isDimmed ? "opacity-30" : "opacity-100",
                // Line styling based on level
                log.level === 'ERROR' && !isDimmed && "bg-red-900/10",
                log.level === 'WARN' && !isDimmed && "bg-yellow-900/10"
            )}
        >
            <div className="flex">
                <span className="select-none text-zinc-600 w-12 text-right mr-4 shrink-0 text-xs">
                    {log.id + 1}
                </span>
                <span className="break-all whitespace-pre-wrap">
                    <HighlightedText text={log.originalLine} />
                </span>
            </div>
        </div>
    );
});
