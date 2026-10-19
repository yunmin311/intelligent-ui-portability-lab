// Closed, versioned registry. Metadata never names source code or expressions.
const definitions={
 'fourier@1':{bindings:['root','harmonics','amplitude','phase','curve','output'],state:['harmonics','amplitude','phase']},
 'table@1':{bindings:['root','filter','sort','body','output'],state:['minimum','direction']},
 'tabs@1':{bindings:['root','tabs','panels'],arrays:['tabs','panels'],state:['active']},
 'calculator@1':{bindings:['root','left','right','output'],state:['left','right']},
 'state@1':{bindings:['root','control','panels'],arrays:['panels'],state:['active']},
 'native-details@1':{bindings:['root'],state:[],native:true}
};
export const adapterRegistry=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([recipe,d])=>[recipe,Object.freeze({recipe,...d,roles:Object.freeze(d.bindings.filter(k=>k!=='root').map(k=>k==='tabs'?'tab':k==='panels'?'panel':k)),arrayRoles:Object.freeze(Object.fromEntries((d.arrays||[]).map(k=>[k,k==='tabs'?'tab':'panel']))),bindings:Object.freeze(d.bindings),state:Object.freeze(d.state),arrays:Object.freeze(d.arrays||[]),capability:d.native?'native-preserved':'model-validated'})])));
export const getAdapter=recipe=>Object.hasOwn(adapterRegistry,recipe)?adapterRegistry[recipe]:null;
export const bindingPaths=b=>Object.values(b).flatMap(v=>Array.isArray(v)?v:[v]);
export function sumValue(left,right){for(const n of [left,right])if(!Number.isFinite(n)||n< -100||n>100||Math.abs(n*100-Math.round(n*100))>1e-8)throw Error('计算参数超限或步长不匹配');return String(Number((left+right).toFixed(2)));}
