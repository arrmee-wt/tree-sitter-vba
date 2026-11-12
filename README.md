# tree-sitter-vba

Parse VBA into a syntax tree, search for code structure with ast-grep, and build your own analysis tools with Node.js.

**tree-sitter-vba** is a [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for Visual Basic for Applications (VBA). It gives applications access to syntax nodes and source locations in exported VBA source files.

[![Test](https://github.com/arrmee-wt/tree-sitter-vba/actions/workflows/test.yml/badge.svg)](https://github.com/arrmee-wt/tree-sitter-vba/actions/workflows/test.yml) · [npm package](https://www.npmjs.com/package/@arrmee/tree-sitter-vba) · [Report an issue](https://github.com/arrmee-wt/tree-sitter-vba/issues)

Built to bring VBA to **ast-grep**, the project combines a ready-to-use structural search example with a Node.js binding. The npm package includes a Windows x64 prebuilt binding, so a matching installation of this binding can load without compiling it locally. Other platforms may require a native toolchain.

## Quick start

Install the grammar and its Tree-sitter runtime:

```sh
npm install @arrmee/tree-sitter-vba tree-sitter
```

Create `hello-vba.cjs`:

```js
const Parser = require('tree-sitter');
const vba = require('@arrmee/tree-sitter-vba');

const parser = new Parser();
parser.setLanguage(vba);
const tree = parser.parse('Public Sub Hello()\nEnd Sub\n');
console.log(tree.rootNode.toString());
```

Run `node hello-vba.cjs`. The resulting tree identifies the procedure and its name:

```text
(source_file (sub_statement (identifier)))
```

Continue with [a complete Node.js example](#use-from-nodejs), [syntax-aware search with ast-grep](#use-with-ast-grep), or [the command-line parser](#use-the-tree-sitter-cli).

> **Project status:** experimental. The grammar does not yet cover all VBA syntax, and its syntax tree API can change. Test it against your own files before relying on it. The README describes the repository's current state; a published npm version may not contain changes made after that version was released.

## At a glance

| You want to… | What this project provides | Where to start |
| --- | --- | --- |
| Find VBA procedures structurally | An ast-grep language configuration and a `sub_statement` rule | [Use with ast-grep](#use-with-ast-grep) |
| Parse VBA in a Node.js application | A Tree-sitter language binding | [Use from Node.js](#use-from-nodejs) |
| Inspect a file's syntax tree from a terminal | The standard Tree-sitter CLI can load the repository grammar | [Use the Tree-sitter CLI](#use-the-tree-sitter-cli) |
| Inspect or improve the grammar | Grammar source, generated parser and test corpus | [Develop and test](#develop-and-test) |
| Add VBA features to an editor or language server | A syntax parser to evaluate and integrate | [Parser and language server](#parser-and-language-server) |

## What is a syntax tree?

Consider a VBA file containing both a real procedure and a comment mentioning `Sub`:

```vb
' Sub is a VBA keyword
Public Sub Hello()
End Sub
```

A plain text search for `Sub` finds both. A syntax-aware tool can instead look for a `sub_statement` node. Tree-sitter retains the relationship between source text and syntax nodes and supports incremental parsing, which is useful for interactive tools. Whether this particular grammar correctly identifies a given construct depends on its current coverage.

The parser reads **VBA source text**, such as code exported from Office. It does not open `.xlsm` files, extract macros from workbooks, or execute VBA. Export the VBA modules first, or supply the extracted source text through another tool.

## Where a VBA parser can be useful

* **Code search and review:** find declarations by syntax node and use source ranges to show matches in their original files. The repository includes one tested ast-grep rule for `Sub` procedures.
* **Inventory and navigation:** an application can inspect procedure and declaration nodes to build an outline of a module or collect candidate symbols. A project-wide index and symbol resolver are not included.
* **Editor integrations:** syntax trees can support highlighting and folding during editing. This repository does not yet provide tested `highlights.scm`, `folds.scm` or `tags.scm` query files, or an editor extension.
* **Code quality and transformation:** an application can use tree structure as input to a linter, formatter or refactoring tool. These tools and their correctness checks are not included.
* **AI-assisted development:** an agent or another application can use parsed node types and source ranges as structured context. This package does not provide an MCP server or a standalone AI agent.

These are integration opportunities, not guarantees that every VBA construct is parsed accurately. Start with the [tested scope and limitations](#supported-and-known-limitations), and validate the exact constructs and source files your application needs.

## Use the Tree-sitter CLI

The [Tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/cli/overview.html) is a separate, general-purpose development tool. It can load this repository's grammar, show syntax trees and run corpus tests; this npm package does not install its own `tree-sitter-vba` command.

From a checkout of this repository, with a compatible `tree-sitter` CLI installed, inspect the included VBA sample:

```sh
tree-sitter parse test/simple.bas
```

The output includes `source_file`, `sub_statement` and `function_statement` nodes and their source ranges. The current grammar may represent an assignment as an expression, so inspect the actual tree before depending on a node's meaning. Tree-sitter may also warn about missing parser-directory configuration even when it can load the grammar from the current checkout.

To check the grammar against its expected examples, run:

```sh
tree-sitter test
```

The CLI inspects source and syntax; it does not launch Excel, execute macros, or turn the parser into a language server. For the separate ast-grep structural-search example, see [Use with ast-grep](#use-with-ast-grep).

## Use from Node.js

Install the grammar and the Tree-sitter runtime in your application:

```sh
npm install @arrmee/tree-sitter-vba tree-sitter
```

Save this as `parse-vba.cjs`:

```js
const Parser = require('tree-sitter');
const vba = require('@arrmee/tree-sitter-vba');

const parser = new Parser();
parser.setLanguage(vba);
const tree = parser.parse('Attribute VB_Name = "Module1"\nPublic Sub Hello()\nEnd Sub\n');

console.log(tree.rootNode.toString());
console.log('Parse errors:', tree.rootNode.hasError);
for (const node of tree.rootNode.namedChildren) {
  console.log(node.type, node.startPosition, node.endPosition);
}
```

Run `node parse-vba.cjs`. The top-level named nodes for this example are `attribute_statement` and `sub_statement`. `hasError` identifies parser recovery errors; a tree without errors does **not** prove that the source is semantically valid or that every node has the intended interpretation.

The repository declares `tree-sitter` version `^0.25.0` as an optional peer dependency. Install the runtime explicitly when using the Node binding. A Windows x64 prebuilt binding is included. Other platforms currently fall back to a native build and may need a C/C++ toolchain; a prebuilt binary for every OS and architecture is not yet provided. The Tree-sitter runtime's own installation requirements also apply.

## Use with ast-grep

The repository includes an example rule that finds `sub_statement` nodes in VBA source:

```yaml
id: find-subs
language: vba
rule:
  kind: sub_statement
```

In a **trusted checkout** on Windows x64, run:

```sh
npx --yes --package @ast-grep/cli@0.51.2 ast-grep scan --custom-languages allow --config sgconfig.yml --rule rules/find_subs.yml --json test/simple.bas
```

The JSON result should contain a match for `Sub Test`. The sample rule looks for procedures, not `Function` declarations. `--custom-languages allow` permits ast-grep to load a native library; use it only when you trust the configured library.

The current repository configuration is:

```yaml
ruleDirs:
  - rules
customLanguages:
  vba:
    libraryPath: ./tree_sitter_vba.dll
    extensions: [bas, cls, frm]
    expandoChar: $
```

Extensions are specified **without** the dot. The supplied DLL and configuration are for Windows x64; for another platform, build a compatible shared library and adjust `libraryPath`. See [ast-grep's custom-language documentation](https://ast-grep.github.io/advanced/custom-language.html). The repository has been tested with ast-grep 0.51.2 on Windows x64 using a simple procedure fixture under all three extensions. This verifies language loading and file matching, not complete `.cls` or `.frm` compatibility.

## Parser and language server

Tree-sitter builds a syntax tree. A language server uses the Language Server Protocol (LSP) to offer editor features; useful definition lookup, references, completion, rename and semantic diagnostics additionally require symbol, scope and type analysis.

Installing this package alone therefore does **not** add those features to OpenCode, VS Code or an existing VBA language server. An application must explicitly load and use the parser. [SSlinky/VBA-LanguageServer](https://github.com/SSlinky/VBA-LanguageServer) is a separate server based on an ANTLR grammar; this package is not currently integrated into it. Any future integration needs its own adapter, validation and license review.

## Supported and known limitations

| Area | Current evidence or limitation |
| --- | --- |
| Procedures and declarations | The test corpus covers selected `Sub`, `Function`, `Property`, type, enum and declaration examples. It is not exhaustive. |
| Exported attributes | Basic module and member `Attribute` examples have corpus tests. |
| Exported class metadata | A corpus fixture covers a `VERSION 1.0 CLASS` header, numeric `BEGIN`/`END` properties, attributes and a procedure. Other class variants still need validation. |
| Windows API declarations | The current repository tests selected `Declare PtrSafe`, `Lib`, `Alias`, parameter and return-type forms. These changes may not yet be in the published npm release. |
| Control flow | The corpus covers selected `If`, `For`, `Do`, `Select Case`, `With` and error-handling examples. |
| Conditional compilation | Directives are individual nodes. Conditions are not evaluated, an active branch is not selected, and matching directives are not validated. |
| Calls without parentheses | `MsgBox "text"` may be split into separate expressions rather than one call. |
| Exported classes and forms | Selected class headers and synthetic UserForm examples, including FRX references, nested controls and property blocks, have corpus tests. `.cls` and `.frm` extension mapping is tested separately. Full exported class and UserForm formats need further validation. |
| VBA semantics | Name resolution, type checking and host-specific behavior are outside this grammar. |

The parser can recover from incomplete or invalid input. Recovery nodes and apparently valid-looking trees should be checked against representative real-world files and the consuming application's needs.

## Develop and test

Key files:

```text
grammar.js                 Tree-sitter grammar
src/                       Generated parser and node metadata
bindings/node/             Node.js binding and tests
prebuilds/win32-x64/       Windows x64 prebuilt Node binding
test/corpus/               Grammar test cases
sgconfig.yml, rules/       ast-grep configuration and example rule
tree_sitter_vba.dll        Windows x64 parser library used by sgconfig.yml
tree_sitter_vba_gnu.dll    Older Windows library; not rebuilt for the latest grammar
```

With a compatible Node.js installation, a C/C++ toolchain where needed, and the [Tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers/) available on your PATH:

```sh
npm install
tree-sitter generate
npm test
```

`npm test` runs the grammar corpus and Node binding tests. On Windows x64, the separate ast-grep integration check can be run with:

```sh
npm run test:ast-grep
```

The ast-grep check obtains `@ast-grep/cli@0.51.2` through npm if it is not already available. It tests the configured Windows DLL against simplified `.bas`, `.cls` and `.frm` fixtures. If you change the grammar, regenerate the parser **and rebuild any native bindings or shared libraries** used by consumers; source changes alone do not update shipped binaries. Verify each rebuilt artifact with the application that will load it.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Cannot find module 'tree-sitter'` | Install `tree-sitter` in the consuming project alongside the grammar. |
| Native binding fails to load or install | Check OS and CPU architecture, Node compatibility and whether a matching prebuild is present; other platforms may need a C/C++ build toolchain. |
| ast-grep finds no matches | Check the rule kind, file extension, `sgconfig.yml`, DLL path and architecture, and the `--custom-languages allow` option. Start with `test/simple.bas`. |
| The tree contains `ERROR` nodes | Reduce the VBA sample and compare it with the corpus. The grammar does not yet cover all VBA. |
| Syntax tree looks plausible but a tool gives incorrect results | Check node types and source ranges. Semantic analysis and grammar interpretation need their own tests. |

For a bug report, include a small, non-confidential VBA sample, the expected and actual tree or error, the package/repository version, and the OS and Node.js or ast-grep version.

## Origins and license

The initial grammar and this repository's `LICENSE` identify the [Rubberduck VBA](https://github.com/rubberduck-vba/Rubberduck) ANTLR grammar as a source. The Microsoft VBA language specification is also a reference. This project is a Tree-sitter grammar; Rubberduck and its ANTLR grammar remain separate projects.

`package.json` declares GPL-3.0, while [LICENSE](LICENSE) contains GPL version 3 or later terms. Consult the license and upstream materials when reusing or distributing the project. Earlier repository revisions contained conflicting MIT and independence statements; the current file header reflects the stated Rubberduck attribution. A complete provenance review remains useful before combining or redistributing code.
