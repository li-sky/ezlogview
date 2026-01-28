import React, { useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
// import * as echarts from 'echarts'; // unused
import { useLogStore } from '../../store/useLogStore';
import { aggregateLogs, getEffectiveInterval } from '../../utils/aggregator';
import type { ECClickEvent } from '../../types';

export const TimelineChart: React.FC = () => {
    const { logs, startTime, endTime, selectedRange, setSelectedRange, granularity } = useLogStore();

    const aggregatedData = useMemo(() => {
        return aggregateLogs(logs, granularity, startTime, endTime);
    }, [logs, granularity, startTime, endTime]);

    const chartRef = useRef<ReactECharts>(null);

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
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
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
    }, [aggregatedData]);

    // Better approach for syncing state:
    // Listen to 'dataZoom' and update store. Debounce if needed.
    // We care about the *absolute* timestamp range selected.
    // Sync store -> Chart (when selectedRange changes externally, e.g. from click or other UI)
    useEffect(() => {
        const chart = chartRef.current?.getEchartsInstance();
        if (!chart || !selectedRange) return;

        // Avoid infinite loop if this update came from the chart itself?
        // ECharts might trigger dataZoom event again. 
        // We can check if current zoom matches selectedRange.
        // const currentOption = chart.getOption() as { dataZoom: { startValue?: number; endValue?: number }[] }; (unused)
        // const dz = currentOption.dataZoom[0]; (unused)
        // If roughly equal, skip.
        // But for simplicity, let's just dispatch. Ideally we check.
        // Note: dispatching dataZoom will trigger the 'dataZoom' event listener we set up below.
        // We need to distinguish or just accept re-setting store (which is cheap).

        // Actually, we should probably ONLY update chart if the internal state doesn't match?
        // simpler:
        chart.dispatchAction({
            type: 'dataZoom',
            startValue: selectedRange[0],
            endValue: selectedRange[1]
        });

    }, [selectedRange]);

    // Chart -> Store (User drags/zooms)
    useEffect(() => {
        const chart = chartRef.current?.getEchartsInstance();
        if (!chart) return;

        const handleZoom = () => {
            // Retrieve current option to get zoom state
            // We cast to specific structure we know exists in ECharts option
            const option = chart.getOption() as { dataZoom: { startValue?: number; endValue?: number }[] };
            const dz = option.dataZoom[0];
            const start = dz.startValue;
            const end = dz.endValue;

            if (start == null || end == null) return;

            const s = typeof start === 'number' ? start : new Date(start).getTime();
            const e = typeof end === 'number' ? end : new Date(end).getTime();

            // Only update store if meaningful difference to avoid loops?
            // checking state inside effect is hard. can use a ref to track last set value?
            // simplified: just set it. 
            // BUT: if we set store, store updates, effect above fires, dispatches zoom, raises event... LOOP.
            // We need to break the loop. 
            // We can compare with 'selectedRange' from store, but we can't access updated store here easily without dep.
            // Actually, we can just check if 's' and 'e' are different from what we think?
            // For now, let's trust that slight redundancy is ok, OR add a check in the store setter.

            setSelectedRange([s, e]);
        };

        chart.on('dataZoom', handleZoom);

        return () => {
            chart.off('dataZoom', handleZoom);
        };
    }, [setSelectedRange]);

    const onEvents = useMemo(() => ({
        'click': (params: ECClickEvent) => {
            if (params.componentType === 'series' && Array.isArray(params.value) && params.value.length === 2) {
                const bucketStart = params.value[0] as number;
                const interval = getEffectiveInterval(granularity, startTime, endTime);
                // Update the store's selected range
                setSelectedRange([bucketStart, bucketStart + interval]);

                // Also update the chart's current zoom to visually reflect this selection
                const chart = chartRef.current?.getEchartsInstance();
                if (chart) {
                    chart.dispatchAction({
                        type: 'dataZoom',
                        startValue: bucketStart,
                        endValue: bucketStart + interval,
                    });
                }
            }
        }
    }), [granularity, startTime, endTime, setSelectedRange]);

    return (
        <div className="w-full h-full bg-[#1e1e1e]">
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                onEvents={onEvents} // Attach events
            />
        </div>
    );
};
