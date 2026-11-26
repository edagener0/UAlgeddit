import { z } from 'zod';

type JsonSchema = Record<string, unknown>;
export type OperationObject = Record<string, unknown>;
export type PathsObject = Record<string, Record<string, OperationObject>>;

/** Converts a shared Zod schema into a JSON Schema (OpenAPI 3.1 is JSON Schema 2020-12). */
export function fromZod(schema: z.ZodType): JsonSchema {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
  }) as JsonSchema;
  return rest;
}

export const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

export function jsonBody(schema: z.ZodType | JsonSchema, description?: string) {
  const resolved = schema instanceof z.ZodType ? fromZod(schema) : schema;
  return {
    required: true,
    ...(description && { description }),
    content: { 'application/json': { schema: resolved } },
  };
}

/** `multipart/form-data` body made of the Zod schema fields plus binary file fields. */
export function multipartBody(
  schema: z.ZodObject | null,
  files: Record<string, { multiple?: boolean; description: string }>,
) {
  const base = schema ? fromZod(schema) : { type: 'object', properties: {} };
  const properties = { ...(base.properties as JsonSchema) };
  for (const [name, file] of Object.entries(files)) {
    const binary = { type: 'string', format: 'binary' };
    properties[name] = file.multiple
      ? { type: 'array', items: binary, description: file.description }
      : { ...binary, description: file.description };
  }
  return {
    required: true,
    content: { 'multipart/form-data': { schema: { ...base, properties } } },
  };
}

export function json(description: string, schema: JsonSchema) {
  return { description, content: { 'application/json': { schema } } };
}

export const noContent = (description: string) => ({ description });

/** Builds OpenAPI query parameters from the fields of a Zod object schema. */
export function queryParams(schema: z.ZodObject) {
  return Object.entries(schema.shape).map(([name, field]) => ({
    name,
    in: 'query',
    required: false,
    schema: fromZod(field as z.ZodType),
  }));
}

export const pathParam = (name: string, schema: JsonSchema = { type: 'integer', minimum: 1 }) => ({
  name,
  in: 'path',
  required: true,
  schema,
});

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ref('Error') } },
});

export const errors = {
  400: errorResponse('Validation error'),
  401: errorResponse('Authentication required'),
  403: errorResponse('Forbidden'),
  404: errorResponse('Not found'),
  409: errorResponse('Conflict'),
  413: errorResponse('Payload too large'),
  415: errorResponse('Unsupported media type'),
  429: errorResponse('Too many requests'),
};

/** Security requirement for authenticated operations (cookie or bearer token). */
export const authenticated = [{ cookieAuth: [] }, { bearerAuth: [] }];
