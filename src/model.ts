export type EvidenceKind = "explicit" | "inferred";

export interface Evidence {
  kind: EvidenceKind;
  reason: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description?: string;
  relativePath: string;
  directory: string;
  rawContent: string;
  frontmatter: Record<string, unknown>;
  diagnostics: string[];
}

export interface AgentNode {
  id: string;
  name: string;
  relativePath: string;
  scope: string;
  rawContent: string;
  fileKind: "agents" | "override";
  parentId?: string;
  relationship?: Evidence;
  skills: SkillDefinition[];
  children: AgentNode[];
}

export interface ScanDiagnostic {
  path: string;
  severity: "warning" | "error";
  message: string;
}

export interface ProjectEntry {
  relativePath: string;
  kind: "directory" | "file";
  markdownContent?: string;
}

export interface ProjectScan {
  root: string;
  projectName: string;
  agents: AgentNode[];
  unscopedSkills: SkillDefinition[];
  diagnostics: ScanDiagnostic[];
  projectEntries: ProjectEntry[];
  scannedFiles: number;
}
