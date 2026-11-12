const path = require('node:path');
const grammar = require('node-gyp-build')(path.join(__dirname, '..', '..'));
grammar.name = 'vba';
grammar.nodeTypeInfo = require('../../src/node-types.json');
module.exports = grammar;
