/**
 * Hygraph MCP Server — Keep Her Light Alive Foundation
 *
 * A minimal Model Context Protocol server that exposes tools for:
 *   - createModel / updateModel (schema management via Management API)
 *   - createEntry / publishEntry (content management)
 *   - uploadAsset / linkAsset (media management)
 *
 * Transport: stdio (default for Claude Desktop / Cursor)
 *
 * Setup:
 *   cd cms/mcp-server
 *   npm install
 *   node src/index.js
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "hygraph": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/cms/mcp-server/src/index.js"],
 *         "env": {
 *           "HYGRAPH_ENDPOINT": "...",
 *           "HYGRAPH_MANAGEMENT_TOKEN": "..."
 *         }
 *       }
 *     }
 *   }
 */

require('dotenv').config({ path: '../../.env' });
const readline = require('readline');

const CONTENT_ENDPOINT   = process.env.HYGRAPH_ENDPOINT;
const MGMT_TOKEN         = process.env.HYGRAPH_MANAGEMENT_TOKEN;
const DRY_RUN            = process.env.DRY_RUN === 'true';

// ── MCP Protocol helpers ─────────────────────────────────────────
function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

// ── Hygraph Content API fetcher ──────────────────────────────────
async function hygraphFetch(query, variables = {}) {
  const fetch = (await import('node-fetch')).default;
  if (DRY_RUN) {
    return { dryRun: true, query: query.slice(0, 100), variables };
  }
  const res = await fetch(CONTENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MGMT_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ── Tool definitions (MCP schema) ────────────────────────────────
const TOOLS = [
  {
    name: 'createEntry',
    description: 'Create a new content entry in Hygraph. Requires model API ID and field data.',
    inputSchema: {
      type: 'object',
      properties: {
        modelApiId: { type: 'string', description: 'e.g. Founder, FAQItem, Event, Resource' },
        data: { type: 'object', description: 'Field values as key-value pairs' },
      },
      required: ['modelApiId', 'data'],
    },
  },
  {
    name: 'publishEntry',
    description: 'Publish an existing Hygraph entry to the PUBLISHED stage.',
    inputSchema: {
      type: 'object',
      properties: {
        modelApiId: { type: 'string', description: 'e.g. Founder, FAQItem, Event' },
        id: { type: 'string', description: 'The entry ID returned from createEntry' },
      },
      required: ['modelApiId', 'id'],
    },
  },
  {
    name: 'updateEntry',
    description: 'Update fields on an existing Hygraph entry.',
    inputSchema: {
      type: 'object',
      properties: {
        modelApiId: { type: 'string' },
        id: { type: 'string' },
        data: { type: 'object', description: 'Fields to update' },
      },
      required: ['modelApiId', 'id', 'data'],
    },
  },
  {
    name: 'uploadAsset',
    description: 'Upload an asset (image/PDF) to Hygraph by URL. Returns asset ID.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Public URL of the file to upload' },
        fileName: { type: 'string', description: 'Desired file name in Hygraph' },
      },
      required: ['url'],
    },
  },
  {
    name: 'linkAsset',
    description: 'Link an uploaded asset to a specific field on a content entry.',
    inputSchema: {
      type: 'object',
      properties: {
        modelApiId: { type: 'string' },
        entryId: { type: 'string' },
        fieldApiId: { type: 'string', description: 'e.g. photo, coverImage, ogImage' },
        assetId: { type: 'string' },
      },
      required: ['modelApiId', 'entryId', 'fieldApiId', 'assetId'],
    },
  },
];

// ── Tool handlers ────────────────────────────────────────────────
async function handleCreateEntry({ modelApiId, data }) {
  const mutation = `
    mutation Create($data: ${modelApiId}CreateInput!) {
      create${modelApiId}(data: $data) { id }
    }
  `;
  const result = await hygraphFetch(mutation, { data });
  return { success: true, id: result?.data?.[`create${modelApiId}`]?.id, dryRun: DRY_RUN };
}

async function handlePublishEntry({ modelApiId, id }) {
  const mutation = `
    mutation Publish($id: ID!) {
      publish${modelApiId}(where: { id: $id }, to: PUBLISHED) { id }
    }
  `;
  const result = await hygraphFetch(mutation, { id });
  return { success: true, published: result?.data?.[`publish${modelApiId}`]?.id, dryRun: DRY_RUN };
}

async function handleUpdateEntry({ modelApiId, id, data }) {
  const mutation = `
    mutation Update($id: ID!, $data: ${modelApiId}UpdateInput!) {
      update${modelApiId}(where: { id: $id }, data: $data) { id }
    }
  `;
  const result = await hygraphFetch(mutation, { id, data });
  return { success: true, updated: result?.data?.[`update${modelApiId}`]?.id, dryRun: DRY_RUN };
}

async function handleUploadAsset({ url, fileName }) {
  // Hygraph Management API: upload by URL
  const mutation = `
    mutation UploadAsset($url: String!, $fileName: String) {
      createAsset(data: { url: $url, fileName: $fileName }) { id url }
    }
  `;
  const result = await hygraphFetch(mutation, { url, fileName: fileName || url.split('/').pop() });
  return { success: true, asset: result?.data?.createAsset, dryRun: DRY_RUN };
}

async function handleLinkAsset({ modelApiId, entryId, fieldApiId, assetId }) {
  const mutation = `
    mutation LinkAsset($entryId: ID!, $assetId: ID!) {
      update${modelApiId}(
        where: { id: $entryId }
        data: { ${fieldApiId}: { connect: { id: $assetId } } }
      ) { id }
    }
  `;
  const result = await hygraphFetch(mutation, { entryId, assetId });
  return { success: true, updated: result?.data?.[`update${modelApiId}`]?.id, dryRun: DRY_RUN };
}

// ── MCP stdio dispatch ───────────────────────────────────────────
async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'hygraph-khla', version: '1.0.0' },
    });
  }

  if (method === 'tools/list') {
    return sendResponse(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;
      if (name === 'createEntry')   result = await handleCreateEntry(args);
      else if (name === 'publishEntry') result = await handlePublishEntry(args);
      else if (name === 'updateEntry')  result = await handleUpdateEntry(args);
      else if (name === 'uploadAsset')  result = await handleUploadAsset(args);
      else if (name === 'linkAsset')    result = await handleLinkAsset(args);
      else return sendError(id, -32601, `Unknown tool: ${name}`);

      return sendResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    } catch (err) {
      return sendError(id, -32000, err.message);
    }
  }

  sendError(id, -32601, `Method not found: ${method}`);
}

// ── Main: read JSON-RPC from stdin ───────────────────────────────
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    await handleRequest(req);
  } catch (err) {
    process.stderr.write(`Parse error: ${err.message}\n`);
  }
});

process.stderr.write('[hygraph-mcp] Server started. DRY_RUN=' + DRY_RUN + '\n');
