import { PlatformAdapter } from '../types/index.js';
import { DemoAdapter } from './demo.adapter.js';

const adapters: Record<string, PlatformAdapter> = {
  'demo': new DemoAdapter(),
  'marketing': new DemoAdapter(),
  'default': new DemoAdapter()
};

export function getAdapter(platformId: string): PlatformAdapter {
  return adapters[platformId] || adapters['default'];
}

export function registerAdapter(platformId: string, adapter: PlatformAdapter): void {
  adapters[platformId] = adapter;
}
