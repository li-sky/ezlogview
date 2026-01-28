import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useLogStore } from '../../store/useLogStore';
import type { LogEntry } from '../../types';

// Maximum results to show for performance
const MAX_RESULTS = 1000;

// Memoized search result item
const SearchResultItem: React.FC<{
    log: LogEntry;
    query: string;
    onClick: (log: LogEntry) => void;
}> = React.memo(({ log, query, onClick }) => {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const highlightMatch = (text: string, q: string) => {
        if (!q.trim()) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;

        const contextStart = Math.max(0, idx - 30);
        const contextEnd = Math.min(text.length, idx + q.length + 50);
        const prefix = contextStart > 0 ? '...' : '';
        const suffix = contextEnd < text.length ? '...' : '';

        const before = text.slice(contextStart, idx);
        const match = text.slice(idx, idx + q.length);
        const after = text.slice(idx + q.length, contextEnd);

        return (
            <>
                {prefix}
                <span className="text-zinc-400">{before}</span>
                <mark className="bg-yellow-500/40 text-yellow-100 rounded-sm px-0.5">{match}</mark>
                <span className="text-zinc-400">{after}</span>
                {suffix}
            </>
        );
    };

    return (
        <div
            onClick={() => onClick(log)}
            className="px-3 py-2 border-b border-zinc-800/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-600">#{log.id + 1}</span>
                <span className="text-xs text-zinc-500">{formatTime(log.timestamp)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${log.level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                        log.level === 'WARN' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-blue-900/30 text-blue-400'
                    }`}>
                    {log.level}
                </span>
            </div>
            <div className="text-xs font-mono text-zinc-300 truncate">
                {highlightMatch(log.originalLine, query)}
            </div>
        </div>
    );
});

export const SearchPanel: React.FC = () => {
    const {
        logs,
        searchQuery,
        setSearchQuery,
        setSearchPanelOpen,
        setFocusedLogId,
        setSelectedRange
    } = useLogStore();

    const [inputValue, setInputValue] = useState(searchQuery);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Sync input with store
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    // Debounced search - longer delay for better performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(inputValue);
            setSearchQuery(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue, setSearchQuery]);

    // Search results with limit
    const searchResults = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        const query = debouncedQuery.toLowerCase();
        const results: LogEntry[] = [];

        // Early exit when we have enough results
        for (const log of logs) {
            if (results.length >= MAX_RESULTS) break;
            if (log.originalLine.toLowerCase().includes(query) ||
                log.message.toLowerCase().includes(query)) {
                results.push(log);
            }
        }
        return results;
    }, [logs, debouncedQuery]);

    const totalMatches = useMemo(() => {
        if (!debouncedQuery.trim()) return 0;
        const query = debouncedQuery.toLowerCase();
        let count = 0;
        for (const log of logs) {
            if (log.originalLine.toLowerCase().includes(query) ||
                log.message.toLowerCase().includes(query)) {
                count++;
            }
        }
        return count;
    }, [logs, debouncedQuery]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    const handleClose = useCallback(() => {
        setSearchPanelOpen(false);
        setSearchQuery('');
        setFocusedLogId(null);
    }, [setSearchPanelOpen, setSearchQuery, setFocusedLogId]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    }, [handleClose]);

    const handleResultClick = useCallback((log: LogEntry) => {
        setSelectedRange(null);
        setFocusedLogId(log.id);
    }, [setSelectedRange, setFocusedLogId]);

    const isSearching = inputValue !== debouncedQuery;

    return (
        <div className="h-full flex flex-col bg-[#252526] border-l border-zinc-700">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
                <svg
                    className="w-4 h-4 text-zinc-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="搜索日志..."
                    className="flex-1 bg-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-500 px-3 py-1.5 rounded border border-zinc-700 focus:border-zinc-500 focus:outline-none"
                />
                <button
                    onClick={handleClose}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="关闭 (Esc)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Results count */}
            <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-800">
                {isSearching ? (
                    '搜索中...'
                ) : debouncedQuery.trim() ? (
                    totalMatches > MAX_RESULTS
                        ? `显示前 ${MAX_RESULTS} 条结果 (共 ${totalMatches} 条)`
                        : `找到 ${totalMatches} 条结果`
                ) : (
                    '输入关键词搜索'
                )}
            </div>

            {/* Results list with virtualization */}
            <div className="flex-1 min-h-0">
                {searchResults.length > 0 ? (
                    <Virtuoso
                        data={searchResults}
                        itemContent={(_index, log) => (
                            <SearchResultItem
                                log={log}
                                query={debouncedQuery}
                                onClick={handleResultClick}
                            />
                        )}
                    />
                ) : debouncedQuery.trim() && !isSearching ? (
                    <div className="px-3 py-8 text-center text-zinc-500 text-sm">
                        没有找到匹配的日志
                    </div>
                ) : null}
            </div>
        </div>
    );
};
