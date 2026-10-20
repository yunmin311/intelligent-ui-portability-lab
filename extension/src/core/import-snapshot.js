import {externalImport} from './interactions.js';
import {verifyResources,migrate,LIMITS,bytes} from './ir.js';
// Parse in a terminable Worker. File identity/evidence never bypasses local validation.
export async function parseSnapshot(text){
 if(typeof text!=='string'||bytes(text)>LIMITS.bytes)throw Error('JSON 超过 4 MB');
 const raw=JSON.parse(text);
 if(raw?.schemaVersion==='0.2.0')return migrate(raw);
 if(!['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0'].includes(raw?.schemaVersion))throw Error('不支持的 schemaVersion');
 const base={...raw,source:{type:'json',origin:'local'},provenance:{method:'local-file',status:'external-unverified'},security:{redacted:false,remoteResources:false,scripts:false}};
 delete base.behaviors;
 const s=migrate(base);
 if(raw.schemaVersion==='1.0.0'&&raw.behaviors!==undefined)throw Error('旧版不允许交互声明');
 return verifyResources(externalImport({...s,behaviors:raw.behaviors}));
}
