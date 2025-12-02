export interface LocalDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 content
  text?: string;   // Extracted text if applicable (for preview)
  timestamp: number;
}

export enum ToolType {
  SUMMARY = 'SUMMARY',
  KEYWORDS = 'KEYWORDS',
  CITATION = 'CITATION',
  INSIGHTS = 'INSIGHTS',
  WRITER = 'WRITER',
  QA = 'QA'
}

export interface AnalysisResult {
  tool: ToolType;
  content: string;
  isLoading: boolean;
  error?: string;
}

export interface ToolDefinition {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  promptTemplate: string;
  description: string;
}