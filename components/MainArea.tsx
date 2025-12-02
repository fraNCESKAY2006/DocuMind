import React from 'react';
import { LocalDocument } from '../types';
import { Icons } from './Icons';

interface MainAreaProps {
  document: LocalDocument | null;
  onDrop: (file: File) => void;
  onAddClick: () => void;
  onOpenMenu: () => void;
  onOpenTools: () => void;
}

const MainArea: React.FC<MainAreaProps> = ({ 
  document, 
  onDrop, 
  onAddClick,
  onOpenMenu,
  onOpenTools
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDrop(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 flex flex-col h-full overflow-hidden relative">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <Icons.Menu size={24} />
        </button>
        <span className="font-bold text-white text-lg"><span className="text-blue-500">Docu</span>Mind</span>
        <button onClick={onOpenTools} className="p-2 -mr-2 text-slate-400 hover:text-white">
          <Icons.Sparkles size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!document ? (
          <div 
            className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div 
              className={`
                w-full max-w-2xl min-h-[300px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300
                ${isDragging 
                  ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' 
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                }
              `}
            >
              <div className="bg-slate-800 p-4 rounded-full mb-6">
                <Icons.AddFile size={48} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Drag & drop files here</h2>
              <p className="text-slate-400 mb-6">or click to browse</p>
              <button 
                onClick={onAddClick}
                className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Browse files
              </button>
              <p className="mt-8 text-xs text-slate-600 uppercase tracking-wide">
                Supports: PDF, TXT, MD, JSON, Images
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Document Header (visible on mobile too, but stacked) */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 md:px-8 bg-slate-900/95 backdrop-blur shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                   <Icons.File className="text-blue-500" size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-medium text-sm truncate">{document.name}</h2>
                  <p className="text-xs text-slate-500 truncate">{(document.size / 1024).toFixed(1)} KB • {document.type}</p>
                </div>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-900">
              <div className="max-w-4xl mx-auto bg-slate-800 shadow-xl min-h-full rounded-lg overflow-hidden border border-slate-700/50">
                {document.type.startsWith('image/') ? (
                  <div className="flex items-center justify-center p-4 bg-slate-950/30 h-full">
                    <img src={document.content} alt="Preview" className="max-w-full max-h-[800px] object-contain rounded" />
                  </div>
                ) : (
                  <div className="p-6 md:p-10">
                    {document.text ? (
                      <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {document.text}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                        <Icons.File size={64} className="mb-4 opacity-50" />
                        <p>Preview not available for this file type.</p>
                        <p className="text-sm mt-2">AI analysis is still available.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainArea;