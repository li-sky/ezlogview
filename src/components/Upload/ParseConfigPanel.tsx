import React, { useMemo, useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { parseLogs, PARSING_PRESETS } from '../../utils/parser';
import type { ParsingRule } from '../../types';

const PREVIEW_LINE_LIMIT = 200;
const PREVIEW_LOG_LIMIT = 50;

export const ParseConfigPanel: React.FC = () => {
    const { rawContent, pendingFileName, setLogs, clearRawContent, setParsing, setParseConfigOpen, fileName } = useLogStore();
    const [selectedPresetId, setSelectedPresetId] = useState(PARSING_PRESETS[0]?.id ?? '');
    const [useCustomRegex, setUseCustomRegex] = useState(false);
    const [customPattern, setCustomPattern] = useState(PARSING_PRESETS[0]?.rule.regex.source ?? '');
    const [customFlags, setCustomFlags] = useState(PARSING_PRESETS[0]?.rule.regex.flags ?? '');
    const [timestampGroup, setTimestampGroup] = useState(String(PARSING_PRESETS[0]?.rule.timestampGroup ?? 'timestamp'));
    const [timestampFormats, setTimestampFormats] = useState((PARSING_PRESETS[0]?.rule.timestampFormats ?? []).join(', '));
    const [levelGroup, setLevelGroup] = useState(String(PARSING_PRESETS[0]?.rule.levelGroup ?? 'level'));
    const [messageGroup, setMessageGroup] = useState(String(PARSING_PRESETS[0]?.rule.messageGroup ?? 'message'));
    const [applyError, setApplyError] = useState<string | null>(null);

    const selectedPreset = useMemo(() => {
        return PARSING_PRESETS.find(preset => preset.id === selectedPresetId) ?? PARSING_PRESETS[0];
    }, [selectedPresetId]);

    const previewContent = useMemo(() => {
        if (!rawContent) return '';
        return rawContent.split(/\r?\n/).slice(0, PREVIEW_LINE_LIMIT).join('\n');
    }, [rawContent]);

    const { activeRule, ruleError } = useMemo(() => {
        if (!useCustomRegex) {
            return { activeRule: selectedPreset?.rule, ruleError: null as string | null };
        }

        try {
            const regex = new RegExp(customPattern, customFlags);
            const rule: ParsingRule = {
                regex,
                timestampGroup: timestampGroup.trim(),
                timestampFormats: timestampFormats
                    .split(/[\n,]+/)
                    .map(value => value.trim())
                    .filter(Boolean),
                levelGroup: levelGroup.trim() || undefined,
                messageGroup: messageGroup.trim() || undefined,
            };
            return { activeRule: rule, ruleError: null };
        } catch (err) {
            return { activeRule: undefined, ruleError: err instanceof Error ? err.message : 'Invalid regex' };
        }
    }, [useCustomRegex, selectedPreset, customPattern, customFlags, timestampGroup, timestampFormats, levelGroup, messageGroup]);

    const previewLogs = useMemo(() => {
        if (!previewContent || !activeRule || ruleError) return [];
        try {
            return parseLogs(previewContent, activeRule, { sort: false }).slice(0, PREVIEW_LOG_LIMIT);
        } catch {
            return [];
        }
    }, [previewContent, activeRule, ruleError]);

    const handlePresetChange = (presetId: string) => {
        setSelectedPresetId(presetId);
        const preset = PARSING_PRESETS.find(item => item.id === presetId);
        if (preset) {
            setCustomPattern(preset.rule.regex.source);
            setCustomFlags(preset.rule.regex.flags);
            setTimestampGroup(String(preset.rule.timestampGroup ?? 'timestamp'));
            setTimestampFormats((preset.rule.timestampFormats ?? []).join(', '));
            setLevelGroup(String(preset.rule.levelGroup ?? 'level'));
            setMessageGroup(String(preset.rule.messageGroup ?? 'message'));
        }
    };

    const handleApply = () => {
        if (!rawContent || !activeRule) return;
        setApplyError(null);
        setParsing(true);
        setTimeout(() => {
            try {
                const logs = parseLogs(rawContent, activeRule, { sort: true });
                if (logs.length === 0) {
                    setApplyError('未匹配到任何日志，请检查正则与分组配置。');
                } else {
                    setLogs(logs, pendingFileName ?? 'log');
                    setParseConfigOpen(false);
                }
            } catch (err) {
                setApplyError(err instanceof Error ? err.message : '解析失败');
            } finally {
                setParsing(false);
            }
        }, 10);
    };

    const handleCancel = () => {
        setApplyError(null);
        if (!fileName) {
            clearRawContent();
        } else {
            setParseConfigOpen(false);
        }
    };

    if (!rawContent) return null;

    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-zinc-300">
            <div className="h-12 border-b border-zinc-800 flex items-center px-4 bg-[#252526] shrink-0 gap-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">解析配置</span>
                {pendingFileName && (
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                        {pendingFileName}
                    </span>
                )}
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleCancel}
                        className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleApply}
                        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-400"
                    >
                        应用解析
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
                <div className="flex flex-col min-h-0 gap-4">
                    <div className="bg-[#252526] border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-zinc-200">解析规则</span>
                            <label className="flex items-center gap-2 text-xs text-zinc-400">
                                <input
                                    type="checkbox"
                                    checked={useCustomRegex}
                                    onChange={(e) => setUseCustomRegex(e.target.checked)}
                                    className="accent-blue-500"
                                />
                                使用自定义正则
                            </label>
                        </div>

                        {!useCustomRegex && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400">预置方案</label>
                                    <select
                                        value={selectedPresetId}
                                        onChange={(e) => handlePresetChange(e.target.value)}
                                        className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                    >
                                        {PARSING_PRESETS.map(preset => (
                                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-xs text-zinc-400">
                                    {selectedPreset?.description}
                                </div>
                                {selectedPreset?.example && (
                                    <div className="text-xs text-zinc-500">示例：{selectedPreset.example}</div>
                                )}
                                <div>
                                    <label className="text-xs text-zinc-400">正则（只读）</label>
                                    <textarea
                                        value={`/${selectedPreset?.rule.regex.source ?? ''}/${selectedPreset?.rule.regex.flags ?? ''}`}
                                        readOnly
                                        className="w-full mt-1 h-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400">时间格式（date-fns）</label>
                                    <textarea
                                        value={(selectedPreset?.rule.timestampFormats ?? []).join('\n')}
                                        readOnly
                                        className="w-full mt-1 h-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                        placeholder="yyyy-MM-dd HH:mm:ss"
                                    />
                                </div>
                            </div>
                        )}

                        {useCustomRegex && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400">正则表达式</label>
                                    <input
                                        value={customPattern}
                                        onChange={(e) => setCustomPattern(e.target.value)}
                                        className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                        placeholder="^(?<timestamp>...)\s+(?<level>...)\s+(?<message>.*)$"
                                    />
                                    <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                                        推荐使用命名捕获组：(?&lt;timestamp&gt;...)(?&lt;level&gt;...)(?&lt;message&gt;...)
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400">Flags（可选）</label>
                                    <input
                                        value={customFlags}
                                        onChange={(e) => setCustomFlags(e.target.value)}
                                        className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                        placeholder="i"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400">时间格式（date-fns，逗号或换行分隔）</label>
                                    <textarea
                                        value={timestampFormats}
                                        onChange={(e) => setTimestampFormats(e.target.value)}
                                        className="w-full mt-1 h-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                                        placeholder="yyyy-MM-dd HH:mm:ss.SSS, yyyy-MM-dd HH:mm:ss"
                                    />
                                    <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                                        例：<code className="text-zinc-300">yyyy-MM-dd HH:mm:ss.SSS</code> 或 <code className="text-zinc-300">dd/MM/yyyy</code>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-zinc-400">timestamp 分组</label>
                                        <input
                                            value={timestampGroup}
                                            onChange={(e) => setTimestampGroup(e.target.value)}
                                            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                            placeholder="timestamp"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-400">level 分组</label>
                                        <input
                                            value={levelGroup}
                                            onChange={(e) => setLevelGroup(e.target.value)}
                                            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                            placeholder="level"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-400">message 分组</label>
                                        <input
                                            value={messageGroup}
                                            onChange={(e) => setMessageGroup(e.target.value)}
                                            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                                            placeholder="message"
                                        />
                                    </div>
                                </div>
                                <div className="text-[11px] text-zinc-500 leading-relaxed">
                                    分组支持“名称”或“序号”。例如：timestamp 或 1。未填写 level/message 时会自动从原始行推断级别。
                                </div>
                                <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 leading-relaxed">
                                    <div className="font-semibold text-zinc-300 mb-1">常用正则片段提示</div>
                                    <div>
                                        日期时间：<code className="text-zinc-300">{'\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?'}</code>
                                    </div>
                                    <div>级别：<code className="text-zinc-300">ERROR|WARN|INFO|DEBUG|TRACE</code></div>
                                    <div>分隔符：<code className="text-zinc-300">{'\\s+'}</code> 或 <code className="text-zinc-300">{'\\s*\\|\\s*'}</code></div>
                                    <div className="mt-1">
                                        示例：<code className="text-zinc-300">{'^(?<timestamp>...)\\s+(?<level>...)\\s+(?<message>.*)$'}</code>
                                    </div>
                                </div>
                            </div>
                        )}

                        {ruleError && (
                            <div className="mt-3 text-xs text-red-400">正则错误：{ruleError}</div>
                        )}
                        {applyError && (
                            <div className="mt-3 text-xs text-red-400">{applyError}</div>
                        )}
                    </div>

                    <div className="bg-[#252526] border border-zinc-800 rounded-lg p-4 flex-1 min-h-0">
                        <div className="text-xs text-zinc-400 mb-2">原始内容预览（前 {PREVIEW_LINE_LIMIT} 行）</div>
                        <pre className="text-xs text-zinc-400 whitespace-pre-wrap overflow-auto h-full">
                            {previewContent || '（无内容）'}
                        </pre>
                    </div>
                </div>

                <div className="bg-[#252526] border border-zinc-800 rounded-lg p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-zinc-200">解析预览</span>
                        <span className="text-xs text-zinc-500">显示 {PREVIEW_LOG_LIMIT} 条结果</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {previewLogs.length === 0 ? (
                            <div className="text-xs text-zinc-500">暂无可预览的解析结果。</div>
                        ) : (
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="sticky top-0 bg-[#252526]">
                                    <tr className="text-zinc-400">
                                        <th className="py-1 pr-3">时间</th>
                                        <th className="py-1 pr-3">级别</th>
                                        <th className="py-1">内容</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-zinc-800/60">
                                            <td className="py-1 pr-3 whitespace-nowrap text-zinc-400">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                            </td>
                                            <td className="py-1 pr-3 whitespace-nowrap">
                                                {log.level}
                                            </td>
                                            <td className="py-1 text-zinc-300 whitespace-pre-wrap break-all">
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
