import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { GRAULARITIES } from '../../utils/aggregator';
import clsx from 'clsx';

export const GranularitySwitch: React.FC = () => {
    const { granularity, setGranularity } = useLogStore();

    const options = [
        { label: 'Auto', value: GRAULARITIES.auto },
        { label: '1s', value: GRAULARITIES['1s'] },
        { label: '10s', value: GRAULARITIES['10s'] },
        { label: '1m', value: GRAULARITIES['1m'] },
    ];

    return (
        <div className="flex items-center space-x-1 bg-[#252526] p-1 rounded-lg border border-zinc-700">
            {options.map((opt) => (
                <button
                    key={opt.label}
                    onClick={() => setGranularity(opt.value)}
                    className={clsx(
                        "text-xs px-3 py-1 rounded transition-colors border-none",
                        granularity === opt.value
                            ? "bg-[#007fd4] text-white font-medium"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 bg-transparent"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};
