// Package dist/ into the install ZIP + SHA256SUMS (same layout as dist/).
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'dist', 'manifest.json'), 'utf8'));
const version = manifest.version;
const outDir = path.join(root, 'dist-release');
await fs.rm(outDir, {recursive: true, force: true});
await fs.mkdir(outDir, {recursive: true});
const zipName = `PagePort-v${version}-extension.zip`;
const zipPath = path.join(outDir, zipName);
// python zipfile for a deterministic, dependency-free build
execFileSync('python', ['-c', `
import sys, zipfile, os
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk(src):
        for f in sorted(files):
            full = os.path.join(base, f)
            z.write(full, os.path.relpath(full, src))
`, path.join(root, 'dist'), zipPath]);
// hash everything inside dist (same content as the zip)
const hashes = [];
async function walk(dir) {
  for (const e of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else hashes.push([path.relative(path.join(root, 'dist'), full).replace(/\\/g, '/'), createHash('sha256').update(await fs.readFile(full)).digest('hex')]);
  }
}
await walk(path.join(root, 'dist'));
await fs.writeFile(path.join(outDir, 'SHA256SUMS'), hashes.map(([f, h]) => `${h}  ${f}`).sort().join('\n') + '\n');
await fs.writeFile(path.join(outDir, 'package-manifest.json'), JSON.stringify({name: 'PagePort', version, zip: zipName, builtFrom: 'app/dist', createdAt: new Date().toISOString()}, null, 2));
console.log('packaged:', zipName, (await fs.stat(zipPath)).size, 'bytes');
