import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as geminiService from './services/geminiService';
import { Document, SummaryTone, CitationStyle } from './types';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// PDF.js worker setup
// The '?url' import is not standard and can fail. Using a direct CDN link is more robust.
pdfjs.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.5.136/build/pdf.worker.mjs';

// --- ICONS ---
const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconUpload = () => (
  <svg className="w-12 h-12 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
  </svg>
);

const toolIcons: { [key: string]: React.ReactElement } = {
    summary: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>,
    keywords: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>,
    citation: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    insights: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    writer: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
    qa: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};


// --- UI Components ---

// FIX: Explicitly type Button as a React.FC to correctly handle props like `key` and resolve typing issues.
const Button: React.FC<{ onClick?: () => void, children: React.ReactNode, className?: string, disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// FIX: Explicitly type ToolButton as a React.FC to correctly handle props like `key`.
const ToolButton: React.FC<{ label: string, icon: React.ReactElement, onClick: () => void, isActive: boolean }> = ({ label, icon, onClick, isActive }) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 h-20 ${isActive ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-white/10 text-gray-400'}`}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

const ResultDisplay = ({ content, isLoading }: { content: string | React.ReactNode, isLoading: boolean }) => {
    if (isLoading) {
        return <div className="mt-4 p-4 bg-white/5 rounded-lg animate-pulse"><div className="h-20 bg-white/10 rounded"></div></div>;
    }
    if (!content) return null;

    const contentNode = typeof content === 'string'
        ? <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm prose-invert max-w-none prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-headings:mb-4 prose-headings:mt-6">{content}</ReactMarkdown>
        : content;

    return <div className="mt-4 p-4 bg-white/5 rounded-lg max-h-[60vh] overflow-y-auto">{contentNode}</div>;
};


// --- AI Tool Components ---

const SummaryTool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [tone, setTone] = useState<SummaryTone>(SummaryTone.Academic);

    const handleSummarize = useCallback(async () => {
        setIsLoading(true);
        setResult('');
        try {
            const summary = await geminiService.summarizeText(documentText, tone);
            setResult(summary);
        } catch (e) {
            setResult(`Error: ${(e as Error).message}`);
        }
        setIsLoading(false);
    }, [documentText, tone]);

    return (
        <div>
            <h3 className="text-lg font-bold">Document Summary</h3>
            <p className="text-sm text-gray-400 mt-1">Generate a concise overview of the document.</p>
            <div className="mt-4 flex items-center gap-4">
                <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as SummaryTone)}
                    className="flex-grow bg-white/10 border border-white/20 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {Object.values(SummaryTone).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <Button onClick={handleSummarize} disabled={isLoading || !documentText} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? 'Summarizing...' : 'Generate'}
                </Button>
            </div>
            <ResultDisplay content={result} isLoading={isLoading} />
        </div>
    );
};

const KeywordsTool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [keywords, setKeywords] = useState<string[]>([]);

    const handleExtract = useCallback(async () => {
        setIsLoading(true);
        setKeywords([]);
        try {
            const result = await geminiService.extractKeywords(documentText);
            setKeywords(result);
        } catch (e) {
            console.error(e);
            setKeywords([]);
        }
        setIsLoading(false);
    }, [documentText]);

    const keywordContent = useMemo(() => (
        <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => <span key={i} className="bg-teal-500/20 text-teal-300 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
        </div>
    ), [keywords]);


    return (
        <div>
            <h3 className="text-lg font-bold">Keyword Extraction</h3>
            <p className="text-sm text-gray-400 mt-1">Identify key phrases and concepts.</p>
            <div className="mt-4">
                <Button onClick={handleExtract} disabled={isLoading || !documentText} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? 'Extracting...' : 'Extract Keywords'}
                </Button>
            </div>
            <ResultDisplay content={keywords.length > 0 ? keywordContent : ''} isLoading={isLoading} />
        </div>
    );
};

const CitationTool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [style, setStyle] = useState<CitationStyle>(CitationStyle.APA);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setResult('');
        try {
            const citation = await geminiService.generateCitation(documentText, style);
            setResult(citation);
        } catch (e) {
            setResult(`Error: ${(e as Error).message}`);
        }
        setIsLoading(false);
    }, [documentText, style]);

    return (
        <div>
            <h3 className="text-lg font-bold">Citation Generator</h3>
            <p className="text-sm text-gray-400 mt-1">Create citations in various styles.</p>
            <div className="mt-4 flex items-center gap-4">
                <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as CitationStyle)}
                    className="flex-grow bg-white/10 border border-white/20 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {Object.values(CitationStyle).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button onClick={handleGenerate} disabled={isLoading || !documentText} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? 'Generating...' : 'Generate'}
                </Button>
            </div>
            <ResultDisplay content={result} isLoading={isLoading} />
        </div>
    );
};

const InsightsSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-8 bg-white/10 rounded w-1/3"></div>
        </div>
        <div>
            <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
        </div>
    </div>
);

const InsightsTool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<{ readability: string; density: { keyword: string; density: number }[] } | null>(null);

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setInsights(null);
        try {
            const result = await geminiService.getInsights(documentText);
            setInsights(result);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    }, [documentText]);

    const insightsContent = useMemo(() => {
        if (!insights) return null;
        return (
            <div>
                <div className="flex justify-between items-baseline mb-4">
                    <h4 className="font-semibold text-gray-300">Readability Score</h4>
                    <p className="text-lg font-bold text-blue-300">{insights.readability}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Keyword Density</h4>
                    <ul className="space-y-2">
                        {insights.density.map(({ keyword, density }) => (
                            <li key={keyword} className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">{keyword}</span>
                                <span className="font-mono text-gray-200">{density.toFixed(2)}%</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }, [insights]);

    return (
        <div>
            <h3 className="text-lg font-bold">Document Insights</h3>
            <p className="text-sm text-gray-400 mt-1">Get metrics on readability and keywords.</p>
            <div className="mt-4">
                <Button onClick={handleAnalyze} disabled={isLoading || !documentText} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? 'Analyzing...' : 'Analyze Document'}
                </Button>
            </div>
            <div className="mt-4 p-4 bg-white/5 rounded-lg min-h-[100px]">
                {isLoading ? <InsightsSkeleton /> : insightsContent}
            </div>
        </div>
    );
};

const AIWriterTool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState('');
    const [result, setResult] = useState('');

    const handleProcess = useCallback(async (action: 'rewrite' | 'expand' | 'fix' | 'academic') => {
        setIsLoading(action);
        setResult('');
        try {
            const aiResult = await geminiService.processWithAIWriter(documentText, action);
            setResult(aiResult);
        } catch (e) {
            setResult(`Error: ${(e as Error).message}`);
        }
        setIsLoading('');
    }, [documentText]);

    const actions: ('rewrite' | 'expand' | 'fix' | 'academic')[] = ['rewrite', 'expand', 'fix', 'academic'];
    const actionLabels = { rewrite: "Rewrite", expand: "Expand", fix: "Fix Grammar", academic: "Make Academic" };

    return (
        <div>
            <h3 className="text-lg font-bold">AI Writing Assistant</h3>
            <p className="text-sm text-gray-400 mt-1">Improve your text with AI suggestions.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {actions.map(action => (
                    <Button
                        key={action}
                        onClick={() => handleProcess(action)}
                        disabled={!!isLoading || !documentText}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        {isLoading === action ? "Processing..." : actionLabels[action]}
                    </Button>
                ))}
            </div>
            <ResultDisplay content={result} isLoading={!!isLoading} />
        </div>
    );
};

const QATool = ({ documentText }: { documentText: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleAsk = useCallback(async () => {
        if (!question) return;
        setIsLoading(true);
        setAnswer('');
        try {
            const result = await geminiService.answerQuestion(documentText, question);
            setAnswer(result);
        } catch (e) {
            setAnswer(`Error: ${(e as Error).message}`);
        }
        setIsLoading(false);
    }, [documentText, question]);

    return (
        <div>
            <h3 className="text-lg font-bold">Question & Answer</h3>
            <p className="text-sm text-gray-400 mt-1">Ask questions about the document content.</p>
            <div className="mt-4 flex items-center gap-4">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-grow bg-white/10 border border-white/20 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Button onClick={handleAsk} disabled={isLoading || !documentText || !question} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? 'Asking...' : 'Ask'}
                </Button>
            </div>
            <ResultDisplay content={answer} isLoading={isLoading} />
        </div>
    );
};

// --- File Handling ---

const FileUpload = ({ onUpload }: { onUpload: (docs: { name: string, content: string }[]) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(async (files: FileList) => {
        setIsProcessing(true);
        const docs: { name: string, content: string }[] = [];
        for (const file of Array.from(files)) {
            let content = '';
            try {
                 if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        text += textContent.items.map((item: any) => item.str).join(' ');
                    }
                    content = text;
                } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
                    content = await file.text();
                } else {
                    content = `Content of ${file.name} could not be read. Unsupported file type: ${file.type}.`;
                }
            } catch (error) {
                 content = `Error reading ${file.name}: ${(error as Error).message}`;
            }
            docs.push({ name: file.name, content });
        }
        onUpload(docs);
        setIsProcessing(false);
    }, [onUpload]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };
    
    const handleClick = () => fileInputRef.current?.click();

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`w-full max-w-2xl h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors duration-300 cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'}`}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,.txt,.md,.docx" />
                {isProcessing ? (
                     <>
                        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg font-semibold text-gray-300">Processing Documents...</p>
                        <p className="text-sm text-gray-500">Please wait while we analyze your files.</p>
                    </>
                ) : (
                    <>
                        <IconUpload />
                        <p className="mt-4 text-lg font-semibold text-gray-300">Drag & drop files here</p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                        <p className="text-xs text-gray-600 mt-2">Supports: PDF, TXT, MD</p>
                    </>
                )}
            </div>
        </div>
    );
};

// --- Confirmation Modal ---
const ConfirmationModal = ({ document, onConfirm, onCancel }: { document: Document, onConfirm: () => void, onCancel: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
                <p className="mt-2 text-gray-400">Are you sure you want to delete the document <strong className="text-gray-200">"{document.name}"</strong>? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end gap-4">
                    <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white">Cancel</Button>
                    <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP ---

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string>('summary');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<Document | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Splash screen effect
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000); // Show splash for 2 seconds
        return () => clearTimeout(timer);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        setSelectedDocumentId(null);
                        break;
                    case 'w':
                        e.preventDefault();
                        if (selectedDocumentId) {
                            setSelectedDocumentId(null);
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        console.log('Save action triggered (no-op).');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedDocumentId]);

    const selectedDocument = useMemo(() => {
        return documents.find(doc => doc.id === selectedDocumentId) || null;
    }, [documents, selectedDocumentId]);

    const filteredDocuments = useMemo(() => {
        if (!searchTerm) return documents;
        return documents.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [documents, searchTerm]);

    const handleUpload = useCallback((uploadedDocs: { name: string, content: string }[]) => {
        const newDocuments: Document[] = uploadedDocs.map(doc => ({
            id: `doc_${Date.now()}_${Math.random()}`,
            name: doc.name,
            content: doc.content,
            createdAt: new Date(),
        }));
        setDocuments(prev => [...prev, ...newDocuments]);
        if (newDocuments.length > 0) {
            setSelectedDocumentId(newDocuments[0].id);
        }
    }, []);

    const handleDeleteRequest = (doc: Document) => {
        setShowDeleteConfirmation(doc);
    };
    
    const handleConfirmDelete = () => {
        if (!showDeleteConfirmation) return;
        
        const newDocuments = documents.filter(doc => doc.id !== showDeleteConfirmation.id);
        setDocuments(newDocuments);

        if (selectedDocumentId === showDeleteConfirmation.id) {
            setSelectedDocumentId(newDocuments.length > 0 ? newDocuments[0].id : null);
        }

        setShowDeleteConfirmation(null);
    };

    const tools = {
        summary: <SummaryTool documentText={selectedDocument?.content || ''} />,
        keywords: <KeywordsTool documentText={selectedDocument?.content || ''} />,
        citation: <CitationTool documentText={selectedDocument?.content || ''} />,
        insights: <InsightsTool documentText={selectedDocument?.content || ''} />,
        writer: <AIWriterTool documentText={selectedDocument?.content || ''} />,
        qa: <QATool documentText={selectedDocument?.content || ''} />,
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
                <div className="text-center animate-fade-in">
                    <h1 className="text-5xl font-bold tracking-tight">Docu<span className="text-blue-400">Mind</span></h1>
                    <div className="mt-8 flex justify-center">
                        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {showDeleteConfirmation && (
                 <ConfirmationModal 
                    document={showDeleteConfirmation}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirmation(null)}
                />
            )}
            {/* Sidebar */}
            <aside className="w-72 bg-gray-900/70 backdrop-blur-md border-r border-white/10 flex flex-col p-4">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-6">Docu<span className="text-blue-400">Mind</span></h1>
                <Button onClick={() => setSelectedDocumentId(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                    <IconPlus />
                    Add Documents
                </Button>
                
                <div className="mt-6 relative">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 pl-10 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    />
                    <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <nav className="mt-4 flex-grow overflow-y-auto">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace</h2>
                    <ul className="space-y-1">
                        {filteredDocuments.map(doc => (
                            <li key={doc.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setSelectedDocumentId(doc.id); }}
                                    className={`group flex items-center justify-between p-2 text-sm rounded-md transition-colors duration-200 ${selectedDocumentId === doc.id ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <IconFileText />
                                        <span className="truncate">{doc.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(doc); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity">
                                        <IconTrash/>
                                    </button>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-black/20">
                {selectedDocument ? (
                    <div className="p-8 h-full overflow-y-auto">
                         <h2 className="text-2xl font-bold mb-4">{selectedDocument.name}</h2>
                        <div className="prose prose-invert max-w-none text-gray-300 prose-p:leading-relaxed">
                            {selectedDocument.content.split('\n').map((p, i) => <p key={i}>{p || '\u00A0'}</p>)}
                        </div>
                    </div>
                ) : (
                    <FileUpload onUpload={handleUpload} />
                )}
            </main>

            {/* AI Tools Panel */}
            <section className="w-[380px] bg-gray-900/70 backdrop-blur-md border-l border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold">AI Toolkit</h2>
                    <p className="text-sm text-gray-400">Select a tool to analyze the document.</p>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2 border-b border-white/10">
                    {Object.entries(toolIcons).map(([key, icon]) => (
                        <ToolButton
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            icon={icon}
                            onClick={() => setActiveTool(key)}
                            isActive={activeTool === key}
                        />
                    ))}
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    {selectedDocument ? (
                        tools[activeTool as keyof typeof tools]
                    ) : (
                        <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                            <p>Upload or select a document to activate AI tools.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default App;