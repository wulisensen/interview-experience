import { Operation } from "fast-json-patch";

export type JsonSchema = Record<string, any>;
export type JsonPatch = Operation[];

export interface Intent {
  type: 'CREATE' | 'MODIFY' | 'QUERY' | 'EXPLAIN';
  entities: string[];
}

export interface ComponentMeta {
  name: string;
  type: string;
  title: string;
  props: Record<string, any>;
  pattern?: string;
  uiWidget?: string;
  validationRules?: Record<string, any>;
}

export interface ProtocolSpec {
  version: string;
  fieldTypes: string[];
  supportedWidgets: string[];
  namingConvention: 'camelCase' | 'snake_case';
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  validate: (schema: JsonSchema) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  level: 'error' | 'warning';
  path: string;
  message: string;
  code: string;
  expected?: any;
  actual?: any;
}

export interface ExampleSource {
  examples: Example[];
}

export interface Example {
  instruction: string;
  initialSchema?: JsonSchema;
  expectedPatch?: JsonPatch;
  expectedSchema?: JsonSchema;
}

export interface ApplyResult {
  success: boolean;
  schema: JsonSchema;
  version: string;
  inversePatch: JsonPatch;
}

export interface PlatformAdapter {
  getProtocolSpec(): ProtocolSpec;
  getComponentMeta(name: string): ComponentMeta | null;
  readConfig(id: string, version?: string): JsonSchema;
  applyPatch(id: string, patch: JsonPatch, baseVersion: string): ApplyResult;
  getBusinessRules(): Rule[];
  getExampleCorpus(): ExampleSource;
}

export interface SessionState {
  sessionId: string;
  platformId: string;
  currentSchema: JsonSchema;
  schemaHash: string;
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
    patches?: JsonPatch;
  }[];
  trace: any[];
}

export interface AgentState {
  intent: Intent | null;
  currentSchema: JsonSchema;
  schemaSkeleton: string;
  userMessage: string;
  patches: JsonPatch | null;
  generatedSchema: JsonSchema | null;
  validationResult: ValidationResult | null;
  retryCount: number;
  toolCalls: string[];
  errorMessage: string | null;
  done: boolean;
}

export interface MessageEvent {
  type: 'thinking' | 'tool_call' | 'patch' | 'schema' | 'error' | 'done';
  data: any;
}
