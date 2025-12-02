import React, { useState, useRef, useCallback } from 'react';
import { LocalDocument, ToolType, AnalysisResult } from './types';
import LeftSidebar from './components/LeftSidebar';
import MainArea from './components/MainArea';
import RightPanel from './components/RightPanel';
import { analyzeDocument } from './services/geminiService';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocument = documents.find(d => d.id === selectedDocId) || null;

  const handleFileProcess = useCallback(async (file: File) => {
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Attempt to extract text for preview if it's a text file
      let textContent = '';
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          textContent = te.target?.result as string;
          addDocumentToList(file, result, textContent);
        };
        textReader.readAsText(file);
      } else {
        // Image or PDF
        addDocumentToList(file, result, undefined);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const addDocumentToList = (file: File, content: string, text?: string) => {
    const newDoc: LocalDocument = {
      id: generateId(),
      name: file.name,
      type: file.type || 'application/unknown',
      size: file.size,
      content: content,
      text: text,
      timestamp: Date.now()
    };
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
    // Reset value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunTool = async (tool: ToolType, customQuery?: string) => {
    if (!selectedDocument) return;

    setCurrentResult({
      tool,
      content: '',
      isLoading: true
    });

    try {
      const responseText = await analyzeDocument(selectedDocument, tool, customQuery);
      setCurrentResult({
        tool,
        content: responseText,
        isLoading: false
      });
    } catch (error: any) {
      setCurrentResult({
        tool,
        content: '',
        isLoading: false,
        error: error.message || 'An error occurred during analysis.'
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept=".pdf,.txt,.md,.json,.js,.ts,.tsx,.csv,.html,.css,image/*" 
      />

      <LeftSidebar 
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDoc={setSelectedDocId}
        onAddClick={handleAddClick}
      />

      <MainArea 
        document={selectedDocument}
        onDrop={handleFileProcess}
        onAddClick={handleAddClick}
      />

      <RightPanel 
        document={selectedDocument}
        onRunTool={handleRunTool}
        currentResult={currentResult}
      />
    </div>
  );
};

export default App;