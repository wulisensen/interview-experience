import { JsonSchema, JsonPatch, PlatformAdapter, MessageEvent } from '../types/index.js';
import dotenv from 'dotenv';
dotenv.config();
import { AgentTools, generateSchemaSkeleton } from './tools.js';
import { Guardrail } from '../guardrail/index.js';

interface DeepSeekCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

const MAX_RETRIES = 3;

async function callDeepSeekAPI(messages: Array<{ role: string; content: string }>) {
  console.error('DeepSeek API messages:', messages);
  try {
    
    const response = await fetch('https://api.deepseek.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json() as DeepSeekCompletionResponse;
    return data.choices[0].message.content;

  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    throw error;
  }
}

function extractJSON(content: string) {
  // 尝试提取 JSON 对象或数组
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // 继续尝试数组
    }
  }
  
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      throw new Error('无法解析 JSON');
    }
  }
  
  throw new Error('没有找到有效的 JSON');
}

export async function createAgentProcessor(
  adapter: PlatformAdapter,
  eventCallback: (event: MessageEvent) => void
) {
  const tools = new AgentTools(adapter);
  const guardrail = new Guardrail(adapter);

  async function processMessage(
    userMessage: string,
    currentSchema: JsonSchema
  ) {
    eventCallback({ type: 'thinking', data: { step: 'analyzing' } });
    
    const skeleton = generateSchemaSkeleton(currentSchema);
    const isEmptySchema = !currentSchema.properties || Object.keys(currentSchema.properties).length === 0;

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        if (isEmptySchema) {
          // 生成新 schema
          eventCallback({ type: 'thinking', data: { step: 'generating_schema' } });
          
          const examples = tools.searchExamples(userMessage);
          
          const systemPrompt = `你是一个专业的 JSON Schema 配置助手。请根据用户的需求，生成完整的 JSON Schema。

平台协议规范:
${JSON.stringify(tools.getProtocolSpec(), null, 2)}

${examples.length > 0 ? `参考示例:
${JSON.stringify(examples, null, 2)}` : ''}

要求:
1. 生成符合 JSON Schema Draft-07 标准的 schema
2. 包含 type、properties、required 等关键字段
3. 合理设置字段验证规则（minLength, maxLength, minimum, maximum, pattern 等）
4. 添加 title 提供友好的字段名称

直接输出 JSON 格式的 Schema，不要有任何其他文字。`;

          const content = await callDeepSeekAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]);
          
          const schema = extractJSON(content);

          const validationResult = guardrail.validateSchema(schema);
          if (validationResult.valid) {
            eventCallback({ type: 'schema', data: { schema } });
            return { success: true, schema };
          } else {
            throw new Error(validationResult.errors.map((e: any) => e.message).join('; '));
          }
        } else {
          // 修改现有 schema - 生成 patch
          eventCallback({ type: 'thinking', data: { step: 'generating_patch' } });
          
          const examples = tools.searchExamples(userMessage);
          
          const systemPrompt = `你是一个专业的 JSON Schema 配置助手。请根据用户的需求，生成 RFC 6902 标准的 JSON Patch 来修改现有 Schema。

当前 Schema 骨架:
${skeleton}

平台协议规范:
${JSON.stringify(tools.getProtocolSpec(), null, 2)}

${examples.length > 0 ? `参考示例:
${JSON.stringify(examples, null, 2)}` : ''}

要求:
1. 只生成 JSON Patch 数组，不要其他文字
2. 使用 'add' 添加新字段
3. 使用 'replace' 修改已有字段
4. 使用 'add' 到 '/required/-' 添加必填字段
5. 确保路径格式正确（如 '/properties/fieldName'）

直接输出 JSON 格式的 Patch 数组，不要任何其他文字。`;

          const content = await callDeepSeekAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]);
          
          const patches = extractJSON(content);

          const dryRunResult = tools.dryRunApply(currentSchema, patches);
          const validationResult = guardrail.validatePatch(patches, currentSchema);
          
          if (validationResult.valid) {
            eventCallback({ type: 'patch', data: { patches, dryRunResult } });
            return { success: true, patches };
          } else {
            throw new Error(validationResult.errors.map((e: any) => e.message).join('; '));
          }
        }
      } catch (error: any) {
        eventCallback({ type: 'thinking', data: { step: 'retrying', attempt: retry + 1 } });
        if (retry === MAX_RETRIES - 1) {
          eventCallback({ type: 'error', data: { message: error.message } });
          return { success: false, error: error.message };
        }
      }
    }

    return { success: false, error: '重试次数超限' };
  }

  return { processMessage };
}
