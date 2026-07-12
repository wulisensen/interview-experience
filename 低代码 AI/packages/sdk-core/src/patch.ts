import type { JsonPatch } from './types';

function applyJsonPatchInternal(doc: any, patch: JsonPatch): { newDocument: any } {
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

export function applyJsonPatch(schema: any, patch: JsonPatch): any {
  const result = applyJsonPatchInternal(schema, patch);
  return result.newDocument;
}

export function validateJsonPatch(schema: any, patch: JsonPatch): boolean {
  try {
    applyJsonPatchInternal(schema, patch);
    return true;
  } catch {
    return false;
  }
}
