import React from 'react';
import { TimelineChart } from './TimelineChart';
import { GranularitySwitch } from './GranularitySwitch';

export const TimelineContainer: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-700 h-10 shrink-0">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timeline</span>
                <GranularitySwitch />
            </div>
            <div className="flex-1 min-h-0 w-full relative">
                <TimelineChart />
            </div>
        </div>
    );
};
