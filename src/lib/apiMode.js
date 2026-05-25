/**
 * Global API Mode — NO_API_LOCAL_ONLY
 * When API credits are unavailable, all model/GPT calls are disabled.
 * Local workflows remain fully functional.
 */

export const API_MODE = 'NO_API_LOCAL_ONLY';

export const API_MODE_CONFIG = {
  mode: API_MODE,
  aiModelCalls: 'DISABLED',
  openclawGptCalls: 'DISABLED',
  localWorkflows: 'ENABLED',
  disabledFeatures: [
    'SEND_TO_OPENCLAW_PREVIEW',
    'GENERATE_AI_DRAFT',
    'ASK_VERIDAN_AI',
    'SUMMARIZE_WITH_AI',
  ],
  disabledMessage: 'API credits unavailable — use manual/local draft mode.',
};

export function isApiEnabled() {
  return API_MODE !== 'NO_API_LOCAL_ONLY';
}