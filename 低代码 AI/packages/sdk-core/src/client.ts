import type { AIConfigClientOptions, MessageEvent, JsonPatch } from './types';

export class AIConfigClient {
  private options: AIConfigClientOptions;
  private sessionId: string | null = null;

  constructor(options: AIConfigClientOptions) {
    this.options = options;
  }

  async createSession(schema?: any): Promise<string> {
    const response = await fetch(`${this.options.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Id': this.options.platformId,
      },
      body: JSON.stringify({ schema }),
    });
    const data = await response.json();
    this.sessionId = data.sessionId;
    return data.sessionId;
  }

  async sendMessage(
    content: string,
    currentSchema: any
  ): Promise<ReadableStream<MessageEvent>> {
    if (!this.sessionId) {
      await this.createSession();
    }

    const response = await fetch(
      `${this.options.baseUrl}/v1/sessions/${this.sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Id': this.options.platformId,
        },
        body: JSON.stringify({
          message: content,
          schema: currentSchema,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const stream = new ReadableStream<MessageEvent>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                controller.enqueue(data as MessageEvent);
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return stream;
  }

  async applyPatch(patches: JsonPatch, baseVersion: string): Promise<any> {
    const response = await fetch(
      `${this.options.baseUrl}/v1/sessions/${this.sessionId}/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Id': this.options.platformId,
        },
        body: JSON.stringify({ patches, baseVersion }),
      }
    );
    return response.json();
  }
}
