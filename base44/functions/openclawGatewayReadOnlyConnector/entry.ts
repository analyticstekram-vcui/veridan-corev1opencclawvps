import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

const GATEWAY_URL = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://openclaw.veridancore.com';
const CF_CLIENT_ID = Deno.env.get('CF_ACCESS_CLIENT_ID');
const CF_CLIENT_SECRET = Deno.env.get('CF_ACCESS_CLIENT_SECRET');

// Helper: fetch from gateway with Cloudflare Access headers
const fetchFromGateway = async (endpoint) => {
  const startTime = Date.now();
  try {
    const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Cf-Access-Client-Id': CF_CLIENT_ID,
        'Cf-Access-Client-Secret': CF_CLIENT_SECRET,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const latency = Date.now() - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      httpStatus: response.status,
      data,
      latency,
      gatewayOnline: true,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      httpStatus: null,
      data: null,
      latency,
      gatewayOnline: false,
      error: error.message,
    };
  }
};

// Safe snapshot: extract only metadata, no tokens or credentials
const createSafeSnapshot = (data, readType) => {
  if (!data) return null;
  
  if (readType === 'health') {
    return {
      status: data.status || 'unknown',
      uptime_seconds: data.uptime_seconds,
      check_timestamp: data.check_timestamp,
    };
  }
  if (readType === 'version') {
    return {
      version: data.version,
      build_date: data.build_date,
      api_version: data.api_version,
    };
  }
  if (readType === 'status') {
    return {
      operational_mode: data.operational_mode,
      execution_enabled: data.execution_enabled,
      simulated_mode: data.simulated_mode,
      gateway_status: data.gateway_status,
    };
  }
  if (readType === 'capabilities') {
    return {
      read_only_commands_available: data.read_only_commands_available ? data.read_only_commands_available.length : 0,
      mutation_commands_disabled: !data.mutation_commands_available,
      live_execution_disabled: !data.live_execution_enabled,
    };
  }
  if (readType === 'session_status') {
    return {
      active_sessions: data.active_sessions || 0,
      readonly_mode: data.readonly_mode || true,
      mutations_allowed: data.mutations_allowed || false,
    };
  }
  if (readType === 'audit_summary') {
    return {
      total_reads_today: data.total_reads_today,
      total_executions_blocked: data.total_executions_blocked,
      last_audit_entry: data.last_audit_entry,
      policy_violations_detected: data.policy_violations_detected || 0,
    };
  }
  
  return null;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const readType = body.readType || 'health'; // health, version, status, capabilities, session_status, audit_summary
    const connectorReadId = uuidv4();
    const readAt = new Date().toISOString();

    // Determine endpoint based on read type
    let endpoint = '/api/status';
    if (readType === 'health') endpoint = '/api/health';
    if (readType === 'version') endpoint = '/api/version';
    if (readType === 'capabilities') endpoint = '/api/capabilities';
    if (readType === 'session_status') endpoint = '/api/session/status';
    if (readType === 'audit_summary') endpoint = '/api/audit/summary';

    // Fetch from gateway
    const gatewayResult = await fetchFromGateway(endpoint);

    // Create safe snapshot (no credentials, tokens, or sensitive data)
    const safeSnapshot = createSafeSnapshot(gatewayResult.data, readType);

    // Log the read to audit entity
    const auditRecord = {
      connectorReadId,
      operatorId: user.email || 'unknown',
      readType,
      gatewayUrl: GATEWAY_URL,
      success: gatewayResult.success,
      httpStatus: gatewayResult.httpStatus,
      responseDataSize: gatewayResult.data ? JSON.stringify(gatewayResult.data).length : 0,
      errorMessage: gatewayResult.error || null,
      gatewayOnline: gatewayResult.gatewayOnline,
      latencyMs: gatewayResult.latency,
      summarySnapshot: safeSnapshot,
      readAt,
      note: 'Read-only gateway connector. No execution, credentials, or mutations. Logged for audit trail.',
    };

    try {
      await base44.asServiceRole.entities.OpenClawGatewayConnectorLog.create(auditRecord);
    } catch (auditErr) {
      console.error('Failed to log gateway read:', auditErr);
      // Don't fail the whole request if audit logging fails
    }

    // Return response
    return Response.json({
      success: gatewayResult.success,
      gatewayOnline: gatewayResult.gatewayOnline,
      readType,
      httpStatus: gatewayResult.httpStatus,
      latencyMs: gatewayResult.latency,
      data: gatewayResult.data,
      safeSnapshot,
      connectorReadId,
      readAt,
      error: gatewayResult.error || null,
    });

  } catch (error) {
    console.error('Gateway connector error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});