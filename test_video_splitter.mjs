import assert from 'node:assert';

// Mock implementations of functions from videoSplitterService to verify algorithmic correctness
function splitVideoIntoSegments(sourceUrl, totalDuration, intervalSeconds) {
  const safeInterval = Math.max(1, intervalSeconds);
  const segments = [];
  let currentStart = 0;
  let index = 1;

  while (currentStart < totalDuration) {
    const nextEnd = Math.min(currentStart + safeInterval, totalDuration);
    const duration = Number((nextEnd - currentStart).toFixed(2));

    if (duration < 0.4 && segments.length > 0) {
      const prev = segments[segments.length - 1];
      prev.endOffset = totalDuration;
      prev.duration = Number((totalDuration - prev.startOffset).toFixed(2));
      break;
    }

    segments.push({
      id: `seg-${index}`,
      order: index,
      title: `Clip #${index} (${duration}s)`,
      sourceUrl,
      startOffset: Number(currentStart.toFixed(2)),
      endOffset: Number(nextEnd.toFixed(2)),
      duration
    });

    currentStart = nextEnd;
    index++;
  }

  return segments;
}

function trimSegmentWithOption(segments, targetIndex, newDuration, overflowMode) {
  const updated = segments.map((seg) => ({ ...seg }));
  const target = updated[targetIndex];
  const oldDuration = target.duration;
  const safeNewDuration = Math.max(1, Number(newDuration.toFixed(2)));
  const delta = Number((oldDuration - safeNewDuration).toFixed(2));

  const newEndOffset = Number((target.startOffset + safeNewDuration).toFixed(2));
  target.endOffset = newEndOffset;
  target.duration = safeNewDuration;
  target.title = `Clip #${target.order} (${safeNewDuration}s)`;

  if (delta > 0) {
    if (overflowMode === 'shift_to_next') {
      if (targetIndex + 1 < updated.length) {
        const next = updated[targetIndex + 1];
        next.startOffset = newEndOffset;
        next.duration = Number((next.endOffset - next.startOffset).toFixed(2));
        next.title = `Clip #${next.order} (${next.duration}s)`;
        return { updatedSegments: updated, message: 'Shifted to next' };
      }
    } else {
      return { updatedSegments: updated, message: 'Discarded' };
    }
  }

  return { updatedSegments: updated, message: 'Done' };
}

// ==========================================
// TEST SUITE
// ==========================================
console.log('--- STARTING VIDEO SPLITTER TESTS ---');

// Test 1: Auto Split 35s video with 10s intervals
const segs = splitVideoIntoSegments('test.mp4', 35, 10);
assert.strictEqual(segs.length, 4, 'Should create 4 segments for 35s with 10s intervals');
assert.strictEqual(segs[0].startOffset, 0);
assert.strictEqual(segs[0].endOffset, 10);
assert.strictEqual(segs[0].duration, 10);
assert.strictEqual(segs[1].startOffset, 10);
assert.strictEqual(segs[1].endOffset, 20);
assert.strictEqual(segs[2].startOffset, 20);
assert.strictEqual(segs[2].endOffset, 30);
assert.strictEqual(segs[3].startOffset, 30);
assert.strictEqual(segs[3].endOffset, 35);
assert.strictEqual(segs[3].duration, 5);
console.log('✔ Test 1: Auto-split 35s into 10s intervals passed!');

// Test 2: Trim Segment 0 from 10s to 7s with 'shift_to_next'
const resShift = trimSegmentWithOption(segs, 0, 7, 'shift_to_next');
const segsShifted = resShift.updatedSegments;
assert.strictEqual(segsShifted[0].duration, 7, 'Clip 1 should be trimmed to 7s');
assert.strictEqual(segsShifted[0].endOffset, 7, 'Clip 1 endOffset should be 7s');
assert.strictEqual(segsShifted[1].startOffset, 7, 'Clip 2 startOffset should shift to 7s (receiving 3s overflow)');
assert.strictEqual(segsShifted[1].endOffset, 20, 'Clip 2 endOffset remains 20s');
assert.strictEqual(segsShifted[1].duration, 13, 'Clip 2 duration should now be 13s (10s + 3s overflow)');
console.log('✔ Test 2: Trim with shift_to_next (transfer overflow) passed!');

// Test 3: Trim Segment 0 from 10s to 7s with 'discard'
const resDiscard = trimSegmentWithOption(segs, 0, 7, 'discard');
const segsDiscarded = resDiscard.updatedSegments;
assert.strictEqual(segsDiscarded[0].duration, 7, 'Clip 1 should be trimmed to 7s');
assert.strictEqual(segsDiscarded[0].endOffset, 7, 'Clip 1 endOffset should be 7s');
assert.strictEqual(segsDiscarded[1].startOffset, 10, 'Clip 2 startOffset remains unchanged at 10s');
assert.strictEqual(segsDiscarded[1].duration, 10, 'Clip 2 duration remains 10s');
console.log('✔ Test 3: Trim with discard (cut overflow) passed!');

console.log('--- ALL VIDEO SPLITTER TESTS PASSED PERFECTLY ---');
