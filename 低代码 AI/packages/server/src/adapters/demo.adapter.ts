import { PlatformAdapter, ProtocolSpec, ComponentMeta, JsonSchema, JsonPatch, Rule, ExampleSource, ValidationResult } from '../types/index.js';

function applyJsonPatch(doc: any, patch: JsonPatch): { newDocument: any } {
  const result = JSON.parse(JSON.stringify(doc));
  for (const op of patch) {
    const pathParts = op.path.split('/').filter(Boolean);
    let target = result;
    let parent: any = null;
    let lastKey: string | null = null;
    
    for (let i = 0; i < pathParts.length; i++) {
      if (i === pathParts.length - 1) {
        lastKey = pathParts[i];
      } else {
        parent = target;
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

const demoComponents: Record<string, ComponentMeta> = {
  'text': {
    name: 'text',
    type: 'string',
    title: '文本输入',
    props: { minLength: 0, maxLength: 1000 }
  },
  'phone': {
    name: 'phone',
    type: 'string',
    title: '手机号',
    pattern: '^1[3-9]\\d{9}$',
    uiWidget: 'phone-input',
    props: {}
  },
  'email': {
    name: 'email',
    type: 'string',
    title: '邮箱',
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    uiWidget: 'email-input',
    props: {}
  },
  'number': {
    name: 'number',
    type: 'number',
    title: '数字输入',
    props: { minimum: 0, maximum: 999999 }
  },
  'date': {
    name: 'date',
    type: 'string',
    title: '日期选择',
    uiWidget: 'date-picker',
    props: {}
  },
  'select': {
    name: 'select',
    type: 'string',
    title: '下拉选择',
    uiWidget: 'select',
    props: { enum: [] }
  }
};

const demoExamples: ExampleSource = {
  examples: [
    {
      instruction: '创建一个用户信息表单，包含姓名、年龄、邮箱',
      expectedSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', title: '姓名' },
          age: { type: 'number', title: '年龄', minimum: 0, maximum: 120 },
          email: { type: 'string', title: '邮箱', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
        },
        required: ['name', 'email']
      }
    }
  ]
};

const positiveNumberRule: Rule = {
  id: 'positive-number',
  name: '数值必须为正',
  description: '数值字段的最小值必须大于等于0',
  validate: (schema: JsonSchema): ValidationResult => {
    const errors: any[] = [];
    const checkProperties = (obj: any, path = '') => {
      if (obj.type === 'number' || obj.type === 'integer') {
        if (obj.minimum !== undefined && obj.minimum < 0) {
          errors.push({
            level: 'error',
            path: `${path}.minimum`,
            message: '最小值不能为负数',
            code: 'NEGATIVE_MINIMUM'
          });
        }
      }
      if (obj.properties) {
        Object.entries(obj.properties).forEach(([key, value]) => {
          checkProperties(value, `${path}.properties.${key}`);
        });
      }
    };
    checkProperties(schema);
    return { valid: errors.length === 0, errors };
  }
};

export class DemoAdapter implements PlatformAdapter {
  private configStore: Map<string, { schema: JsonSchema; version: string }> = new Map();

  getProtocolSpec(): ProtocolSpec {
    return {
      version: '1.0.0',
      fieldTypes: ['string', 'number', 'integer', 'boolean', 'array', 'object'],
      supportedWidgets: ['text', 'phone', 'email', 'date', 'select'],
      namingConvention: 'camelCase'
    };
  }

  getComponentMeta(name: string): ComponentMeta | null {
    if (!name || typeof name !== 'string') {
      return null;
    }
    const normalized = name.toLowerCase();
    for (const [key, meta] of Object.entries(demoComponents)) {
      if (key === normalized || 
          (meta.title && meta.title.includes(name)) || 
          (meta.name && meta.name.includes(name))) {
        return meta;
      }
    }
    return null;
  }

  readConfig(id: string, version?: string): JsonSchema {
    const stored = this.configStore.get(id);
    if (stored) {
      return stored.schema;
    }
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

  applyPatch(id: string, patch: JsonPatch, baseVersion: string): any {
    const current = this.configStore.get(id);
    const originalSchema = current?.schema || { type: 'object', properties: {}, required: [] };
    
    const result = applyJsonPatch(originalSchema, patch);
    const newVersion = Date.now().toString();
    
    const inversePatch = patch.map(op => {
      if (op.op === 'add') return { op: 'remove', path: op.path };
      if (op.op === 'remove') return { op: 'add', path: op.path, value: (originalSchema as any)[op.path] };
      if (op.op === 'replace') return { op: 'replace', path: op.path, value: (originalSchema as any)[op.path] };
      return op;
    }).reverse();

    this.configStore.set(id, { schema: result.newDocument, version: newVersion });

    return {
      success: true,
      schema: result.newDocument,
      version: newVersion,
      inversePatch
    };
  }

  getBusinessRules(): Rule[] {
    return [positiveNumberRule];
  }

  getExampleCorpus(): ExampleSource {
    return demoExamples;
  }
}
