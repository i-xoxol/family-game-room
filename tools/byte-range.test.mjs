import test from 'node:test';
import assert from 'node:assert/strict';
import { byteRange } from './byte-range.mjs';
test('Safari audio probes, open ranges, and suffix requests return bounded byte intervals', () => {
  assert.equal(byteRange(undefined, 100), null);
  assert.deepEqual(byteRange('bytes=0-1', 100), { start: 0, end: 1, length: 2 });
  assert.deepEqual(byteRange('bytes=20-', 100), { start: 20, end: 99, length: 80 });
  assert.deepEqual(byteRange('bytes=-10', 100), { start: 90, end: 99, length: 10 });
  assert.deepEqual(byteRange('bytes=80-999', 100), { start: 80, end: 99, length: 20 });
  assert.deepEqual(byteRange('bytes=-999', 100), { start: 0, end: 99, length: 100 });
});
test('unsatisfiable or malformed ranges never produce an invalid file stream', () => {
  for (const h of ['bytes=100-', 'bytes=7-1', 'bytes=-0', 'bytes=-', 'bytes=0-1,4-5', 'bytes=999999999999999999999-']) {
    assert.deepEqual(byteRange(h, 100), { invalid: true });
  }
  assert.deepEqual(byteRange('bytes=0-0', 0), { invalid: true });
});
