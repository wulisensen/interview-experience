import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { getSessionStore } from '../session/store.js';
import { getAdapter } from '../adapters/index.js';
import { createAgentProcessor } from '../agent/graph.js';
import { generateSchemaSkeleton } from '../agent/tools.js';
import { Guardrail } from '../guardrail/index.js';

export const sessionsRouter = new Hono();

sessionsRouter.post('/', async (c) => {
  const platformId = c.req.header('x-platform-id') || 'demo';
  const { schema, configId } = await c.req.json();

  let initialSchema = schema;
  if (!initialSchema && configId) {
    const adapter = getAdapter(platformId);
    initialSchema = adapter.readConfig(configId);
  }
  if (!initialSchema) {
    initialSchema = {
      type: 'object',
      properties: {},
      required: []
    };
  }

  const store = getSessionStore();
  const sessionId = await store.create(platformId, initialSchema);

  return c.json({ sessionId, schema: initialSchema });
});

sessionsRouter.get('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const store = getSessionStore();
  const session = await store.get(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  return c.json(session);
});

sessionsRouter.post('/:sessionId/messages', async (c) => {
  const sessionId = c.req.param('sessionId');
  const { userMessage, schema } = await c.req.json();

  const store = getSessionStore();
  const session = await store.get(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  let currentSchema = session.currentSchema;
  if (schema) {
    currentSchema = schema;
    await store.update(sessionId, { currentSchema });
  }

  const adapter = getAdapter(session.platformId);

  return streamText(c, async (stream) => {
    const eventQueue: any[] = [];
    let finalResult: any = null;

    const eventCallback = (event: any) => {
      eventQueue.push(event);
    };

    const processor = await createAgentProcessor(adapter, eventCallback);
    const result = await processor.processMessage(userMessage, currentSchema);
    finalResult = result;

    for (const event of eventQueue) {
      await stream.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    await stream.write(`data: ${JSON.stringify({ type: 'done', data: finalResult })}\n\n`);

    const updatedHistory = [
      ...session.conversationHistory,
      { role: 'user', content: userMessage },
      { 
        role: 'assistant', 
        content: finalResult.content, 
        patches: finalResult.patches 
      }
    ];

    await store.update(sessionId, {
      conversationHistory: updatedHistory,
      trace: [...session.trace, { userMessage, result: finalResult }]
    });
  });
});

sessionsRouter.post('/:sessionId/apply', async (c) => {
  const sessionId = c.req.param('sessionId');
  const { patches, configId, baseVersion } = await c.req.json();

  const store = getSessionStore();
  const session = await store.get(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  const adapter = getAdapter(session.platformId);
  const guardrail = new Guardrail(adapter);

  const validationResult = guardrail.validatePatch(patches, session.currentSchema);
  if (!validationResult.valid) {
    return c.json({ error: 'Patch validation failed', details: validationResult.errors }, 400);
  }

  if (configId) {
    const result = adapter.applyPatch(configId, patches, baseVersion || '0');
    await store.update(sessionId, { currentSchema: result.schema });
    return c.json(result);
  }

  function applyJsonPatch(doc: any, patch: any[]) {
    const result = JSON.parse(JSON.stringify(doc));
    for (const op of patch) {
      const pathParts = op.path.split('/').filter(Boolean);
      let target = result;
      let lastKey: string | null = null;
      
      for (let i = 0; i < pathParts.length; i++) {
        if (i === pathParts.length - 1) {
          lastKey = pathParts[i];
        } else {
          if (Array.isArray(target)) {
            target = target[parseInt(pathParts[i])];
          } else {
            target = target[pathParts[i]];
          }
        }
      }
      
      switch (op.op) {
        case 'add':
          if (Array.isArray(target) && lastKey === '-') {
            target.push(op.value);
          } else if (Array.isArray(target) && lastKey) {
            target.splice(parseInt(lastKey), 0, op.value);
          } else if (lastKey) {
            target[lastKey] = op.value;
          }
          break;
        case 'remove':
          if (Array.isArray(target) && lastKey) {
            target.splice(parseInt(lastKey), 1);
          } else if (lastKey) {
            delete target[lastKey];
          }
          break;
        case 'replace':
          if (lastKey) {
            target[lastKey] = op.value;
          }
          break;
      }
    }
    return { newDocument: result };
  }

  const newSchema = applyJsonPatch(session.currentSchema, patches).newDocument;
  await store.update(sessionId, { currentSchema: newSchema });

  return c.json({ success: true, schema: newSchema });
});
