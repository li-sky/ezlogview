import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useLogStore } from '../../store/useLogStore';
import { parseLogs } from '../../utils/parser';

export const FileUploader: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setLogs, setParsing, isParsing } = useLogStore();

    const processFile = useCallback((file: File) => {
        setError(null);
        // file extension check removed as per user request to allow any file
        // if (!file.name.endsWith('.log') && !file.name.endsWith('.txt') && !file.name.endsWith('.csv')) { ... }

        setParsing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                // Run parsing in a microtask or setTimeout to avoid freezing UI immediately if sync
                setTimeout(() => {
                    const logs = parseLogs(content);
                    if (logs.length === 0) {
                        setError('No valid logs found in the file. Check the format.');
                    } else {
                        setLogs(logs, file.name);
                    }
                    setParsing(false);
                }, 10);
            } catch (err) {
                console.error(err);
                setError('Failed to parse file.');
                setParsing(false);
            }
        };

        reader.onerror = () => {
            setError('Error reading file.');
            setParsing(false);
        };

        reader.readAsText(file);
    }, [setLogs, setParsing]);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
            <div
                className={`
          flex flex-col items-center justify-center w-full max-w-2xl h-64
          border-2 border-dashed rounded-xl transition-colors cursor-pointer
          ${isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                    }
        `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".log,.txt,.csv"
                    onChange={onFileChange}
                />

                {isParsing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <FileText className="w-12 h-12 text-blue-400 mb-4" />
                        <p className="text-lg font-medium text-zinc-300">Parsing logs...</p>
                    </div>
                ) : (
                    <>
                        <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <p className="text-lg font-medium text-zinc-300">
                            {isDragging ? 'Drop log file here' : 'Drag & drop log file or click to browse'}
                        </p>
                        <p className="text-sm text-zinc-500 mt-2">
                            Accepts any text file
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-4 flex items-center text-log-error bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
