import type { LogEntry } from '../types';

export interface TimeBucket {
    timestamp: number; // Start time of this bucket
    error: number;
    warn: number;
    info: number;
}

export const GRAULARITIES = {
    '1s': 1000,
    '10s': 10000,
    '1m': 60000,
    'auto': 0, // Special flag
};

export const getEffectiveInterval = (intervalMs: number, startTime: number, endTime: number): number => {
    if (intervalMs > 0) return intervalMs;
    const duration = endTime - startTime;
    return Math.max(1000, Math.floor(duration / 100)); // Min 1s
};

export const aggregateLogs = (logs: LogEntry[], intervalMs: number, startTime: number, endTime: number): TimeBucket[] => {
    if (logs.length === 0) return [];

    // Calculate effective interval using common logic
    const effectiveInterval = getEffectiveInterval(intervalMs, startTime, endTime);

    // Align start time to interval
    // const alignedStart = Math.floor(startTime / effectiveInterval) * effectiveInterval; (unused)
    // const numBuckets = Math.ceil((endTime - alignedStart) / intervalMs) + 1; // +1 to cover edge (unused variable)

    // Initialize buckets map for sparse or array for dense? 
    // Dense is better for ECharts usually, but if huge gaps, map is better. 
    // However, ECharts time axis handles sparse well if we pass timestamp.
    // But stacked bar often needs aligned data. Let's try dense for now, assume logs are somewhat continuous.
    // If duration is huge, dense array might be too big. 
    // PRD implies "Timeline", usually continuous.

    // Optimization: use Map to store only existing buckets then fill gaps if needed, or just return sparse and let ECharts handle (but stacking requires matching X usually or valid logic).
    // Actually, bar charts in ECharts with time axis can handle sparse data points.

    const bucketMap = new Map<number, TimeBucket>();

    for (const log of logs) {
        if (log.timestamp < startTime || log.timestamp > endTime) continue;

        if (log.timestamp < startTime || log.timestamp > endTime) continue;

        const bucketTime = Math.floor(log.timestamp / effectiveInterval) * effectiveInterval;

        let bucket = bucketMap.get(bucketTime);
        if (!bucket) {
            bucket = { timestamp: bucketTime, error: 0, warn: 0, info: 0 };
            bucketMap.set(bucketTime, bucket);
        }

        if (log.level === 'ERROR') bucket.error++;
        else if (log.level === 'WARN') bucket.warn++;
        else bucket.info++; // INFO, DEBUG, TRACE
    }

    // Convert to array and sort
    const result = Array.from(bucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    return result;
};
