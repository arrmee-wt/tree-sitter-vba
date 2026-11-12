const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run test:ast-grep');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tree-sitter-vba-astgrep-'));
try {
  for (const ext of ['bas', 'cls', 'frm']) {
    const file = path.join(temp, `sample.${ext}`);
    fs.writeFileSync(file, "' Sub Fake()\nSub Test()\nEnd Sub\n");
    const result = spawnSync(process.execPath, [npmCli, 'exec', '--yes', '--package', '@ast-grep/cli@0.51.2', '--', 'ast-grep', 'scan', '--custom-languages', 'allow', '--config', path.join(root, 'sgconfig.yml'), '--rule', path.join(root, 'rules', 'find_subs.yml'), '--json', file], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    const matches = JSON.parse(result.stdout);
    assert.equal(matches.length, 1, `Expected one match for .${ext}`);
    assert.match(matches[0].text, /^Sub Test\(\)/);
    console.log(`.${ext}: one Sub matched`);
  }
} finally {
  if (path.dirname(temp) !== os.tmpdir()) throw new Error('Unsafe temporary directory');
  fs.rmSync(temp, { recursive: true, force: true });
}
