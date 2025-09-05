#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Server, StdioServerTransport } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const server = new Server({
  name: 'supabase-mcp-server',
  version: '0.1.0',
});

// Schemas
const tableNameSchema = z.string().min(1);
const filtersSchema = z
  .array(z.object({ column: z.string(), op: z.string(), value: z.any() }))
  .default([]);
const returnColumnsSchema = z.array(z.string()).optional();
const limitSchema = z.number().int().positive().optional();

// Tools
server.tool('supabase.query', {
  description: 'Select rows from a table with optional filters and columns',
  inputSchema: z.object({
    table: tableNameSchema,
    columns: returnColumnsSchema,
    filters: filtersSchema,
    limit: limitSchema,
  }).strict(),
  async handler({ table, columns, filters, limit }) {
    let q = supabase.from(table).select(columns?.length ? columns.join(',') : '*');
    for (const f of filters || []) {
      const op = f.op.toLowerCase();
      if (op === 'eq') q = q.eq(f.column, f.value);
      else if (op === 'neq') q = q.neq(f.column, f.value);
      else if (op === 'gt') q = q.gt(f.column, f.value);
      else if (op === 'gte') q = q.gte(f.column, f.value);
      else if (op === 'lt') q = q.lt(f.column, f.value);
      else if (op === 'lte') q = q.lte(f.column, f.value);
      else if (op === 'like') q = q.like(f.column, f.value);
      else if (op === 'ilike') q = q.ilike(f.column, f.value);
      else if (op === 'is') q = q.is(f.column, f.value);
      else if (op === 'contains') q = q.contains(f.column, f.value);
      else if (op === 'in') q = q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]);
      else throw new Error(`Unsupported op: ${op}`);
    }
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    const text = JSON.stringify(data, null, 2);
    return { content: [{ type: 'text', text }] };
  },
});

server.tool('supabase.insert', {
  description: 'Insert row(s) into a table',
  inputSchema: z.object({
    table: tableNameSchema,
    rows: z.union([z.record(z.any()), z.array(z.record(z.any()))]),
    returning: z.enum(['minimal', 'representation']).default('representation'),
  }).strict(),
  async handler({ table, rows, returning }) {
    const payload = Array.isArray(rows) ? rows : [rows];
    const { data, error } = await supabase.from(table).insert(payload).select(returning === 'representation' ? '*' : undefined);
    if (error) throw error;
    const text = JSON.stringify(data ?? null, null, 2);
    return { content: [{ type: 'text', text }] };
  },
});

server.tool('supabase.update', {
  description: 'Update rows in a table by filters',
  inputSchema: z.object({
    table: tableNameSchema,
    values: z.record(z.any()),
    filters: filtersSchema,
    returning: z.enum(['minimal', 'representation']).default('representation'),
  }).strict(),
  async handler({ table, values, filters, returning }) {
    let q = supabase.from(table).update(values);
    for (const f of filters || []) {
      const op = f.op.toLowerCase();
      if (op === 'eq') q = q.eq(f.column, f.value);
      else if (op === 'neq') q = q.neq(f.column, f.value);
      else if (op === 'gt') q = q.gt(f.column, f.value);
      else if (op === 'gte') q = q.gte(f.column, f.value);
      else if (op === 'lt') q = q.lt(f.column, f.value);
      else if (op === 'lte') q = q.lte(f.column, f.value);
      else if (op === 'like') q = q.like(f.column, f.value);
      else if (op === 'ilike') q = q.ilike(f.column, f.value);
      else if (op === 'is') q = q.is(f.column, f.value);
      else if (op === 'contains') q = q.contains(f.column, f.value);
      else if (op === 'in') q = q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]);
      else throw new Error(`Unsupported op: ${op}`);
    }
    const { data, error } = await q.select(returning === 'representation' ? '*' : undefined);
    if (error) throw error;
    const text = JSON.stringify(data ?? null, null, 2);
    return { content: [{ type: 'text', text }] };
  },
});

server.tool('supabase.delete', {
  description: 'Delete rows from a table by filters',
  inputSchema: z.object({
    table: tableNameSchema,
    filters: filtersSchema,
    returning: z.enum(['minimal', 'representation']).default('representation'),
  }).strict(),
  async handler({ table, filters, returning }) {
    let q = supabase.from(table).delete();
    for (const f of filters || []) {
      const op = f.op.toLowerCase();
      if (op === 'eq') q = q.eq(f.column, f.value);
      else if (op === 'neq') q = q.neq(f.column, f.value);
      else if (op === 'gt') q = q.gt(f.column, f.value);
      else if (op === 'gte') q = q.gte(f.column, f.value);
      else if (op === 'lt') q = q.lt(f.column, f.value);
      else if (op === 'lte') q = q.lte(f.column, f.value);
      else if (op === 'like') q = q.like(f.column, f.value);
      else if (op === 'ilike') q = q.ilike(f.column, f.value);
      else if (op === 'is') q = q.is(f.column, f.value);
      else if (op === 'contains') q = q.contains(f.column, f.value);
      else if (op === 'in') q = q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]);
      else throw new Error(`Unsupported op: ${op}`);
    }
    const { data, error } = await q.select(returning === 'representation' ? '*' : undefined);
    if (error) throw error;
    const text = JSON.stringify(data ?? null, null, 2);
    return { content: [{ type: 'text', text }] };
  },
});

server.tool('supabase.rpc', {
  description: 'Call a Supabase PostgREST RPC (Postgres function)',
  inputSchema: z.object({
    fn: z.string().min(1),
    args: z.record(z.any()).optional(),
  }).strict(),
  async handler({ fn, args }) {
    const { data, error } = await supabase.rpc(fn, args ?? {});
    if (error) throw error;
    const text = JSON.stringify(data ?? null, null, 2);
    return { content: [{ type: 'text', text }] };
  },
});

// Start server over stdio
const transport = new StdioServerTransport();
await server.connect(transport);


