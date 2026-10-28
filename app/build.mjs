import {build, context} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const watch = process.argv.includes('--watch');

await fs.rm(dist, {recursive: true, force: true});
await fs.mkdir(dist, {recursive: true});

const common = {bundle: true, target: ['chrome116'], legalComments: 'none', minify: true, sourcemap: false};

async function copyStatic() {
  for (const f of ['manifest.json']) await fs.copyFile(path.join(root, f), path.join(dist, f));
  await fs.cp(path.join(root, 'assets'), path.join(dist, 'icons'), {recursive: true});
  await fs.cp(path.join(root, 'pages'), path.join(dist, 'pages'), {recursive: true});
}

if (watch) {
  const ctx = await context({...common, entryPoints: ['src/content.js'], outfile: 'dist/content.js'});
  await ctx.watch();
  const bg = await context({...common, entryPoints: ['src/background.js'], outfile: 'dist/background.js'});
  await bg.watch();
  await copyStatic();
  console.log('watching…');
} else {
  await build({...common, entryPoints: ['src/content.js'], outfile: 'dist/content.js'});
  await build({...common, entryPoints: ['src/background.js'], outfile: 'dist/background.js'});
  await copyStatic();
  const stat = async p => (await fs.stat(path.join(dist, p))).size;
  console.log('built dist/:', 'content.js', (await stat('content.js') / 1024).toFixed(0) + 'KB,', 'background.js', (await stat('background.js') / 1024).toFixed(1) + 'KB');
}
