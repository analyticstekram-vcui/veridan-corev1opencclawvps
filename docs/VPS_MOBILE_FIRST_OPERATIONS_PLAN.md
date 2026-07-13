# Veridan Mobile-First VPS Operations Plan

Status: Draft / Needs Confirmation

This plan prepares Veridan Core for iPhone-first operation without assuming that Codex can continue work after the Windows PC shuts down. The current deployment is verified on the VPS, but persistent remote automation is not yet active.

## Current Execution Boundary

- Current Codex execution environment: local Windows workspace controlling the VPS over SSH.
- VPS target: `peter@67.205.170.15` on port `22`.
- Deployment path: `/home/peter/veridan/veridan-os`.
- Running container: `veridan-core-web`.
- App binding: `127.0.0.1:8080`.
- Current conclusion: the container can run independently on the VPS, but Codex itself is not yet verified as a persistent VPS-side or mobile-accessible runner.

## GitHub Source Of Truth

Deployment files should live on a reviewed branch before promotion to `main`:

- Branch: `infra/vps-deployment`.
- Deployment files: `.dockerignore`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`.
- Do not push directly to `main` without explicit approval.
- Do not commit private keys or secrets.

## Inactive Deployment Workflow

A disabled workflow template is included at:

`/.github/workflows/veridan-vps-deploy.yml.disabled`

It must not be renamed to `.yml` until all required controls exist:

- Dedicated VPS deployment key, separate from the owner's Windows SSH key.
- GitHub Actions secrets:
  - `VERIDAN_VPS_HOST`
  - `VERIDAN_VPS_USER`
  - `VERIDAN_VPS_SSH_PORT`
  - `VERIDAN_VPS_DEPLOY_KEY`
- GitHub production environment approval required before deploy.
- Branch/ref deployment strategy approved.
- Rollback procedure documented and tested.

## Recommended Reverse Proxy

Recommendation: Caddy.

Reason: Caddy is the simplest secure option for one VPS because it can manage automatic HTTPS with less configuration than Nginx plus Certbot.

Until a Veridan-owned domain is confirmed:

- Keep Veridan Core bound to `127.0.0.1:8080`.
- Do not expose port `8080` publicly.
- Do not configure production DNS or HTTPS.
- Future hostname pattern: `app.<veridan-domain>`.

## Mobile Operations Dashboard Requirements

The iPhone-facing operator view should provide read-only status first:

- App health endpoint status.
- Container health status.
- Current deployed commit.
- Recent deployment result.
- Restart policy/status.
- Recent application logs with redaction.
- CPU, memory, disk, and uptime.
- Explicit approval gates for any restart, rollback, or deployment action.

Do not add unrestricted shell execution to the dashboard. Do not add live trading controls.

## Monitoring Plan

Use low-complexity monitoring suitable for a 2-vCPU, 4-GB VPS:

- Docker healthcheck for `veridan-core-web`.
- HTTP check for `http://127.0.0.1:8080/health` from the VPS.
- Disk usage check for `/`.
- Memory pressure check.
- Container restart count check.
- Deployment workflow failure alerts through GitHub Actions once activated.
- Optional later addition: Uptime Kuma or a lightweight external HTTP monitor after HTTPS is configured.

Avoid heavy observability stacks unless the service count grows enough to justify them.

## Security Review Checklist

Requires sudo or owner confirmation for final verification:

- UFW status and rules.
- Fail2Ban status.
- SSH password authentication disabled.
- Root SSH login disabled.
- Automatic security updates enabled.
- Docker group membership and permissions reviewed.
- Only SSH is public before reverse proxy setup.
- No secrets committed to GitHub.
- GitHub deployment key has least privilege.
- Backups are defined before persistent data is introduced.

## Veridan's Mind Mirror Plan

Do not move the only Obsidian vault copy yet.

Source vault path:

`C:\Users\peter\OneDrive\Desktop\obsidians\veridans mind\`

Recommended first stage:

1. Keep the PC vault as the source copy.
2. Create an encrypted or access-controlled VPS mirror.
3. Establish versioned backups before any sync automation.
4. Use one-way sync first from PC to VPS or from Git-backed export to VPS.
5. Avoid two-way sync until conflict handling is designed and tested.
6. Expose no public web access without authentication.

Risks:

- OneDrive sync conflicts.
- Accidental public exposure of private notes.
- Secret leakage in markdown attachments.
- Divergent PC/VPS copies without conflict resolution.

## Blockers Before Mobile-Only Operation

- Dedicated deployment key is not created or stored in GitHub secrets.
- GitHub Actions deployment workflow is intentionally disabled.
- Veridan domain is not confirmed.
- HTTPS/reverse proxy is not configured.
- Security checks requiring sudo need owner approval/input.
- Mobile dashboard is not yet implemented or verified.
- Remote Codex/agent execution after the Windows PC shuts down is not verified.
