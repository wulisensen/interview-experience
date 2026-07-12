import Ajv from 'ajv';
import { z } from 'zod';
import { JsonSchema, JsonPatch, ValidationResult, ValidationError, PlatformAdapter } from '../types/index.js';

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

const ajv = new Ajv({ allErrors: true });

const jsonPatchSchema = z.array(z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: z.string(),
  value: z.any().optional(),
  from: z.string().optional()
}));

export class Guardrail {
  private adapter: PlatformAdapter;

  constructor(adapter: PlatformAdapter) {
    this.adapter = adapter;
  }

  validatePatch(patch: JsonPatch, baseSchema: JsonSchema): ValidationResult {
    const l1Result = this.validateL1(patch, baseSchema);
    if (!l1Result.valid) return l1Result;

    const l2Result = this.validateL2(patch, baseSchema);
    if (!l2Result.valid) return l2Result;

    const l3Result = this.validateL3(applyPatch(baseSchema, patch).newDocument);
    if (!l3Result.valid) return l3Result;

    return { valid: true, errors: [] };
  }

  validateSchema(schema: JsonSchema): ValidationResult {
    const l1Result = this.validateSchemaL1(schema);
    if (!l1Result.valid) return l1Result;

    const l2Result = this.validateSchemaL2(schema);
    if (!l2Result.valid) return l2Result;

    const l3Result = this.validateL3(schema);
    if (!l3Result.valid) return l3Result;

    return { valid: true, errors: [] };
  }

  private validateL1(patch: JsonPatch, baseSchema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];

    const patchResult = jsonPatchSchema.safeParse(patch);
    if (!patchResult.success) {
      patchResult.error.issues.forEach(issue => {
        errors.push({
          level: 'error',
          path: `patch[${issue.path[0]}]`,
          message: issue.message,
          code: 'INVALID_PATCH_FORMAT'
        });
      });
    }

    try {
      const result = applyJsonPatch(baseSchema, patch);
      const metaSchemaValidate = ajv.compile({ $ref: 'http://json-schema.org/draft-07/schema#' });
      if (!metaSchemaValidate(result.newDocument)) {
        metaSchemaValidate.errors?.forEach(err => {
          errors.push({
            level: 'error',
            path: err.schemaPath || '',
            message: err.message || 'Schema 格式无效',
            code: 'INVALID_SCHEMA_FORMAT'
          });
        });
      }
    } catch (e: any) {
      errors.push({
        level: 'error',
        path: '',
        message: '应用 Patch 后 Schema 无效',
        code: 'INVALID_SCHEMA_AFTER_PATCH'
      });
    }

    return { valid: errors.length === 0, errors };
  }

  private validateSchemaL1(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];

    const metaSchemaValidate = ajv.compile({ $ref: 'http://json-schema.org/draft-07/schema#' });
    if (!metaSchemaValidate(schema)) {
      metaSchemaValidate.errors?.forEach(err => {
        errors.push({
          level: 'error',
          path: err.schemaPath || '',
          message: err.message || 'Schema 格式无效',
          code: 'INVALID_SCHEMA_FORMAT'
        });
      });
    }

    return { valid: errors.length === 0, errors };
  }

  private validateL2(patch: JsonPatch, baseSchema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const modifiedSchema = applyJsonPatch(baseSchema, patch).newDocument;

    const requiredCheck = this.validateRequiredFieldsExist(modifiedSchema);
    errors.push(...requiredCheck.errors);

    const dependencyCheck = this.validateDependencies(modifiedSchema);
    errors.push(...dependencyCheck.errors);

    const enumCheck = this.validateEnumDefaults(modifiedSchema);
    errors.push(...enumCheck.errors);

    const rangeCheck = this.validateNumberRanges(modifiedSchema);
    errors.push(...rangeCheck.errors);

    return { valid: errors.length === 0, errors };
  }

  private validateSchemaL2(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];

    errors.push(...this.validateRequiredFieldsExist(schema).errors);
    errors.push(...this.validateDependencies(schema).errors);
    errors.push(...this.validateEnumDefaults(schema).errors);
    errors.push(...this.validateNumberRanges(schema).errors);

    return { valid: errors.length === 0, errors };
  }

  private validateRequiredFieldsExist(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    if (schema.required && schema.properties) {
      schema.required.forEach((field: string) => {
        if (!schema.properties[field]) {
          errors.push({
            level: 'error',
            path: `/required`,
            message: `Required field "${field}" not defined in properties`,
            code: 'MISSING_REQUIRED_PROPERTY'
          });
        }
      });
    }
    return { valid: errors.length === 0, errors };
  }

  private validateDependencies(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    if (schema.dependencies && schema.properties) {
      Object.entries(schema.dependencies).forEach(([key, deps]: [string, any]) => {
        if (Array.isArray(deps)) {
          deps.forEach((dep: string) => {
            if (!schema.properties[dep]) {
              errors.push({
                level: 'error',
                path: `/dependencies/${key}`,
                message: `Dependency "${dep}" not defined`,
                code: 'MISSING_DEPENDENCY'
              });
            }
          });
        }
      });
    }
    return { valid: errors.length === 0, errors };
  }

  private validateEnumDefaults(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const checkSchema = (obj: any, path = '') => {
      if (obj.enum && obj.default !== undefined && !obj.enum.includes(obj.default)) {
        errors.push({
          level: 'error',
          path: `${path}/default`,
          message: `Default value ${obj.default} not in enum`,
          code: 'DEFAULT_NOT_IN_ENUM'
        });
      }
      if (obj.properties) {
        Object.entries(obj.properties).forEach(([key, value]) => {
          checkSchema(value, `${path}/properties/${key}`);
        });
      }
    };
    checkSchema(schema);
    return { valid: errors.length === 0, errors };
  }

  private validateNumberRanges(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const checkSchema = (obj: any, path = '') => {
      if ((obj.type === 'number' || obj.type === 'integer') && obj.minimum !== undefined && obj.maximum !== undefined) {
        if (obj.minimum > obj.maximum) {
          errors.push({
            level: 'error',
            path: path,
            message: `Minimum ${obj.minimum} greater than maximum ${obj.maximum}`,
            code: 'INVALID_RANGE'
          });
        }
      }
      if (obj.properties) {
        Object.entries(obj.properties).forEach(([key, value]) => {
          checkSchema(value, `${path}/properties/${key}`);
        });
      }
    };
    checkSchema(schema);
    return { valid: errors.length === 0, errors };
  }

  private validateL3(schema: JsonSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const rules = this.adapter.getBusinessRules();
    for (const rule of rules) {
      const result = rule.validate(schema);
      errors.push(...result.errors);
    }
    return { valid: errors.length === 0, errors };
  }
}
