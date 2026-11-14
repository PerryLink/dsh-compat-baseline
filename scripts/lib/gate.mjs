// Shared risk / gate heuristic. Kept out of collect.mjs so the audit writer and
// the weekly collector cannot drift onto two different gate implementations.

export const RISK_LEVELS = ['low', 'medium', 'high', 'unknown'];
export const GATE_DECISIONS = ['blocked', 'review', 'pilot', 'production-candidate'];

export function riskOf(caps = []) {
  const high = caps.filter(c => /subprocess|fs:write|shell|exec|listen|process|danger/i.test(c));
  const med = caps.filter(c => /network:egress|fs:read|sessions:read|tools:register|client:/i.test(c));
  const level = high.length ? 'high' : med.length ? 'medium' : caps.length ? 'low' : 'unknown';
  const reasons = [];
  if (high.length) reasons.push('high-capability: ' + high.join(', '));
  if (med.length) reasons.push('medium-capability: ' + med.join(', '));
  if (!caps.length) reasons.push('no capability manifest');
  return { level, capabilities: caps, reasons };
}

export function gateOf(compat, standards, risk) {
  const reasons = [];
  if (compat === 'declared-incompatible') return { decision: 'blocked', reasons: ['declared range excludes latest host'] };
  if (['failed', 'blocked'].includes(standards.entry.status)) return { decision: 'blocked', reasons: ['ENTRY ' + standards.entry.status] };
  if (compat === 'unknown') return { decision: 'review', reasons: ['no declared DSH range'] };
  if (risk.level === 'high') return { decision: 'review', reasons: ['high-capability surface: ' + risk.capabilities.join(', ')] };
  if (standards.entry.status === 'runtime' && ['runtime', 'manual'].includes(standards.flow.status) && ['low', 'medium'].includes(risk.level)) {
    return { decision: 'production-candidate', reasons: ['compat + ENTRY runtime + FLOW ' + standards.flow.status + ' + risk ' + risk.level] };
  }
  const r = ['compatible, but unverified'];
  if (standards.entry.status === 'unknown') r.push('no dsh.standards declaration');
  else r.push('ENTRY ' + standards.entry.status + ', FLOW ' + standards.flow.status);
  return { decision: 'pilot', reasons: r };
}
