import React, { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useLogStore } from '../../store/useLogStore';
import { LogRow } from './LogRow';

export const LogList: React.FC = () => {
    const { logs, selectedRange } = useLogStore();
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Binary search to find index of first log >= time
    const findStartIndex = (time: number) => {
        let low = 0;
        let high = logs.length - 1;
        let result = -1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (logs[mid].timestamp >= time) {
                result = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return result;
    };

    // Auto-scroll when selection changes
    useEffect(() => {
        if (selectedRange && virtuosoRef.current) {
            const [start] = selectedRange;
            const index = findStartIndex(start);
            if (index !== -1) {
                virtuosoRef.current.scrollToIndex({
                    index,
                    align: 'start',
                    behavior: 'auto'
                });
            }
        }
    }, [selectedRange, logs]); // Depend on logs in case they change

    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            <Virtuoso
                ref={virtuosoRef}
                data={logs}
                totalCount={logs.length}
                itemContent={(_index, log) => {
                    let isDimmed = false;
                    if (selectedRange) {
                        const [start, end] = selectedRange;
                        // Dim if OUTSIDE range
                        if (log.timestamp < start || log.timestamp > end) {
                            isDimmed = true;
                        }
                    }

                    return <LogRow log={log} isDimmed={isDimmed} />;
                }}
            // Optional: Follow output behavior if needed, but for analysis usually static top
            // followOutput={...} 
            />
        </div>
    );
};
