import React, { useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
// import * as echarts from 'echarts'; // unused
import { useLogStore } from '../../store/useLogStore';
import { aggregateLogs, getEffectiveInterval } from '../../utils/aggregator';
import type { ECClickEvent } from '../../types';

export const TimelineChart: React.FC = () => {
    const { logs, startTime, endTime, setSelectedRange, granularity, setFocusedLogId, setDataZoomRange, dataZoomRange } = useLogStore();

    const aggregatedData = useMemo(() => {
        return aggregateLogs(logs, granularity, startTime, endTime);
    }, [logs, granularity, startTime, endTime]);

    const chartRef = useRef<ReactECharts>(null);

    // Track last range to prevent infinite loops
    const lastRangeRef = useRef<[number, number] | null>(null);

    const option = useMemo(() => {
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#252526',
                textStyle: { color: '#fff' },
                borderWidth: 0,
            },
            grid: {
                left: '2%',
                right: '2%',
                bottom: '15%',
                top: '5%',
                containLabel: true,
            },
            legend: {
                data: ['Error', 'Warning', 'Info'],
                textStyle: { color: '#ccc' },
                top: 0,
            },
            xAxis: {
                type: 'time',
                axisLine: { lineStyle: { color: '#555' } },
                axisLabel: { color: '#aaa' },
                splitLine: { show: false },
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#aaa' },
                splitLine: { lineStyle: { color: '#333' } },
            },
            toolbox: {
                show: false
            },
            brush: {
                xAxisIndex: 0,
                brushType: 'lineX',
                brushMode: 'single',
                transformable: true,
                brushStyle: {
                    borderWidth: 1,
                    color: 'rgba(0, 122, 204, 0.15)',
                    borderColor: '#007acc'
                },
                removeOnClick: false,
                throttleType: 'debounce',
                throttleDelay: 300,
                inBrush: {
                    opacity: 1
                },
                outOfBrush: {
                    opacity: 0.3
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    startValue: dataZoomRange ? dataZoomRange[0] : undefined,
                    endValue: dataZoomRange ? dataZoomRange[1] : undefined,
                    start: dataZoomRange ? undefined : 0,
                    end: dataZoomRange ? undefined : 100,
                    backgroundColor: '#1e1e1e',
                    fillerColor: 'rgba(0, 127, 212, 0.1)',
                    borderColor: '#444',
                    height: 30,
                    bottom: 5,
                    textStyle: { color: '#aaa' },
                },
                {
                    type: 'inside', // Allow drag/zoom inside grid
                    xAxisIndex: [0],
                    startValue: dataZoomRange ? dataZoomRange[0] : undefined,
                    endValue: dataZoomRange ? dataZoomRange[1] : undefined,
                    start: dataZoomRange ? undefined : 0,
                    end: dataZoomRange ? undefined : 100,
                }
            ],
            series: [
                {
                    name: 'Error',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: { color: '#f48771' },
                    data: aggregatedData.map(b => [b.timestamp, b.error]),
                    large: true, // Optim for many bars
                },
                {
                    name: 'Warning',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: { color: '#cca700' },
                    data: aggregatedData.map(b => [b.timestamp, b.warn]),
                    large: true,
                },
                {
                    name: 'Info',
                    type: 'bar',
                    stack: 'total',
                    itemStyle: { color: '#75beff' },
                    data: aggregatedData.map(b => [b.timestamp, b.info]),
                    large: true,
                }
            ],
            animation: false, // Performance
        };
    }, [aggregatedData, dataZoomRange]);



    const onEvents = useMemo(() => ({
        'click': (params: ECClickEvent) => {
            if (params.componentType === 'series' && Array.isArray(params.value) && params.value.length === 2) {
                const bucketStart = params.value[0] as number;
                const interval = getEffectiveInterval(granularity, startTime, endTime);
                const bucketEnd = bucketStart + interval;
                const newRange: [number, number] = [bucketStart, bucketEnd];

                // Get current dataZoom range from chart
                const chart = chartRef.current?.getEchartsInstance();
                if (!chart) return;

                const option = chart.getOption() as { dataZoom: { startValue?: number; endValue?: number }[] };
                const dz = option.dataZoom[0];
                const currentStart = dz.startValue;
                const currentEnd = dz.endValue;

                if (currentStart == null || currentEnd == null) return;

                const zoomStart = typeof currentStart === 'number' ? currentStart : new Date(currentStart).getTime();
                const zoomEnd = typeof currentEnd === 'number' ? currentEnd : new Date(currentEnd).getTime();

                // Check if clicked bucket is within current zoom range
                const isInRange = bucketStart >= zoomStart && bucketEnd <= zoomEnd;

                // Update selected range for highlighting
                lastRangeRef.current = newRange;
                setSelectedRange(newRange);

                // Find and scroll to first log in clicked time range
                const firstLogInRange = logs.find(log =>
                    log.timestamp >= bucketStart && log.timestamp <= bucketEnd
                );

                if (firstLogInRange) {
                    setFocusedLogId(firstLogInRange.id);
                }

                // If clicked bucket is outside zoom range, adjust zoom to center it
                if (!isInRange) {
                    const zoomRangeSize = zoomEnd - zoomStart;
                    let newZoomStart = bucketStart - zoomRangeSize / 2;
                    let newZoomEnd = bucketEnd + zoomRangeSize / 2;

                    // Ensure we don't go beyond the global time range
                    if (newZoomStart < startTime) {
                        newZoomStart = startTime;
                        newZoomEnd = Math.min(startTime + zoomRangeSize, endTime);
                    }
                    if (newZoomEnd > endTime) {
                        newZoomEnd = endTime;
                        newZoomStart = Math.max(endTime - zoomRangeSize, startTime);
                    }

                    // Update chart zoom
                    chart.dispatchAction({
                        type: 'dataZoom',
                        startValue: newZoomStart,
                        endValue: newZoomEnd,
                    });

                    // Update store (will be called by dataZoom event too, but setting here for consistency)
                    setDataZoomRange([newZoomStart, newZoomEnd]);
                }
            }
        },
        'dataZoom': () => {
            const chart = chartRef.current?.getEchartsInstance();
            if (!chart) return;

            // Retrieve current option to get zoom state
            const option = chart.getOption() as { dataZoom: { startValue?: number; endValue?: number }[] };
            const dz = option.dataZoom[0];
            const start = dz.startValue;
            const end = dz.endValue;

            if (start == null || end == null) return;

            const s = typeof start === 'number' ? start : new Date(start).getTime();
            const e = typeof end === 'number' ? end : new Date(end).getTime();

            // Update dataZoom range in store
            setDataZoomRange([s, e]);

            // Find and scroll to the first log in the new zoom range
            const firstLogInRange = logs.find(log =>
                log.timestamp >= s && log.timestamp <= e
            );

            if (firstLogInRange) {
                setFocusedLogId(firstLogInRange.id);
            }
        },
        'brushEnd': (params: any) => {
            const chart = chartRef.current?.getEchartsInstance();
            if (!chart) return;

            // Get brush areas
            const brushAreas = params.areas;
            if (!brushAreas || brushAreas.length === 0) return;

            // Get the first brush area (we only allow single brush)
            const area = brushAreas[0];

            // coordRange contains [startTime, endTime] for lineX brush
            if (area.coordRange && area.coordRange.length === 2) {
                let brushStart = area.coordRange[0];
                let brushEnd = area.coordRange[1];

                // Ensure values are numbers
                brushStart = typeof brushStart === 'number' ? brushStart : new Date(brushStart).getTime();
                brushEnd = typeof brushEnd === 'number' ? brushEnd : new Date(brushEnd).getTime();

                // Apply the brush selection to dataZoom
                chart.dispatchAction({
                    type: 'dataZoom',
                    startValue: brushStart,
                    endValue: brushEnd,
                });

                // Update store
                setDataZoomRange([brushStart, brushEnd]);

                // Clear the brush area after applying (optional, for cleaner UX)
                setTimeout(() => {
                    chart.dispatchAction({
                        type: 'brush',
                        command: 'clear',
                        areas: []
                    });
                }, 100);
            }
        }
    }), [granularity, startTime, endTime, setSelectedRange, logs, setFocusedLogId, setDataZoomRange]);

    const activateBrush = () => {
        const chart = chartRef.current?.getEchartsInstance();
        if (chart) {
            chart.dispatchAction({
                type: 'takeGlobalCursor',
                key: 'brush',
                brushOption: {
                    brushType: 'lineX',
                    brushMode: 'single'
                }
            });
        }
    };

    const onChartReady = (_chart: any) => {
        activateBrush();
    };

    // Re-activate brush when option changes (e.g. granularity change causes re-render)
    useEffect(() => {
        activateBrush();
    }, [option]);

    return (
        <div className="w-full h-full bg-[#1e1e1e]">
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                onEvents={onEvents} // Attach events
                onChartReady={onChartReady}
            />
        </div>
    );
};
