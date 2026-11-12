# tree-sitter-vba

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for Visual Basic for Applications (VBA). It turns VBA source into a syntax tree that tools can inspect by node type and location.

[![Test](https://github.com/arrmee-wt/tree-sitter-vba/actions/workflows/test.yml/badge.svg)](https://github.com/arrmee-wt/tree-sitter-vba/actions/workflows/test.yml)

The project began as a way to use VBA with **ast-grep** and its Tree-sitter based structural search. Its grammar can also be evaluated for editor tooling and language servers that need a VBA syntax tree.

## What it can help with

Text search finds characters; a syntax tree represents code structure. For example, an ast-grep rule can look for `sub_statement` nodes instead of every occurrence of the word `Sub`, including occurrences in comments or strings. The repository includes such a rule in [`rules/find_subs.yml`](rules/find_subs.yml).

The grammar defines nodes for procedures, functions, properties, types, enums and other VBA constructs. Tree-sitter supports incremental parsing and error recovery; how well this grammar handles a particular VBA file or incomplete edit must be established by testing.

This project is a **parser grammar**, not a complete language server. Definition lookup, references, rename, completion and semantic diagnostics require additional scope, symbol and type analysis and, for LSP clients, a language server that exposes those features.

## Status and limitations

The grammar and Windows DLLs are available for experimentation. Coverage and compatibility with real exported VBA modules, class modules and forms are still being evaluated; the project does not claim complete VBA coverage or production readiness. Basic exported `Attribute` declarations and conditional compilation directives have corpus coverage; complete exported class/form files require further verification.

Conditional compilation directives are represented as individual syntax nodes. The parser does not evaluate conditions, select an active branch or validate that directives are balanced. Both branches remain in the syntax tree. Some statement forms also need more accurate structure; for example, an unparenthesized `MsgBox "text"` call may currently be split into separate expressions.

The repository maps `.bas`, `.cls` and `.frm` files to the custom language in `sgconfig.yml`. Historical attempts to use the DLL with ast-grep produced no matches in some configurations, so verify loading and matching with your own version and sample before relying on the results. DLL architecture, ABI and Tree-sitter version compatibility may matter.

The supplied `tree_sitter_vba_gnu.dll` has been rebuilt with the basic attribute and conditional directive rules and loaded with Python Tree-sitter; ast-grep compatibility has not been verified. The older `tree_sitter_vba.dll` has not yet been rebuilt with those rules.

## Relationship to VBA language servers

[SSlinky/VBA-LanguageServer](https://github.com/SSlinky/VBA-LanguageServer) is a separate VBA language server that uses an ANTLR grammar. Installing or improving this Tree-sitter grammar does not automatically change that server. A language server could integrate this parser for validated syntax tasks, but it would need its own adapter and semantic analysis. Integration and its licensing implications have not been evaluated in this repository.

## Using with ast-grep

The checked-in [`sgconfig.yml`](sgconfig.yml) configures the GNU Windows DLL as a custom language:

```yaml
ruleDirs:
  - rules
customLanguages:
  vba:
    libraryPath: ./tree_sitter_vba_gnu.dll
    extensions: [.bas, .cls, .frm]
    expandoChar: $
```

The example rule matches nodes of kind `sub_statement`:

```yaml
id: find-subs
language: vba
rule:
  kind: sub_statement
```

Run ast-grep with this configuration and an input file, then check that the reported matches correspond to the actual procedures. The checked-in DLL and your ast-grep build must be compatible.

## Source and build

### Node.js

```bash
npm install @arrmee/tree-sitter-vba tree-sitter
```

```js
const Parser = require('tree-sitter');
const vba = require('@arrmee/tree-sitter-vba');
const parser = new Parser();
parser.setLanguage(vba);
const tree = parser.parse('Attribute VB_Name = "Module1"\nPublic Sub Hello()\nEnd Sub\n');
console.log(tree.rootNode.toString());
```

The package includes a prebuilt Node binding for Windows x64. Other environments need a compatible native build toolchain; the binding and parser must also be compatible with the installed `tree-sitter` runtime.

- `grammar.js` — Tree-sitter grammar definition.
- `src/parser.c`, `src/grammar.json`, `src/node-types.json` — generated parser and grammar metadata.
- `tree_sitter_vba.dll`, `tree_sitter_vba_gnu.dll` — supplied Windows parser libraries.
- `test/corpus/` — grammar test cases; `test/sample.bas` and `test/simple.bas` — example inputs.
- `sgconfig.yml`, `rules/` — ast-grep custom-language configuration and example rule.

With the [Tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers/) and a C compiler installed, the grammar can be generated and tested from the project directory:

```bash
tree-sitter generate
tree-sitter test
```

The repository also documents a Windows build using Zig:

```bash
zig cc -shared -O3 -I src src/parser.c -o tree_sitter_vba.dll -target x86_64-windows-msvc
```

Validate a newly built library with the intended consumer and VBA samples. The package is published as `@arrmee/tree-sitter-vba` and provides a Node binding. Native compilation requires a C/C++ toolchain; installation and bindings have not been verified for every platform or runtime version.

## Origins and license

The initial grammar and the current README and LICENSE identify the [Rubberduck VBA](https://github.com/rubberduck-vba/Rubberduck) ANTLR grammar as a source. The project currently declares GPL-3.0 in `package.json` and GPL version 3 or later in `LICENSE`; consult [LICENSE](LICENSE) and the upstream project when reusing or distributing it.

The Microsoft VBA language specification is also a reference for the grammar. Earlier repository revisions contained conflicting MIT and independence statements; the current header reflects the repository's GPL attribution. A complete provenance review remains useful before combining or redistributing code.
