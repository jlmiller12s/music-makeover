const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const styles = fs.readFileSync(path.join(__dirname, '..', 'assets', 'styles.css'), 'utf8');

test('loads and applies Sen as the sitewide font', () => {
  assert.match(styles, /fonts\.googleapis\.com\/css2\?family=Sen:/);
  assert.match(styles, /body\s*\{[^}]*font-family:\s*['"]Sen['"]/s);
  assert.match(styles, /button,\s*input,\s*select,\s*textarea\s*\{[^}]*font-family:\s*inherit/s);
});
