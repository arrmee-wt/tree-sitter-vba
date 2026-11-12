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

test('parses a PtrSafe Windows API declaration', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse('Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As Long\n');
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(tree.rootNode.namedChildren.map(node => node.type), ['declare_statement']);
});

test('parses an exported class metadata header', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse('VERSION 1.0 CLASS\nBEGIN\n  MultiUse = -1\nEND\nAttribute VB_Name = "Widget"\n');
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(tree.rootNode.namedChildren.map(node => node.type), ['class_header', 'attribute_statement']);
});

test('parses exported UserForm metadata and an FRX reference', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const source = 'VERSION 5.00\nBegin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm1\n Caption = "Example"\n OleObjectBlob = "UserForm1.frx":0000\nEnd\nAttribute VB_Name = "UserForm1"\n';
  const tree = parser.parse(source);
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(tree.rootNode.namedChildren.map(node => node.type), ['form_header', 'attribute_statement']);
  assert.equal(tree.rootNode.descendantsOfType('form_resource_offset')[0].text, '0000');
});

test('parses nested form control and property metadata', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const source = 'VERSION 5.00\nBegin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm1\n Begin MSForms.Frame Frame1\n BeginProperty Font\n Name = "Tahoma"\n EndProperty\n End\nEnd\nAttribute VB_Name = "UserForm1"\n';
  const tree = parser.parse(source);
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.descendantsOfType('form_block').length, 2);
  assert.equal(tree.rootNode.descendantsOfType('form_property_block').length, 1);
});

test('an unfinished string does not consume the next line as a string', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse('Sub Example()\n  Debug.Print "unfinished\n  Debug.Print "next"\nEnd Sub\n');
  const literals = tree.rootNode.descendantsOfType('string_literal');
  assert.equal(tree.rootNode.hasError, true);
  assert.deepEqual(literals.map(node => [node.text, node.startPosition.row, node.endPosition.row]), [['"next"', 2, 2]]);
});

test('VBA doubled quotes remain inside a string', () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse('Attribute VB_Name = "a""b"\n');
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.descendantsOfType('string_literal')[0].text, '"a""b"');
});
