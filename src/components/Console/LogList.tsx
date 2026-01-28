import React, { useEffect, useRef, useMemo } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useLogStore } from '../../store/useLogStore';
import { LogRow } from './LogRow';

export const LogList: React.FC = () => {
    const { logs, selectedRange } = useLogStore();
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Filter logs based on selected time range
    const filteredLogs = useMemo(() => {
        if (!selectedRange) return logs;
        const [start, end] = selectedRange;
        return logs.filter(log => log.timestamp >= start && log.timestamp <= end);
    }, [logs, selectedRange]);

    // Auto-scroll to top when selection changes
    useEffect(() => {
        if (selectedRange && virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: 0,
                align: 'start',
                behavior: 'auto'
            });
        }
    }, [selectedRange]);

    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            <Virtuoso
                ref={virtuosoRef}
                data={filteredLogs}
                totalCount={filteredLogs.length}
                itemContent={(_index, log) => {
                    return <LogRow log={log} isDimmed={false} />;
                }}
            // Optional: Follow output behavior if needed, but for analysis usually static top
            // followOutput={...} 
            />
        </div>
    );
};
