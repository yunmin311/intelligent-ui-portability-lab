import {fileURLToPath} from 'node:url';import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('extension/manifest.json',root),'utf8'));
assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,'0.2.0');
assert.deepEqual(manifest.permissions,['activeTab','scripting']);assert.equal(manifest.host_permissions,undefined);
for(const name of fs.readdirSync(new URL('extension/',root))){
 const source=fs.readFileSync(new URL('extension/'+name,root),'utf8');
 if(name.endsWith('.js'))execFileSync(process.execPath,['--check',fileURLToPath(new URL('extension/'+name,root))]);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|chrome\.cookies|backend-api|\/api\/auth\/session/);
 assert.doesNotMatch(source,/<script[^>]+src=["']https?:/);
 assert.doesNotMatch(source,/DONT_EXPORT_ME|PRIVATE_NOTE_DO_NOT_EXPORT/);
}
assert.match(fs.readFileSync(new URL('extension/popup.js',root),'utf8'),/chatgpt\.com/);
console.log('PASS: manifest, minimum permissions, all extension JS syntax, forbidden network/credential entry points');
