import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { SessionState, JsonSchema } from '../types/index.js';

interface SessionStore {
  create(platformId: string, schema: JsonSchema): Promise<string>;
  get(sessionId: string): Promise<SessionState | null>;
  update(sessionId: string, updates: Partial<SessionState>): Promise<void>;
  delete(sessionId: string): Promise<void>;
}

class InMemorySessionStore implements SessionStore {
  private store: Map<string, SessionState> = new Map();

  async create(platformId: string, schema: JsonSchema): Promise<string> {
    const sessionId = uuidv4();
    const state: SessionState = {
      sessionId,
      platformId,
      currentSchema: schema,
      schemaHash: this.hashSchema(schema),
      conversationHistory: [],
      trace: []
    };
    this.store.set(sessionId, state);
    return sessionId;
  }

  async get(sessionId: string): Promise<SessionState | null> {
    return this.store.get(sessionId) || null;
  }

  async update(sessionId: string, updates: Partial<SessionState>): Promise<void> {
    const existing = this.store.get(sessionId);
    if (existing) {
      this.store.set(sessionId, { ...existing, ...updates });
    }
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  private hashSchema(schema: JsonSchema): string {
    return JSON.stringify(schema).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
}

class RedisSessionStore implements SessionStore {
  private redis: Redis;
  private ttl: number = 3600 * 24; // 24 hours

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async create(platformId: string, schema: JsonSchema): Promise<string> {
    const sessionId = uuidv4();
    const state: SessionState = {
      sessionId,
      platformId,
      currentSchema: schema,
      schemaHash: this.hashSchema(schema),
      conversationHistory: [],
      trace: []
    };
    await this.redis.setex(`session:${sessionId}`, this.ttl, JSON.stringify(state));
    return sessionId;
  }

  async get(sessionId: string): Promise<SessionState | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async update(sessionId: string, updates: Partial<SessionState>): Promise<void> {
    const existing = await this.get(sessionId);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.redis.setex(`session:${sessionId}`, this.ttl, JSON.stringify(updated));
    }
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  private hashSchema(schema: JsonSchema): string {
    return JSON.stringify(schema).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
}

let store: SessionStore;

export function initSessionStore(): void {
  const useRedis = process.env.USE_REDIS === 'true';
  store = useRedis ? new RedisSessionStore() : new InMemorySessionStore();
}

export function getSessionStore(): SessionStore {
  if (!store) {
    initSessionStore();
  }
  return store;
}
