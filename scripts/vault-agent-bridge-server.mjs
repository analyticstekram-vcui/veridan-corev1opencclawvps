#!/usr/bin/env node
/**
 * Vault Agent Phase 5 Local Read-Only Bridge Server
 *
 * Endpoint:
 *   GET http://127.0.0.1:57445/vault-agent/reports
 *
 * Boundaries:
 *   - Binds only to 127.0.0.1
 *   - GET only
 *   - Fixed vault path only
 *   - Reads only approved markdown dashboard reports
 *   - Returns sanitized JSON only
 *   - No writes, no mutations, no external APIs, no automation
 */

import http from 'node:http';
import { parseVaultAgentReports, verifyBridgePayloadShape } from './vault-agent-report-parser.mjs';

const HOST = '127.0.0.1';
const PORT = 57445;
const REPORTS_PATH = '/vault-agent/reports';
const VERIFY_PATH = '/vault-agent/verify';

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Veridan-Bridge': 'LIVE_READ_ONLY',
    'X-Veridan-Bridge-Safety': 'GET_ONLY; LOCALHOST_ONLY; NO_WRITES; NO_EXECUTION',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Accept, X-Veridan-Bridge-Mode',
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendMethodNotAllowed(response) {
  response.writeHead(405, {
    Allow: 'GET',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify({
    ok: false,
    error: 'METHOD_NOT_ALLOWED',
    allowedMethods: ['GET'],
    readOnly: true,
    writesEnabled: false,
    executionEnabled: false,
  }));
}

function sendNotFound(response) {
  sendJson(response, 404, {
    ok: false,
    error: 'NOT_FOUND',
    allowedEndpoints: [REPORTS_PATH, VERIFY_PATH],
    readOnly: true,
    writesEnabled: false,
    executionEnabled: false,
  });
}

function sendServerError(response, error) {
  sendJson(response, 500, {
    ok: false,
    error: 'BRIDGE_READ_FAILED',
    reason: error?.message || 'UNKNOWN_ERROR',
    mode: 'LIVE_READ_ONLY',
    source: 'obsidian_vault',
    readOnly: true,
    writesEnabled: false,
    executionEnabled: false,
    openclawEnabled: false,
    brokerEnabled: false,
    bankingEnabled: false,
    tradingEnabled: false,
  });
}

async function handleReports(response) {
  const payload = await parseVaultAgentReports();
  const verification = verifyBridgePayloadShape(payload);

  if (!verification.ok) {
    sendJson(response, 500, {
      ok: false,
      error: 'BRIDGE_PAYLOAD_VERIFICATION_FAILED',
      verification,
      readOnly: true,
      writesEnabled: false,
      executionEnabled: false,
    });
    return;
  }

  sendJson(response, 200, {
    ...payload,
    selfVerification: verification,
  });
}

async function handleVerify(response) {
  const payload = await parseVaultAgentReports();
  const verification = verifyBridgePayloadShape(payload);

  sendJson(response, verification.ok ? 200 : 500, {
    ok: verification.ok,
    mode: 'LIVE_READ_ONLY',
    endpoint: `http://${HOST}:${PORT}${REPORTS_PATH}`,
    generatedAt: new Date().toISOString(),
    verification,
    safety: {
      bindHost: HOST,
      getOnly: true,
      localhostOnly: true,
      fixedVaultPathOnly: true,
      approvedMarkdownReportsOnly: true,
      writesEnabled: false,
      databaseWritesEnabled: false,
      governanceActivationEnabled: false,
      approvalMutationEnabled: false,
      evidenceMutationEnabled: false,
      exceptionMutationEnabled: false,
      openclawExecutionEnabled: false,
      tradingExecutionEnabled: false,
      brokerAccessEnabled: false,
      bankingAccessEnabled: false,
      schedulerEnabled: false,
      automationEnabled: false,
      externalApiCallsEnabled: false,
    },
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET') {
    sendMethodNotAllowed(response);
    return;
  }

  const requestUrl = new URL(request.url || '/', `http://${HOST}:${PORT}`);

  try {
    if (requestUrl.pathname === REPORTS_PATH) {
      await handleReports(response);
      return;
    }

    if (requestUrl.pathname === VERIFY_PATH) {
      await handleVerify(response);
      return;
    }

    sendNotFound(response);
  } catch (error) {
    sendServerError(response, error);
  }
});

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, HOST, () => {
  // Console output only; no files are written and no automation is scheduled.
  console.log(`Vault Agent bridge server listening at http://${HOST}:${PORT}${REPORTS_PATH}`);
  console.log('Mode: LIVE_READ_ONLY · GET_ONLY · LOCALHOST_ONLY · NO_WRITES · NO_EXECUTION');
});
