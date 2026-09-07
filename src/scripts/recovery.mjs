export function createRecovery() {
  return { phase: 'ready', ready: 3, replacement: false };
}

export function stopOneReplica(state) {
  if (state.phase === 'recovering') return state;
  return { phase: 'recovering', ready: 2, replacement: true };
}

export function completeRecovery() {
  return createRecovery();
}

export function resetRecovery() {
  return createRecovery();
}
