import {verifyResources,migrate} from './core/ir.js';
import {render} from './core/render.js';
import {archive} from './core/archive.js';
self.onmessage=async({data})=>{try{const {operation,snapshot,format,text}=data;let result;if(operation==='parse'){if(text.length>4000000)throw Error('JSON 超过 4 MB');const s=migrate(JSON.parse(text));result=s.requiresSanitizedHTML?s:await verifyResources(s);}else{await verifyResources(snapshot);result=operation==='archive'?await archive(snapshot):render(snapshot,format);}self.postMessage({result});}catch(error){self.postMessage({error:error.message});}};
