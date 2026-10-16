export type DocBlock =
  | { t: 'p'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'note'; kind: 'info' | 'warn' | 'tip'; title?: string; text: string }
  | { t: 'code'; text: string; lang?: string };

export interface DocSection {
  id: string;
  group: string;
  title: string;
  summary: string;
  blocks: DocBlock[];
}
