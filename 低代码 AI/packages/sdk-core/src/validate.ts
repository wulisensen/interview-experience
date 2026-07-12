import Ajv from 'ajv';
import { z } from 'zod';

const ajv = new Ajv();

export function validateSchema(schema: any): boolean {
  const metaSchema = ajv.getSchema('http://json-schema.org/draft-07/schema#');
  if (!metaSchema) return false;
  const result = metaSchema(schema);
  return Boolean(result);
}

export const patchSchema = z.array(
  z.object({
    op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
    path: z.string(),
    value: z.any().optional(),
    from: z.string().optional(),
  })
);

export function validatePatchFormat(patch: any): boolean {
  return patchSchema.safeParse(patch).success;
}
