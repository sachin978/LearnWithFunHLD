// ─── Lessons ─────────────────────────────────────────────────────────────────

/**
 * Text fields support a tiny inline markup rendered by RichText:
 * `code` and **bold**. Keep it to that — content stays plain data.
 */
export type Rich = string;

export interface QuizQuestion {
  id: string;
  question: Rich;
  options: Rich[];
  answer: number;
  explanation: Rich;
}

export interface InterviewQuestion {
  q: Rich;
  /** Two-line answer for quick revision. */
  short: Rich;
  /** Interview-ready answer. */
  detailed?: Rich[];
}

export interface CodeSample {
  filename: string;
  language: "python" | "yaml" | "bash" | "text" | "dotenv";
  code: string;
  /** Line-by-line notes shown under the code. */
  notes?: Rich[];
}

export interface ComparisonTable {
  caption: string;
  headers: string[];
  rows: Rich[][];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  /** Short label used in the chapter navigation. */
  navTitle: string;
  minutes: number;
  problem: Rich;
  simple: Rich;
  analogy: Rich;
  realWorld?: { title: string; body: Rich[] };
  walkthrough: Rich[];
  technical: Rich[];
  table?: ComparisonTable;
  code?: CodeSample[];
  mistakes: { myth: Rich; reality: Rich }[];
  interview: InterviewQuestion[];
  takeaways: Rich[];
  quiz: QuizQuestion[];
}

export interface Course {
  slug: string;
  title: string;
  tagline: string;
  intro: Rich;
  objectives: Rich[];
  chapters: Chapter[];
}
