// This registry describes data authority, never guesses source application logic.
const ownedPaths=new Set(['/selective-interactions.html','/adapters-a.html','/adapters-b.html','/adapters-composite.html']);
const blocked=h=>h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='chat.openai.com'||h.endsWith('.chat.openai.com');
export function ownedFixtureURL(url){try{const u=new URL(url);return u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)&&ownedPaths.has(u.pathname);}catch{return false;}}
export function sourceAdapter(url,{controlled=false,file=false}={}){
 if(file)return {id:'local-file@1',level:'external-unverified',finiteModels:false,evidence:'model-validated-v1'};
 const u=new URL(url);if(!/^https?:$/.test(u.protocol)||blocked(u.hostname))throw Error('来源未通过采集许可 Gate');
 // A pathname is not identity or proof of source behavior. Every page needs explicit consent.

 if(controlled===true)return {id:'user-contract@1',level:'controlled',finiteModels:true,evidence:'model-validated-v1'};
 return {id:'generic-dom@1',level:'general',finiteModels:false,evidence:null};
}
export const sourceContracts=Object.freeze(['user-contract@1','generic-dom@1','local-file@1']);
