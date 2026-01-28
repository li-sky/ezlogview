import React, { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useLogStore } from '../../store/useLogStore';
import { LogRow } from './LogRow';

export const LogList: React.FC = () => {
    const { logs, dataZoomRange, searchQuery, focusedLogId, setFocusedLogId } = useLogStore();
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Don't filter logs, just show all logs
    const displayedLogs = logs;

    // Determine which logs should be dimmed based on dataZoom range (chart filter)
    const isDimmed = (log: typeof logs[0]) => {
        if (!dataZoomRange) return false;
        const [start, end] = dataZoomRange;
        return log.timestamp < start || log.timestamp > end;
    };



    // Scroll to focused log when it changes
    useEffect(() => {
        if (focusedLogId !== null && virtuosoRef.current) {
            // Find the index of the focused log in filteredLogs
            const index = displayedLogs.findIndex(log => log.id === focusedLogId);
            if (index !== -1) {
                virtuosoRef.current.scrollToIndex({
                    index,
                    align: 'center',
                    behavior: 'smooth'
                });

                // Clear the focused log after a delay to allow re-focus on same log
                setTimeout(() => {
                    setFocusedLogId(null);
                }, 2000);
            }
        }
    }, [focusedLogId, displayedLogs, setFocusedLogId]);

    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            <Virtuoso
                ref={virtuosoRef}
                data={displayedLogs}
                totalCount={displayedLogs.length}
                itemContent={(_index, log) => {
                    const isFocused = log.id === focusedLogId;
                    return <LogRow log={log} isDimmed={isDimmed(log)} searchQuery={searchQuery} isFocused={isFocused} />;
                }}
            // Optional: Follow output behavior if needed, but for analysis usually static top
            // followOutput={...} 
            />
        </div>
    );
};
