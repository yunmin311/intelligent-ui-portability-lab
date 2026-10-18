export const TTL=600000, SESSION_BUDGET=7500000;
export function prune(entries,now=Date.now()){return entries.filter(x=>Number.isFinite(x.created)&&now-x.created>=0&&now-x.created<TTL).slice(-3);}
export function addSession(entries,value,now=Date.now()){const next=prune(entries,now);next.push({...value,created:now});while(next.length>3||new TextEncoder().encode(JSON.stringify(next)).length*2>SESSION_BUDGET){if(next.length===1)throw Error('会话存储容量不足，请缩小区域');next.shift();}return next;}
