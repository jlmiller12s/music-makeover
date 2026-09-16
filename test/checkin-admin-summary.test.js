const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../assets/checkin-admin-summary');
const make = (scores, outlook = 4) => ({ domains: Object.entries(scores).map(([id,average]) => ({id,name:id,average})), outlook:{value:outlook} });
test('summary prioritizes pressure and preserves score boundaries without mutating results', () => {
  const snapshot = make({connection:3.5,capacity:2,voice:3.25});
  const before = JSON.stringify(snapshot);
  const result = summarize(snapshot);
  assert.deepEqual(result.pressure.map(d=>d.id), ['capacity','voice']);
  assert.deepEqual(result.supporting.map(d=>d.id), ['connection']);
  assert.match(result.feedback,/workload demands/);
  assert.equal(JSON.stringify(snapshot),before);
});
test('positive domain scores do not conceal a low outlook', () => {
  const result=summarize(make({capacity:4.5,voice:4},1));
  assert.equal(result.pressure.length,0);
  assert.match(result.feedback,/continuing under current conditions feels difficult/);
  assert.doesNotMatch(result.feedback,/Start with/);
});
test('uncertain outlook prompts discussion and low domains do not invent strengths', () => {
  const result=summarize(make({connection:1,capacity:2},3));
  assert.equal(result.supporting.length,0);
  assert.match(result.feedback,/trusted peer support/);
  assert.match(result.feedback,/outlook is uncertain/);
});
