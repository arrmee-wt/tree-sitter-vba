const assert = require('node:assert/strict');
const { test } = require('node:test');
const Parser = require('tree-sitter');
const language = require('./index');

test('loads the grammar and parses an exported module', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse('Attribute VB_Name = "Module1"\nPublic Sub Hello()\nEnd Sub\n');
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(tree.rootNode.namedChildren.map(node => node.type), ['attribute_statement', 'sub_statement']);
});
