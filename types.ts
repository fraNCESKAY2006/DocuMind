
export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
}

export enum SummaryTone {
  Academic = "academic",
  Casual = "casual",
  Technical = "technical",
}

export enum CitationStyle {
  APA = "APA",
  MLA = "MLA",
  Chicago = "Chicago",
}

export interface Keyword {
  text: string;
  relevance: number; // A score from 0 to 1
}

export interface InsightMetrics {
  readabilityScore: string;
  keywordDensity: { keyword: string; density: number }[];
  citationCount: number;
  wordCount: number;
}
