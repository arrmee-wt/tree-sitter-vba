# tree-sitter-vba

A [Tree-sitter](https://tree-sitter.github.io/) grammar for **Visual Basic for Applications (VBA)**.

Fills the gap of the long-missing tree-sitter VBA parser — the only production-ready open-source VBA grammar for tree-sitter.

## Features

- ✅ **Case-insensitive keywords** — VBA is case-insensitive by nature; `Sub`, `sub`, and `SUB` all match correctly
- ✅ **Line continuation** — supports VBA's `_` line continuation character
- ✅ **Full VBA statement coverage** — `Sub`/`Function`/`Property`, `If`/`ElseIf`/`Else`, `For`/`For Each`/`While`/`Do` loops, `Select Case`, `With`, `Dim`, `Const`, `Set`, `GoTo`, error handling, file I/O, and more
- ✅ **Expression hierarchy** — proper operator precedence for arithmetic, comparison, logical, and concatenation operators
- ✅ **Pre-built DLL** — compiled for Windows with MSVC ABI compatibility (via Zig)

## Project Structure

```
tree-sitter-vba/
├── grammar.js              # Tree-sitter grammar definition
├── src/
│   ├── parser.c            # Generated C parser (1.2M)
│   ├── node-types.json     # AST node type definitions
│   └── grammar.json        # Grammar metadata
├── tree_sitter_vba.dll     # Pre-built Windows DLL (MSVC compatible)
├── sgconfig.yml            # ast-grep custom language config
├── rules/                  # ast-grep search rules
│   └── find_subs.yml       # Example rule: find all Sub procedures
├── test/
│   ├── sample.bas          # Sample VBA test file
│   └── simple.bas          # Simple VBA test file
└── tree-sitter.json        # Tree-sitter configuration
```

## Usage

### As a Tree-sitter grammar

```bash
# Install the grammar
npm install tree-sitter-vba

# Or generate from source
npx tree-sitter generate
npx tree-sitter build
```

### With Python

```python
import ctypes
from tree_sitter import Language, Parser

lib = ctypes.CDLL('./tree_sitter_vba.dll')
lib.tree_sitter_vba.restype = ctypes.c_void_p
lang = Language(lib.tree_sitter_vba())

parser = Parser(lang)
tree = parser.parse(bytes(code, 'utf-8'))
```

### With C/C++

```c
#include "tree_sitter/api.h"
TSLanguage *tree_sitter_vba();

TSLanguage *vba = tree_sitter_vba();
TSParser *parser = ts_parser_new();
ts_parser_set_language(parser, vba);
```

### With ast-grep (custom language)

```yaml
# sgconfig.yml
customLanguages:
  vba:
    libraryPath: ./tree_sitter_vba.dll
    extensions:
      - .bas
      - .cls
      - .frm
```

## Building from Source

### Prerequisites

- [Tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers#installation)
- A C compiler (GCC/MinGW, MSVC, or Zig)

### Generate & Build

```bash
# Generate the C parser from grammar.js
npx tree-sitter generate

# Compile the shared library with Zig (MSVC compatible)
zig cc -shared -O3 -I src src/parser.c -o tree_sitter_vba.dll -target x86_64-windows-msvc
```

## License

GPL-3.0. Derived from the [Rubberduck VBA](https://github.com/rubberduck-vba/Rubberduck) ANTLR4 grammar (Copyright Ulrich Wolffgang, Rubberduck Contributors).

### Legal Notice

This project's grammar definition (`grammar.js`) is a translation of the [Rubberduck VBA](https://github.com/rubberduck-vba/Rubberduck) ANTLR4 grammar files (`VBAParser.g4` / `VBALexer.g4`), which are licensed under GPL-3.0 and copyright by Ulrich Wolffgang and Rubberduck Contributors. As a derivative work, this project inherits the GPL-3.0 license.

The generated C parser (`src/parser.c`) and pre-compiled DLL are outputs of the Tree-sitter toolchain and are distributed under the same GPL-3.0 terms.

All original code in this repository is copyright (C) 2026 tree-sitter-vba Contributors and licensed under GPL-3.0.

If you wish to use this grammar in a proprietary/commercial product without open-sourcing your code, you must either:
1. Rewrite the grammar independently without referencing the Rubberduck ANTLR4 grammar
2. Or use the compiled parser via IPC (process isolation) to avoid GPL copyleft requirements

## Why another VBA parser?

Existing tree-sitter VBA grammars were either:
- **Incomplete** — only parsing a subset of VBScript (`tree-sitter-vbscript`)
- **Wrong language** — targeting VB.NET (`tree-sitter-vb-dotnet`) which has significant syntax differences from VBA
- **Abandoned** — started but never reached production quality

This grammar is a complete translation from the battle-tested [Rubberduck VBA](https://github.com/rubberduck-vba/Rubberduck) ANTLR4 grammar, which has been refined over years by the VBA community. It was translated using AI (Gemma4) with manual validation and extensive testing.
