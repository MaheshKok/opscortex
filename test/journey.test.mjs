import assert from 'node:assert/strict';
import test from 'node:test';
import { journeyState } from '../src/scripts/journey-state.mjs';

test('the application and Docker chapters hold after each transition completes', () => {
  assert.deepEqual(journeyState(.12), { phase: 'application', enclosure: 0, replicas: 0 });
  assert.deepEqual(journeyState(.42), { phase: 'docker', enclosure: 1, replicas: 0 });
  assert.deepEqual(journeyState(.59), { phase: 'docker', enclosure: 1, replicas: 0 });
  assert.deepEqual(journeyState(.9), { phase: 'kubernetes', enclosure: 1, replicas: 1 });
});

test('the timeline is deterministic when scroll reverses through a transform', () => {
  assert.deepEqual(journeyState(.72), { phase: 'kubernetes', enclosure: 1, replicas: .5 });
  assert.deepEqual(journeyState(.32), { phase: 'docker', enclosure: .5, replicas: 0 });
  assert.deepEqual(journeyState(-2), { phase: 'application', enclosure: 0, replicas: 0 });
  assert.deepEqual(journeyState(2), { phase: 'kubernetes', enclosure: 1, replicas: 1 });
});
