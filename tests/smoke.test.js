const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('project baseline files exist', () => {
  assert.equal(fs.existsSync('README.md'), true);
  assert.equal(fs.existsSync('db/schema.sql'), true);
});
