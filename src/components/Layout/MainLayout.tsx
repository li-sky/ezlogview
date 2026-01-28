import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { LogList } from '../Console/LogList';
import { TimelineContainer } from '../Timeline/TimelineContainer';

export const MainLayout: React.FC = () => {
    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            <Group orientation="vertical">
                {/* Top Pane: Log Console */}
                <Panel defaultSize={70} minSize={30} className="flex flex-col">
                    <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-zinc-700 h-10 shrink-0">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Log Console</span>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <LogList />
                    </div>
                </Panel>

                <Separator className="h-2 bg-[#1e1e1e] hover:bg-[#007fd4] transition-colors border-y border-zinc-800 flex items-center justify-center cursor-ns-resize z-10 w-full">
                    <div className="w-8 h-1 rounded-full bg-zinc-600" />
                </Separator>

                {/* Bottom Pane: Timeline */}
                <Panel defaultSize={30} minSize={10}>
                    <TimelineContainer />
                </Panel>
            </Group>
        </div>
    );
};
