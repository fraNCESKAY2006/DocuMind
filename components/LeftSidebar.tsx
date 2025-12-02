import React from 'react';
import { LocalDocument } from '../types';
import { Icons } from './Icons';

interface LeftSidebarProps {
  documents: LocalDocument[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onAddClick: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  documents, 
  selectedDocId, 
  onSelectDoc,
  onAddClick,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-64 md:z-20
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <div className="absolute top-4 right-4 md:hidden">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Header */}
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">Docu</span>Mind
          </h1>
        </div>

        {/* Add Button */}
        <div className="px-4 mb-6">
          <button 
            onClick={() => {
              onAddClick();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Icons.Plus size={18} />
            Add Documents
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Workspace Header */}
        <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-sm">
              No documents found
            </div>
          ) : (
            filteredDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => {
                  onSelectDoc(doc.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  selectedDocId === doc.id 
                    ? 'bg-slate-800/80 text-white border border-slate-700/50' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icons.File size={16} className={selectedDocId === doc.id ? 'text-blue-400' : 'text-slate-500'} />
                <div className="truncate text-sm font-medium">
                  {doc.name}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default LeftSidebar;