import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeRecovery,
  createRecovery,
  resetRecovery,
  stopOneReplica,
} from '../src/scripts/recovery.mjs';

test('starts with three ready replicas', () => {
  assert.deepEqual(createRecovery(), {
    phase: 'ready',
    ready: 3,
    replacement: false,
  });
});

test('stopping one replica starts one replacement', () => {
  assert.deepEqual(stopOneReplica(createRecovery()), {
    phase: 'recovering',
    ready: 2,
    replacement: true,
  });
});

test('a duplicate stop during recovery keeps one replacement in flight', () => {
  const recovering = stopOneReplica(createRecovery());
  assert.deepEqual(stopOneReplica(recovering), recovering);
});

test('completion returns to three ready replicas and reset restores the initial state', () => {
  assert.deepEqual(completeRecovery(stopOneReplica(createRecovery())), createRecovery());
  assert.deepEqual(resetRecovery({ phase: 'recovering', ready: 2, replacement: true }), createRecovery());
});
