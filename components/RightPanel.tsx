import React, { useState, useEffect, useRef } from 'react';
import { LocalDocument, ToolType, AnalysisResult } from '../types';
import { Icons } from './Icons';

interface RightPanelProps {
  document: LocalDocument | null;
  onRunTool: (tool: ToolType, customQuery?: string) => Promise<void>;
  currentResult: AnalysisResult | null;
}

const tools = [
  { id: ToolType.SUMMARY, label: 'Summary', icon: Icons.Summary, desc: 'Summarize content' },
  { id: ToolType.KEYWORDS, label: 'Keywords', icon: Icons.Keywords, desc: 'Extract topics' },
  { id: ToolType.CITATION, label: 'Citation', icon: Icons.Citation, desc: 'Generate citations' },
  { id: ToolType.INSIGHTS, label: 'Insights', icon: Icons.Insights, desc: 'Deep analysis' },
  { id: ToolType.WRITER, label: 'Writer', icon: Icons.Writer, desc: 'Generate text' },
  { id: ToolType.QA, label: 'Qa', icon: Icons.Qa, desc: 'Ask questions' },
];

const RightPanel: React.FC<RightPanelProps> = ({ document, onRunTool, currentResult }) => {
  const [qaInput, setQaInput] = useState('');
  const [showQaInput, setShowQaInput] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto scroll to result when it updates
  useEffect(() => {
    if (currentResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentResult]);

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === ToolType.QA) {
      setShowQaInput(true);
      if (!currentResult || currentResult.tool !== ToolType.QA) {
         // Reset result if switching to QA first time
      }
    } else {
      setShowQaInput(false);
      onRunTool(toolId);
    }
  };

  const handleQaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qaInput.trim()) {
      onRunTool(ToolType.QA, qaInput);
      setQaInput('');
    }
  };

  return (
    <div className="w-[450px] bg-slate-950 border-l border-slate-800 flex flex-col h-full shrink-0 z-20">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white mb-1">AI Toolkit</h2>
        <p className="text-xs text-slate-500">Select a tool to analyze the document.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {!document ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 opacity-60">
             <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
               <Icons.Insights size={24} />
             </div>
             <p className="text-sm max-w-[200px]">Add or select a document to activate AI tools.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tool Grid */}
            <div className="grid grid-cols-3 gap-3">
              {tools.map((tool) => {
                const isActive = currentResult?.tool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 aspect-square group
                      ${isActive 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
                      }
                    `}
                  >
                    <tool.icon size={20} className={`mb-2 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                    <span className="text-[10px] font-medium tracking-wide">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* QA Input Area */}
            {showQaInput && (
              <form onSubmit={handleQaSubmit} className="relative">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question about this document..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-10 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!qaInput.trim() || currentResult?.isLoading}
                  className="absolute right-2 top-2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors disabled:opacity-50"
                >
                  <Icons.ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Results Area */}
            {currentResult && (
              <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    {currentResult.isLoading ? (
                      <Icons.Spinner size={14} className="animate-spin text-blue-500" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    )}
                    {tools.find(t => t.id === currentResult.tool)?.label} Result
                  </h3>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 text-sm text-slate-300 leading-relaxed shadow-inner min-h-[100px]">
                  {currentResult.isLoading ? (
                    <div className="space-y-2 opacity-50 animate-pulse">
                      <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-700 rounded w-full"></div>
                      <div className="h-2 bg-slate-700 rounded w-5/6"></div>
                    </div>
                  ) : currentResult.error ? (
                    <div className="text-red-400 bg-red-400/10 p-3 rounded border border-red-400/20">
                      Error: {currentResult.error}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap markdown-content">
                      {currentResult.content}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;