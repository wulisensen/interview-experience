import { JsonSchema, JsonPatch, PlatformAdapter, MessageEvent } from '../types/index.js';
import dotenv from 'dotenv';
dotenv.config();
import { AgentTools, generateSchemaSkeleton } from './tools.js';
import { Guardrail } from '../guardrail/index.js';
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

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
    const completion = await openai.chat.completions.create({
      messages: messages as any,
      model: "deepseek-v4-pro",
      // thinking: {"type": "enabled"}, // DeepSeek API doesn't fully support thinking block in this SDK yet for v4 unless specified
      // reasoning_effort: "high",
      stream: false,
    });
    
    console.error('DeepSeek API completion:', JSON.stringify(completion));
    console.log(completion)
    return completion.choices[0].message.content || '';

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

    let previousErrors: string[] = [];

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        if (isEmptySchema) {
          // 生成新 schema
          eventCallback({ type: 'thinking', data: { step: 'generating_schema', attempt: retry + 1 } });
          
          const examples = tools.searchExamples(userMessage);
          
          let systemPrompt = `你是一个专业的 JSON Schema 配置助手。请根据用户的需求，生成完整的 JSON Schema。

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

          if (previousErrors.length > 0) {
            systemPrompt += `\n\n【重要】上次生成的 Schema 存在以下验证错误，请在本次生成中修复它们：\n${previousErrors.join('\n')}`;
          }

          const content = await callDeepSeekAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]);
          const schema = extractJSON(content);
          console.log('Generated schema:', schema);

          const validationResult = guardrail.validateSchema(schema);
          if (validationResult.valid) {
            eventCallback({ type: 'schema', data: { schema } });
            return { success: true, schema };
          } else {
            const errorMessages = validationResult.errors.map((e: any) => `路径: ${e.path}, 错误: ${e.message} (代码: ${e.code})`);
            throw new Error(JSON.stringify(errorMessages));
          }
        } else {
          // 修改现有 schema - 生成 patch
          eventCallback({ type: 'thinking', data: { step: 'generating_patch', attempt: retry + 1 } });
          
          const examples = tools.searchExamples(userMessage);
          
          let systemPrompt = `你是一个专业的 JSON Schema 配置助手。请根据用户的需求，生成 RFC 6902 标准的 JSON Patch 来修改现有 Schema。

当前 Schema 骨架:
${skeleton}

平台协议规范:
${JSON.stringify(tools.getProtocolSpec(), null, 2)}

${examples.length > 0 ? `参考示例:
${JSON.stringify(examples, null, 2)}` : ''}

要求:
1. 必须返回 JSON 数组格式（[]），即使只有一个操作也必须包裹在数组中。
2. 使用 'add' 添加新字段
3. 使用 'replace' 修改已有字段
4. 使用 'add' 到 '/required/-' 添加必填字段
5. 确保路径格式正确（如 '/properties/fieldName'）

直接输出 JSON 格式的 Patch 数组，必须以 [ 开始，以 ] 结束，不要任何其他文字。`;

          if (previousErrors.length > 0) {
            systemPrompt += `\n\n【重要】上次生成的 Patch 存在以下验证错误，请在本次生成中修复它们：\n${previousErrors.join('\n')}`;
          }

          const content = await callDeepSeekAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]);
          
          let patches = extractJSON(content);
          if (patches && !Array.isArray(patches)) {
            patches = [patches];
          }
          console.log('Generated patches:', patches);

          const dryRunResult = tools.dryRunApply(currentSchema, patches);
          const validationResult = guardrail.validatePatch(patches, currentSchema);
          
          if (validationResult.valid) {
            eventCallback({ type: 'patch', data: { patches, dryRunResult } });
            return { success: true, patches };
          } else {
            const errorMessages = validationResult.errors.map((e: any) => `路径: ${e.path}, 错误: ${e.message} (代码: ${e.code})`);
            throw new Error(JSON.stringify(errorMessages));
          }
        }
      } catch (error: any) {
        eventCallback({ type: 'thinking', data: { step: 'retrying', attempt: retry + 1 } });
        
        try {
          // 尝试解析作为 JSON 字符串抛出的结构化错误
          previousErrors = JSON.parse(error.message);
        } catch {
          // 如果解析失败（例如由于 extractJSON 失败抛出的普通错误），则直接使用错误信息
          previousErrors = [error.message];
        }

        if (retry === MAX_RETRIES - 1) {
          eventCallback({ type: 'error', data: { message: `多次尝试失败: ${previousErrors.join('; ')}` } });
          return { success: false, error: previousErrors.join('; ') };
        }
      }
    }

    return { success: false, error: '重试次数超限' };
  }

  return { processMessage };
}
