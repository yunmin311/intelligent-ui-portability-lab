import {parseSnapshot} from './core/import-snapshot.js';
import {verifyResources} from './core/ir.js';
import {render} from './core/render.js';
import {archive} from './core/archive.js';
self.onmessage=async({data})=>{try{const {operation,snapshot,format,text,strategy,confirmDegradation}=data;let result;if(operation==='parse')result=await parseSnapshot(text);else{await verifyResources(snapshot);result=operation==='archive'?await archive(snapshot,{strategy,confirmDegradation}):render(snapshot,format,{strategy,confirmDegradation});}self.postMessage({result});}catch(error){self.postMessage({error:error.message});}};
