export type Phase = 'upstream' | 'midstream' | 'downstream';
export type Severity = 'info' | 'minor' | 'major' | 'critical';
export type InputContext = 'diff' | 'fullFile' | 'tests' | 'adr' | 'commitMessage' | 'repoConfig';
export type OutputKind = 'findings' | 'summary' | 'actions' | 'tests' | 'metrics' | 'questions';
export type ModelHint = 'cheap' | 'balanced' | 'high-accuracy';
export type Dependency =
  | 'code_search'
  | 'test_runner'
  | 'adr_lookup'
  | 'repo_metadata'
  | 'coverage_report'
  | 'tracing'
  | `custom:${string}`;

export interface SkillTrigger {
  phase?: Phase | Phase[];
  applyTo?: string[];
  files?: string[];
}

interface SkillFrontmatterBase {
  id: string;
  name: string;
  description: string;
  phase?: Phase | Phase[];
  applyTo?: string[];
  files?: string[];
  trigger?: SkillTrigger;
  tags?: string[];
  severity?: Severity;
  inputContext?: InputContext[];
  outputKind?: OutputKind[];
  modelHint?: ModelHint;
  dependencies?: Dependency[];
  priority?: number;
  version?: string;
  model?: string;
  prompt?: {
    system?: string;
    user?: string;
  };
  eval?: {
    promptfoo?: string;
  };
  fixturesDir?: string;
  goldenDir?: string;
}

export type SkillFrontmatter = SkillFrontmatterBase & {
  // Preserve forward compatibility for metadata extensions (e.g., author, versionName).
  [key: string]: unknown;
};

export interface SkillMetadata extends SkillFrontmatter {
  phase: Phase | Phase[];
  applyTo: string[];
  outputKind?: OutputKind[];
}

export interface SkillDefinition {
  metadata: SkillMetadata;
  body: string;
  path: string;
}
