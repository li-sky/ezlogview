import React, { useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
// import * as echarts from 'echarts'; // unused
import { useLogStore } from '../../store/useLogStore';
import { aggregateLogs, getEffectiveInterval } from '../../utils/aggregator';

export const TimelineChart: React.FC = () => {
    const { logs, startTime, endTime, setSelectedRange, granularity } = useLogStore();

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
    useEffect(() => {
        const chart = chartRef.current?.getEchartsInstance();
        if (!chart) return;

        const handleZoom = () => {
            const option = chart.getOption() as any;
            // The startValue and endValue might be indices or values depending on setup.
            // For type 'time', they should be timestamps or string dates.
            const dz = option.dataZoom[0];
            let start = dz.startValue;
            let end = dz.endValue;

            // If not set, use start/end percent to calculate
            if (start === undefined || end === undefined) {
                // Fallback calculation not easy without total range.
                // But usually startValue/endValue are updated.
                return;
            }

            // ECharts internally might return Date objects or timestamps
            const s = typeof start === 'number' ? start : new Date(start).getTime();
            const e = typeof end === 'number' ? end : new Date(end).getTime();

            setSelectedRange([s, e]);
        };

        chart.on('dataZoom', handleZoom);

        return () => {
            chart.off('dataZoom', handleZoom);
        };
    }, [setSelectedRange]);

    const onEvents = useMemo(() => ({
        'click': (params: any) => {
            if (params.componentType === 'series' && params.value && params.value.length === 2) {
                const bucketStart = params.value[0] as number;
                const interval = getEffectiveInterval(granularity, startTime, endTime);
                // Select the range of this bucket
                setSelectedRange([bucketStart, bucketStart + interval]);
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
