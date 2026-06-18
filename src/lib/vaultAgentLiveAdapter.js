/**
 * vaultAgentLiveAdapter.js
 * Phase 5 — Live Read-Only Bridge Adapter
 *
 * Attempts a governed GET-only localhost bridge read, validates the payload,
 * and falls back to the Phase 4 mock adapter whenever the bridge is missing,
 * unreachable, or unsafe.
 *
 * This adapter never writes files, mutates entities, activates governance,
 * dispatches OpenClaw, or touches broker/trading/banking systems.
 */

import { MOCK_REPORT_DATA } from './vaultAgentReportAdapter';
import {
  buildBridgeStatus,
  getVaultAgentBridgeUrl,
  verifyBridgePayload,
  verifyBridgeRequest,
} from './vaultAgentBridgeVerifier';

const BRIDGE_TIMEOUT_MS = 2500;

function withBridgeStatus(data, bridgeStatus) {
  return {
    ...data,
    adapterMeta: {
      ...data.adapterMeta,
      mode: bridgeStatus.mode,
      currentPhase: 'Phase 5 Live Read-Only Bridge',
      bridgeEndpoint: bridgeStatus.endpoint,
      bridgeRequestStatus: bridgeStatus.requestStatus,
      bridgePayloadStatus: bridgeStatus.payloadStatus,
      bridgeFallbackActive: bridgeStatus.fallbackActive,
    },
    bridgeStatus,
  };
}

function buildMockFallback(request, payload, error) {
  return withBridgeStatus(
    MOCK_REPORT_DATA,
    buildBridgeStatus({
      mode: 'MOCK_FALLBACK',
      request,
      payload,
      error,
    })
  );
}

function normalizeLivePayload(payload, request, payloadCheck) {
  const bridgeStatus = buildBridgeStatus({
    mode: 'LIVE_READ_ONLY',
    request,
    payload: payloadCheck,
    error: null,
  });

  return withBridgeStatus(
    {
      ...payload,
      adapterMeta: {
        ...payload.adapterMeta,
        mode: 'LIVE_READ_ONLY',
        safetyMode: 'READ_ONLY',
        executionStatus: 'NOT_EXECUTED',
        dispatchStatus: 'NOT_DISPATCHED',
        openclawCall: 'NOT_SENT',
        brokerAccess: 'DISABLED',
        bankAccess: 'DISABLED',
      },
    },
    bridgeStatus
  );
}

async function fetchBridgeJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Veridan-Bridge-Mode': 'READ_ONLY',
      },
    });

    if (!response.ok) {
      throw new Error(`BRIDGE_HTTP_${response.status}`);
    }

    return response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadVaultAgentReportData() {
  const bridgeUrl = getVaultAgentBridgeUrl();
  const requestCheck = verifyBridgeRequest(bridgeUrl, 'GET');

  if (!requestCheck.ok) {
    return buildMockFallback(requestCheck, null, requestCheck.reason);
  }

  try {
    const payload = await fetchBridgeJson(requestCheck.url);
    const payloadCheck = verifyBridgePayload(payload);

    if (!payloadCheck.ok) {
      return buildMockFallback(requestCheck, payloadCheck, payloadCheck.reason);
    }

    return normalizeLivePayload(payload, requestCheck, payloadCheck);
  } catch (error) {
    return buildMockFallback(
      requestCheck,
      null,
      error?.name === 'AbortError' ? 'BRIDGE_TIMEOUT' : error?.message || 'BRIDGE_UNAVAILABLE'
    );
  }
}

export function getVaultAgentMockFallbackData() {
  return buildMockFallback(
    { ok: true, reason: 'BRIDGE_NOT_REQUESTED', url: getVaultAgentBridgeUrl() },
    null,
    null
  );
}
