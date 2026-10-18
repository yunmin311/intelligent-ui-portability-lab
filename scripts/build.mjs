import {build} from 'esbuild';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
await build({entryPoints:['extension/src/capture/picker.js'],bundle:true,format:'iife',target:'chrome114',outfile:'extension/picker.js',legalComments:'none'});
await build({entryPoints:['extension/src/import-sandbox.js'],bundle:true,format:'iife',target:'chrome114',outfile:'extension/import-sandbox.js',legalComments:'none'});
const files=await fs.readdir('extension',{recursive:true});const hashes={};for(const f of files.sort())if(!f.includes('build-info.json')&&(await fs.stat('extension/'+f)).isFile())hashes[f]=createHash('sha256').update(await fs.readFile('extension/'+f)).digest('hex');
await fs.writeFile('extension/build-info.json',JSON.stringify({version:'0.3.0',revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeModified:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),sourceDigest:createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),files:hashes},null,2)+'\n');
