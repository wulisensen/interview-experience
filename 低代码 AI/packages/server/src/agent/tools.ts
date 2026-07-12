import { JsonSchema, JsonPatch, PlatformAdapter, ComponentMeta } from '../types/index.js';

function applyJsonPatch(doc: any, patch: JsonPatch): { newDocument: any } {
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

export function generateSchemaSkeleton(schema: JsonSchema): string {
  const lines: string[] = [];
  
  const walk = (obj: any, path = '') => {
    if (obj.type === 'object' && obj.properties) {
      Object.entries(obj.properties).forEach(([key, value]: [string, any]) => {
        const propPath = path ? `${path}/properties/${key}` : `/properties/${key}`;
        const isRequired = obj.required?.includes(key);
        let line = `${propPath}  ${value.type}  "${value.title || key}`;
        if (isRequired) line += '  required';
        if (value.minimum !== undefined && value.maximum !== undefined) {
          line += `  [${value.minimum},${value.maximum}]`;
        }
        lines.push(line);
        if (value.type === 'object' || value.type === 'array') {
          walk(value, propPath);
        }
      });
    }
  };
  
  walk(schema);
  return lines.join('\n');
}

export class AgentTools {
  private adapter: PlatformAdapter;

  constructor(adapter: PlatformAdapter) {
    this.adapter = adapter;
  }

  readSchema(schema: JsonSchema, scope?: string): { schema: JsonSchema; skeleton: string } {
    const skeleton = generateSchemaSkeleton(schema);
    if (scope) {
      const parts = scope.split('.');
      let current = schema;
      for (const part of parts) {
        if (current.properties && current.properties[part]) {
          current = current.properties[part];
        }
      }
      return { schema: current, skeleton: generateSchemaSkeleton(current) };
    }
    return { schema, skeleton };
  }

  locateNode(query: string, schema: JsonSchema): { paths: string[]; confidence: number } {
    const paths: string[] = [];
    const normalizedQuery = query.toLowerCase();
    
    const walk = (obj: any, path = '') => {
      if (obj.type === 'object' && obj.properties) {
        Object.entries(obj.properties).forEach(([key, value]: [string, any]) => {
          const propPath = path ? `${path}/properties/${key}` : `/properties/${key}`;
          if (key.toLowerCase().includes(normalizedQuery) || 
              (value.title && value.title.toLowerCase().includes(normalizedQuery))) {
            paths.push(propPath);
          }
          if (value.type === 'object' || value.type === 'array') {
            walk(value, propPath);
          }
        });
      }
    };
    
    walk(schema);
    return { 
      paths, 
      confidence: paths.length > 0 ? 0.8 : 0.2 
    };
  }

  queryComponentMeta(name: string): ComponentMeta | null {
    return this.adapter.getComponentMeta(name);
  }

  searchExamples(instruction: string): any[] {
    try {
      const corpus = this.adapter.getExampleCorpus();
      if (!corpus || !Array.isArray(corpus.examples)) {
        return [];
      }
      const normalizedInstruction = (instruction || '').toLowerCase();
      return corpus.examples
        .filter(ex => {
          if (!ex || typeof ex !== 'object' || !ex.instruction) {
            return false;
          }
          const exInstr = String(ex.instruction);
          return exInstr.toLowerCase().includes(normalizedInstruction);
        })
        .slice(0, 3);
    } catch (e) {
      return [];
    }
  }

  dryRunApply(schema: JsonSchema, patch: JsonPatch): JsonSchema {
    return applyJsonPatch(schema, patch).newDocument;
  }

  getProtocolSpec() {
    return this.adapter.getProtocolSpec();
  }
}
