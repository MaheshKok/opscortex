const clamp = (value) => Math.max(0, Math.min(1, value));
const blend = (value) => Math.round(clamp(value) * 1000) / 1000;

export function journeyState(rawProgress) {
  const progress = clamp(rawProgress);
  const enclosure = blend((progress - .22) / .2);
  const replicas = blend((progress - .62) / .2);
  const phase = progress < .22 ? 'application' : progress < .62 ? 'docker' : 'kubernetes';
  return { phase, enclosure, replicas };
}
