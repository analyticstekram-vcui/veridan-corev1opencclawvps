import { base44 } from '@/api/base44Client';

const invoke = (params) => base44.functions.invoke('veridanApi', params);

export async function postCommand(command) {
  const res = await invoke({ command, _route: 'command' });
  return res.data;
}

export async function postApprove(commandId, approved) {
  const res = await invoke({ commandId, approved, _route: 'approve' });
  return res.data;
}

export async function getLogs() {
  const res = await invoke({ _route: 'logs' });
  return res.data;
}

export async function getStatus() {
  const res = await invoke({ _route: 'status' });
  return res.data;
}