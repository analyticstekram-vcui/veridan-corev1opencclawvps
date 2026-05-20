/**
 * obsidianVpsDryRunBridge
 * Sends a validated bridge packet to the VPS Obsidian dry-run endpoint.
 * Hard constraints:
 * - Dry-run only — calls /api/obsidian/dry-run exclusively
 * - No filesystem writes
 * - No OpenClaw dispatch
 * - No Obsidian sync
 * - No VPS command execution
 * - No live mode
 * - Bridge token injected server-side only — never exposed to frontend
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { folder, title, markdownContent, evidenceId, frontmatter } = body;

    // Input validation — enforce same rules as frontend
    if (!folder || !title || !markdownContent) {
      return Response.json({ error: 'Missing required fields: folder, title, markdownContent' }, { status: 400 });
    }

    const VAULT_ROOT = '/opt/veridan/obsidian-vault';
    const ALLOWED_FOLDERS = [
      'Veridan Core',
      'Veridan Core/Trading',
      'Veridan Core/Public Credit',
      'Veridan Core/Business Formation',
      'Veridan Core/AI Command',
      'Veridan Core/OpenClaw Governance',
      'Veridan Core/Audit & Evidence',
      'Veridan Core/Baselines',
      'Veridan Core/Trading/Strategies',
      'Veridan Core/Trading/Risk Rules',
      'Veridan Core/Public Credit/Credit Profiles',
      'Veridan Core/Public Credit/Disputes',
      'Veridan Core/Business Formation/Entity Registry',
      'Veridan Core/Business Formation/EIN & Banking',
    ];

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return Response.json({ error: 'Target folder not in allowlist' }, { status: 400 });
    }

    const BLOCKED_TRAVERSAL   = ['../', '..\\'];
    const BLOCKED_SHELL_CHARS = [';', '&&', '||', '`', '$(', '|', '>', '<', '#!', 'bash', 'sh ', 'exec', 'eval', 'curl', 'wget', 'rm ', 'chmod', 'sudo'];
    const BLOCKED_EXTENSIONS  = ['.sh', '.py', '.rb', '.js', '.ts', '.exe', '.bat', '.cmd', '.ps1', '.php', '.pl', '.go'];
    const CREDENTIAL_PATTERNS = ['password', 'passwd', 'secret', 'api_key', 'apikey', 'private_key', 'credentials', 'auth_token'];

    const combined = (folder + '/' + title).toLowerCase();
    for (const t of BLOCKED_TRAVERSAL) {
      if (combined.includes(t)) return Response.json({ error: `Path traversal detected: ${t}` }, { status: 400 });
    }
    for (const cmd of BLOCKED_SHELL_CHARS) {
      if (combined.includes(cmd)) return Response.json({ error: `Shell pattern detected: ${cmd}` }, { status: 400 });
    }
    for (const ext of BLOCKED_EXTENSIONS) {
      if (combined.endsWith(ext)) return Response.json({ error: `Blocked extension: ${ext}` }, { status: 400 });
    }
    for (const cred of CREDENTIAL_PATTERNS) {
      if (combined.includes(cred)) return Response.json({ error: `Credential pattern detected: ${cred}` }, { status: 400 });
    }
    if (/[<>:"/\\|?*\x00-\x1f]/.test(title)) {
      return Response.json({ error: 'Note title contains disallowed characters' }, { status: 400 });
    }

    const fileName    = `${title}.md`;
    const wouldWrite  = `${VAULT_ROOT}/${folder}/${fileName}`;
    const markdownBytes = new TextEncoder().encode(markdownContent).length;

    // Build the payload for the VPS dry-run endpoint
    const bridgePayload = {
      action: 'DRY_RUN_WRITE_NOTE',
      vaultRoot: VAULT_ROOT,
      targetFolder: folder,
      fileName,
      wouldWritePath: wouldWrite,
      markdownContent,
      frontmatter: frontmatter || '',
      markdownBytes,
      evidenceId: evidenceId || `SRV-DR-${Date.now().toString(36).toUpperCase()}`,
      bridgeMode: 'VPS_OBSIDIAN_BRIDGE_DRY_RUN',
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
      filesystemWrite: 'DISABLED',
      obsidianSync: 'DISABLED',
      openClawDispatch: 'DISABLED',
      requestedBy: user.email,
      clientTimestamp: new Date().toISOString(),
    };

    const bridgeUrl   = Deno.env.get('OBSIDIAN_VPS_BRIDGE_URL');
    const bridgeToken = Deno.env.get('VERIDAN_BRIDGE_TOKEN');

    if (!bridgeUrl) {
      return Response.json({ error: 'Bridge not configured — OBSIDIAN_VPS_BRIDGE_URL missing. Set it to https://bridge.veridancore.com in App Secrets.' }, { status: 503 });
    }
    if (!bridgeToken) {
      return Response.json({ error: 'Bridge not configured — VERIDAN_BRIDGE_TOKEN missing.' }, { status: 503 });
    }

    const endpoint = `${bridgeUrl.replace(/\/$/, '')}/api/obsidian/dry-run`;

    const vpsResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bridgeToken}`,
        'X-Bridge-Mode': 'VPS_OBSIDIAN_DRY_RUN',
        'X-Execution-Status': 'NOT_EXECUTED',
      },
      body: JSON.stringify(bridgePayload),
    });

    const responseText = await vpsResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    if (!vpsResponse.ok) {
      return Response.json({
        error: `VPS bridge returned ${vpsResponse.status}`,
        bridgeStatus: vpsResponse.status,
        details: responseData,
      }, { status: 502 });
    }

    // Return a normalized response — never echo the bridge token back
    return Response.json({
      ok: true,
      bridgeMode:      responseData.bridgeMode      || 'VPS_OBSIDIAN_BRIDGE_DRY_RUN',
      action:          responseData.action           || bridgePayload.action,
      vaultRoot:       responseData.vaultRoot        || VAULT_ROOT,
      targetFolder:    responseData.targetFolder     || folder,
      fileName:        responseData.fileName         || fileName,
      wouldWritePath:  responseData.wouldWritePath   || wouldWrite,
      markdownBytes:   responseData.markdownBytes    || markdownBytes,
      previewHash:     responseData.previewHash      || null,
      evidenceId:      responseData.evidenceId       || bridgePayload.evidenceId,
      filesystemWrite: responseData.filesystemWrite  || 'DISABLED',
      executionStatus: responseData.executionStatus  || 'NOT_EXECUTED',
      dispatchStatus:  responseData.dispatchStatus   || 'NOT_DISPATCHED',
      obsidianSync:    responseData.obsidianSync     || 'DISABLED',
      openClawDispatch: responseData.openClawDispatch || 'DISABLED',
      timestamp:       responseData.timestamp        || new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});