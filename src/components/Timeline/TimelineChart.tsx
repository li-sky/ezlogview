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

    // Sync store -> Chart (when selectedRange changes externally, e.g. from click)
    useEffect(() => {
        const chart = chartRef.current?.getEchartsInstance();
        if (!chart || !selectedRange) return;

        // Check if we already set this range (avoid loop)
        const last = lastRangeRef.current;
        if (last && last[0] === selectedRange[0] && last[1] === selectedRange[1]) {
            return;
        }

        lastRangeRef.current = selectedRange;
        chart.dispatchAction({
            type: 'dataZoom',
            startValue: selectedRange[0],
            endValue: selectedRange[1]
        });

    }, [selectedRange]);

    const onEvents = useMemo(() => ({
        'click': (params: ECClickEvent) => {
            if (params.componentType === 'series' && Array.isArray(params.value) && params.value.length === 2) {
                const bucketStart = params.value[0] as number;
                const interval = getEffectiveInterval(granularity, startTime, endTime);
                const newRange: [number, number] = [bucketStart, bucketStart + interval];

                // Update ref first to prevent loop
                lastRangeRef.current = newRange;
                setSelectedRange(newRange);

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

            // Check if same as last to prevent loop
            const last = lastRangeRef.current;
            if (last && Math.abs(last[0] - s) < 1 && Math.abs(last[1] - e) < 1) {
                return;
            }

            lastRangeRef.current = [s, e];
            setSelectedRange([s, e]);
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
