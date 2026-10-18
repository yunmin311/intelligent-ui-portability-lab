import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
await fs.mkdir('test-results',{recursive:true});await fs.rm('test-results/verified-build.json',{force:true});
const built=spawnSync('node',['scripts/build.mjs'],{stdio:'inherit'});if(built.status!==0)process.exit(built.status||1);
async function hashes(){const out={};for(const f of (await fs.readdir('extension',{recursive:true})).sort())if((await fs.stat('extension/'+f)).isFile())out[f]=createHash('sha256').update(await fs.readFile('extension/'+f)).digest('hex');return out;}
const before=await hashes();
for(const command of [['node',['tests/check.mjs']],['node',['scripts/schema.mjs','--check']],['node',['--test',...(await fs.readdir('tests/unit')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/unit/'+f)]],['npx',['playwright','test']]]){const r=spawnSync(command[0],command[1],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
const files={};for(const f of (await fs.readdir('extension',{recursive:true})).sort())if((await fs.stat('extension/'+f)).isFile())files[f]=createHash('sha256').update(await fs.readFile('extension/'+f)).digest('hex');
if(JSON.stringify(before)!==JSON.stringify(files))throw Error('Extension changed during testing');
await fs.writeFile('test-results/verified-build.json',JSON.stringify({version:'0.3.0',testedAt:new Date().toISOString(),files},null,2));console.log('Verified extension digest recorded for packaging.');
