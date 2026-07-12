import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sessionsRouter } from './routes/sessions.js';
import { initSessionStore } from './session/store.js';
import { serve } from '@hono/node-server';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    name: 'AI Config Agent Server',
    version: '0.1.0',
  });
});

app.route('/v1/sessions', sessionsRouter);

initSessionStore();

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port });
}
