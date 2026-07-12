import type { Operation } from 'fast-json-patch';

export type JsonPatch = Operation[];

export interface AIConfigClientOptions {
  baseUrl: string;
  platformId: string;
  auth?: {
    getToken: () => Promise<string> | string;
  };
}

export interface MessageEvent {
  type: 'thinking' | 'tool_call' | 'patch' | 'error' | 'done';
  data: any;
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  patches?: JsonPatch;
}
