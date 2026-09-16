const content = require('./checkinContent.json');
const labels = ['Not true for me right now', 'Rarely true', 'Sometimes true', 'Mostly true', 'Consistently true'];
const outlookLabels = ['Not sustainable at all', 'Probably not sustainable', 'Unsure', 'Mostly sustainable', 'Very sustainable'];
const outlookQuestion = 'If the conditions surrounding your work remained largely the same, how sustainable would continuing in music leadership feel for you over the next three years?';
const meanings = {
  Strong: 'A meaningful source of support or sustainability.',
  Stable: 'Generally supporting you, with room to strengthen it.',
  'Needs Attention': 'An area that may deserve a closer look.',
  'Under Strain': 'An area where you may be carrying significant pressure.',
};
function signal(average) {
  if (!Number.isFinite(average) || average < 1 || average > 5) throw new Error('Invalid average');
  return average >= 4.25 ? 'Strong' : average >= 3.5 ? 'Stable' : average >= 2.5 ? 'Needs Attention' : 'Under Strain';
}
function validateInput(input, complete = true) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Please check your answers.');
  const answers = {};
  const given = input.answers || {};
  if (typeof given !== 'object' || Array.isArray(given)) throw new Error('Please check your answers.');
  for (const item of content.domains.flatMap(d => d.items)) {
    const value = given[item.id];
    if (value === undefined && !complete) continue;
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('Please answer all 32 statements using the 1–5 scale.');
    answers[item.id] = value;
  }
  const result = { answers };
  for (const field of ['baseline', 'outlook']) {
    const value = input[field];
    if (value === undefined && !complete) continue;
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('Please select a response for clarity and the three-year outlook.');
    result[field] = value;
  }
  for (const field of ['heaviest', 'hope']) {
    const value = input[field] === undefined ? '' : input[field];
    if (typeof value !== 'string' || value.length > 3000) throw new Error('Please keep each reflection under 3,000 characters.');
    result[field] = value;
  }
  result.step = Number.isInteger(input.step) ? Math.max(0, Math.min(10, input.step)) : 0;
  result.consent = input.consent === true;
  if (complete && !result.consent) throw new Error('Please acknowledge who can review your responses.');
  return result;
}
function score(input) {
  const clean = validateInput(input);
  const domains = content.domains.map(domain => {
    const values = domain.items.map(item => clean.answers[item.id]);
    const average = values.reduce((a, b) => a + b, 0) / 4;
    const band = signal(average);
    return { id: domain.id, name: domain.name, average, signal: band, shortMeaning: meanings[band], ...domain.profiles[band] };
  });
  return {
    version: content.version,
    domains,
    supporting: domains.filter(d => d.average >= 3.5).sort((a, b) => b.average - a.average).slice(0, 3).map(d => d.id),
    pressure: domains.filter(d => d.average < 3.5).sort((a, b) => a.average - b.average).slice(0, 3).map(d => d.id),
    outlook: { value: clean.outlook, label: outlookLabels[clean.outlook - 1], question: outlookQuestion,
      reflection: clean.outlook <= 2 ? 'Which conditions make continuing this way feel difficult to imagine? This deserves attention and support.' : clean.outlook === 3 ? 'What would need to become clearer or change for the next three years to feel more sustainable?' : 'What is helping your work feel sustainable, and what deserves protection?' },
    heaviest: clean.heaviest,
    hope: clean.hope,
  };
}
function detectPatterns(snapshot, answers) {
  const d = Object.fromEntries(snapshot.domains.map(d => [d.id, d.average]));
  const patterns = [];
  if (d.confidence >= 4.25 && (d.capacity < 3.5 || d.sustainability < 3.5)) patterns.push('Capable but Carrying Too Much');
  if (d.confidence >= 3.5 && d.voice < 2.5) patterns.push('Equipped but Constrained');
  if (d.program >= 3.5 && d.voice >= 3.5 && d.connection < 2.5) patterns.push('Supported System, Isolated Leader');
  if (d.confidence >= 4.25 && d.capacity >= 3.5 && d.boundaries < 2.5 && d.sustainability < 3.5) patterns.push('High-Functioning, Low-Recovery');
  if (d.program < 2.5 && d.capacity < 2.5) patterns.push('Structural Pressure');
  // The source leaves the advocacy skill/safety threshold undefined. Show items to
  // the reviewer instead of inventing a numerical trigger for that clause.
  return { candidates: patterns, advocacyItems: [1, 2, 3, 4].map(i => answers[`AdvocacyQ${i}Score`]) };
}
function questionnaire() {
  return { version: content.version, labels, outlookLabels, outlookQuestion, domains: content.domains.map(({ id, name, items }) => ({ id, name, items })) };
}
module.exports = { signal, score, validateInput, detectPatterns, questionnaire };
