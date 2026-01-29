import { useLogStore } from './store/useLogStore';
import { FileUploader } from './components/Upload/FileUploader';
import { MainLayout } from './components/Layout/MainLayout';
import { ParseConfigPanel } from './components/Upload/ParseConfigPanel';

function App() {
  const { fileName, clearLogs, rawContent, isParseConfigOpen } = useLogStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-zinc-300">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800 flex items-center px-4 bg-[#252526] shrink-0">
        <h1 className="text-sm font-bold text-zinc-100 mr-4">EzLogView</h1>
        {fileName && (
          <>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {fileName}
            </span>
            <div className="ml-auto">
              <button
                onClick={clearLogs}
                className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700"
              >
                Close File
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {rawContent && isParseConfigOpen ? (
          <ParseConfigPanel />
        ) : !fileName ? (
          <FileUploader />
        ) : (
          <MainLayout />
        )}
      </main>
    </div>
  );
}

export default App;
