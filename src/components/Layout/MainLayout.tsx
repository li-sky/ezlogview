import React, { useEffect } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { LogList } from '../Console/LogList';
import { TimelineContainer } from '../Timeline/TimelineContainer';
import { SearchPanel } from '../Console/SearchPanel';
import { useLogStore } from '../../store/useLogStore';

// Inner content component for vertical layout
const MainContent: React.FC<{ showSearchButton: boolean; onSearchToggle: () => void }> = ({
    showSearchButton,
    onSearchToggle
}) => (
    <Group orientation="vertical" className="h-full">
        {/* Top Pane: Log Console */}
        <Panel defaultSize={70} minSize={20} id="log-console" className="overflow-hidden" style={{ minWidth: 0 }}>
            <div className="h-full flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-700 h-10 shrink-0 min-w-0">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">Log Console</span>
                    <button
                        onClick={onSearchToggle}
                        className={`text-xs px-2 py-1 rounded border transition-colors shrink-0 ${!showSearchButton
                            ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            }`}
                        title="搜索 (Ctrl+F)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden min-w-0">
                    <LogList />
                </div>
            </div>
        </Panel>

        <Separator
            className="h-2 bg-[#1e1e1e] hover:bg-[#007fd4] transition-colors border-y border-zinc-800 flex items-center justify-center shrink-0"
            style={{ cursor: 'ns-resize' }}
        >
            <div className="w-8 h-1 rounded-full bg-zinc-600 pointer-events-none" />
        </Separator>

        {/* Bottom Pane: Timeline */}
        <Panel defaultSize={30} minSize={10} id="timeline" className="overflow-hidden" style={{ minWidth: 0 }}>
            <div className="h-full min-w-0">
                <TimelineContainer />
            </div>
        </Panel>
    </Group>
);

export const MainLayout: React.FC = () => {
    const { isSearchPanelOpen, setSearchPanelOpen } = useLogStore();

    // Handle Ctrl+F keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setSearchPanelOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSearchPanelOpen]);

    // When search panel is closed, render simple layout without horizontal split
    if (!isSearchPanelOpen) {
        return (
            <div className="h-full w-full bg-[#1e1e1e] overflow-hidden">
                <MainContent
                    showSearchButton={true}
                    onSearchToggle={() => setSearchPanelOpen(true)}
                />
            </div>
        );
    }

    // When search panel is open, use horizontal split
    return (
        <div className="h-full w-full bg-[#1e1e1e] overflow-hidden">
            <Group orientation="horizontal" className="h-full">
                {/* Main content area - use pixel minSize */}
                <Panel
                    defaultSize={65}
                    minSize="200px"
                    id="main-content"
                    className="overflow-hidden"
                    style={{ minWidth: 0 }}
                >
                    <div className="h-full overflow-hidden min-w-0">
                        <MainContent
                            showSearchButton={false}
                            onSearchToggle={() => setSearchPanelOpen(false)}
                        />
                    </div>
                </Panel>

                {/* Horizontal resize handle */}
                <Separator
                    className="w-2 bg-[#1e1e1e] hover:bg-[#007fd4] transition-colors border-x border-zinc-800 flex items-center justify-center shrink-0"
                    style={{ cursor: 'ew-resize' }}
                >
                    <div className="h-8 w-1 rounded-full bg-zinc-600 pointer-events-none" />
                </Separator>

                {/* Search Panel (right side) - use pixel minSize */}
                <Panel
                    defaultSize={35}
                    minSize="150px"
                    id="search-panel"
                    className="overflow-hidden"
                    style={{ minWidth: 0 }}
                >
                    <div className="h-full overflow-hidden min-w-0">
                        <SearchPanel />
                    </div>
                </Panel>
            </Group>
        </div>
    );
};
