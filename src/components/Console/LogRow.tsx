import React from 'react';
import clsx from 'clsx';
import type { LogEntry } from '../../types';

interface LogRowProps {
    log: LogEntry;
    isDimmed: boolean;
    style?: React.CSSProperties;
    searchQuery?: string;
    isFocused?: boolean;
}

const HIGHLIGHT_REGEX = /((?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{3})?))|(\\b(?:ERROR|FAIL|FATAL|WARN|WARNING|INFO)\\b)|(\\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\\b)|(0x[0-9A-F]+)/gi;

// Simple highlighter: split by regex and colorize
const HighlightedText: React.FC<{ text: string; searchQuery?: string }> = React.memo(({ text, searchQuery }) => {
    // If there's a search query, highlight it first
    if (searchQuery && searchQuery.trim()) {
        return <SearchHighlightedText text={text} searchQuery={searchQuery} />;
    }

    return <SyntaxHighlightedText text={text} />;
});

// Component to highlight search matches
const SearchHighlightedText: React.FC<{ text: string; searchQuery: string }> = React.memo(({ text, searchQuery }) => {
    const query = searchQuery.toLowerCase();
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;
    const textLower = text.toLowerCase();

    let searchIndex = textLower.indexOf(query);
    let keyIndex = 0;

    while (searchIndex !== -1) {
        // Add text before match with syntax highlighting
        if (searchIndex > lastIndex) {
            fragments.push(
                <SyntaxHighlightedText key={`pre-${keyIndex}`} text={text.slice(lastIndex, searchIndex)} />
            );
        }

        // Add highlighted match
        const matchEnd = searchIndex + query.length;
        fragments.push(
            <mark
                key={`match-${keyIndex}`}
                className="bg-yellow-500/40 text-yellow-100 rounded-sm px-0.5"
            >
                {text.slice(searchIndex, matchEnd)}
            </mark>
        );

        lastIndex = matchEnd;
        keyIndex++;
        searchIndex = textLower.indexOf(query, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
        fragments.push(
            <SyntaxHighlightedText key={`tail-${keyIndex}`} text={text.slice(lastIndex)} />
        );
    }

    return <>{fragments}</>;
});

// Component for syntax highlighting (timestamps, levels, IPs, hex)
const SyntaxHighlightedText: React.FC<{ text: string }> = React.memo(({ text }) => {
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;

    const regex = new RegExp(HIGHLIGHT_REGEX);
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

export const LogRow: React.FC<LogRowProps> = React.memo(({ log, isDimmed, style, searchQuery, isFocused }) => {
    return (
        <div
            style={style}
            className={clsx(
                "font-mono text-sm whitespace-pre px-4 py-0.5 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors",
                isDimmed ? "opacity-30" : "opacity-100",
                // Line styling based on level
                log.level === 'ERROR' && !isDimmed && "bg-red-900/10",
                log.level === 'WARN' && !isDimmed && "bg-yellow-900/10",
                // Focused highlight with animation
                isFocused && "!bg-yellow-500/30 animate-pulse"
            )}
        >
            <div className="flex">
                <span className="select-none text-zinc-600 w-12 text-right mr-4 shrink-0 text-xs">
                    {log.id + 1}
                </span>
                <span className="break-all whitespace-pre-wrap">
                    <HighlightedText text={log.originalLine} searchQuery={searchQuery} />
                </span>
            </div>
        </div>
    );
});
