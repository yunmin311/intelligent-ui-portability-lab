import {validateBehaviors} from './interactions.js';
import {rasterDimensions} from './raster.js';
import {allowedHtml,allowedSvg,allowedMath,allowedAttributes,styleProps,safeCss,localReference} from './policy.js';
export const VERSION='1.4.0';
export const LIMITS=Object.freeze({nodes:5000,depth:75,text:1000000,bytes:4000000,dimension:12000,resource:2000000});
const own=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!keys.includes(k)))throw Error('IR 字段不合法');};
const str=(s,max=2000)=>{if(typeof s!=='string'||s.length>max)throw Error('IR 字符串超限');};
const list=(v,max=200)=>{if(!Array.isArray(v)||v.length>max)throw Error('IR 数组超限');};
export const bytes=v=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v)).length;
export async function sha256(data){const buf=typeof data==='string'?new TextEncoder().encode(data):data;return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buf))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function resourceBytes(r){return Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));}
export function validateSnapshot(s){
 own(s,['schemaVersion','kind','capability','createdAt','source','dimensions','background','tree','resources','provenance','omissions','limitations','security','stats','behaviors']);
 if(![VERSION,'1.0.0','1.1.0','1.2.0','1.3.0'].includes(s.schemaVersion))throw Error('不支持的 schemaVersion；请迁移或使用原版本');
 if(s.kind!=='ui-portability-snapshot'||!['static','visual-only'].includes(s.capability))throw Error('未经测试的能力等级');
 str(s.createdAt,30);if(!Number.isFinite(Date.parse(s.createdAt)))throw Error('创建时间不合法');
 own(s.source,['type','origin']);if(!['page','html','svg','json','image'].includes(s.source.type))throw Error('来源类型不合法');str(s.source.origin,300);
 if(s.source.origin!=='local'){const u=new URL(s.source.origin);if(!/^https?:$/.test(u.protocol)||u.origin!==s.source.origin||/chatgpt\.com$|chat\.openai\.com$/.test(u.hostname))throw Error('来源未脱敏或被禁用');}
 own(s.dimensions,['width','height']);for(const n of [s.dimensions.width,s.dimensions.height])if(!Number.isFinite(n)||n<1||n>LIMITS.dimension)throw Error('尺寸超限');
 if(!safeCss(s.background)||!/^(#[0-9a-f]{3,8}|rgba?\([0-9.,% /]+\)|transparent)$/i.test(s.background))throw Error('背景不合法');
 own(s.provenance,['method','status']);if(!['sanitized-dom','local-file','raster-import','migrated-v02'].includes(s.provenance.method)||!['captured','external-unverified'].includes(s.provenance.status))throw Error('来源方法不合法');
 own(s.security,['redacted','remoteResources','scripts']);if(typeof s.security.redacted!=='boolean'||(s.security.redacted===false&&s.provenance.status!=='external-unverified')||s.security.remoteResources!==false||s.security.scripts!==false)throw Error('安全契约不合法');
 for(const k of ['omissions','limitations']){list(s[k]);s[k].forEach(x=>str(x,1000));}
 if(s.stats){own(s.stats,['elements','omittedImages','canvasImages','omittedFrames','redactedControls','externalLinks','truncated','svg']);for(const v of Object.values(s.stats))if(typeof v!=='boolean'&&(!Number.isInteger(v)||v<0||v>10000))throw Error('统计不合法');}
 list(s.resources,100);const ids=new Set();for(const r of s.resources){own(r,['id','mime','data','sha256','status']);if(!/^r[0-9]+$/.test(r.id)||ids.has(r.id))throw Error('资源 ID 重复或非法');ids.add(r.id);if(!['image/png','image/jpeg','image/webp'].includes(r.mime)||r.status!=='captured'||!/^[a-f0-9]{64}$/.test(r.sha256)||typeof r.data!=='string'||r.data.length>LIMITS.resource||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(r.data))throw Error('资源不合法');}
 let count=0,text=0;
 function walk(n,depth){if(++count>LIMITS.nodes||depth>LIMITS.depth)throw Error('IR 超过 5000 节点或 75 层');
 if(n&&Object.hasOwn(n,'text')){own(n,['text']);str(n.text,LIMITS.text);text+=n.text.length;if(text>LIMITS.text)throw Error('文本超限');return;}
 own(n,['tag','ns','attrs','style','children','component','state','resourceId','evidence']);str(n.tag,30);
 if(!(n.ns==='html'&&(allowedHtml.has(n.tag)||['input','img'].includes(n.tag))||n.ns==='svg'&&allowedSvg.has(n.tag.toLowerCase())||n.ns==='math'&&allowedMath.has(n.tag)))throw Error('标签不合法');
 if(n.evidence){own(n.evidence,['status','method']);if(!['captured','unsupported'].includes(n.evidence.status)||!['computed-dom','rasterized','redacted','placeholder','flattened-shadow','generated-pseudo','scroll-flattened'].includes(n.evidence.method))throw Error('节点来源不合法');}
 if(n.component&&!['container','table','graphic','formula','control','image'].includes(n.component))throw Error('组件类型不合法');
 own(n.attrs,[...allowedAttributes,'id','open','disabled','type','checked','min','max','step','value','alt','gradientUnits','gradientTransform','clipPathUnits','maskUnits','patternUnits']);
 if(s.schemaVersion!=='1.4.0'&&['start','display'].some(k=>Object.hasOwn(n.attrs,k)))throw Error('IR 1.4 属性需要显式版本升级');
 for(const [k,v] of Object.entries(n.attrs)){str(v,['d','points'].includes(k)?100000:1000);if(/[<>]|javascript:|data:|[\x00-\x08]/i.test(v)||/url\s*\(/i.test(v)&&!localReference(v))throw Error('活动属性不合法');if(!['d','points'].includes(k)&&!safeCss(v)&&!localReference(v))throw Error('属性资源语法不合法');if(k==='id'&&!/^uip-\d+$/.test(v))throw Error('ID 不合法');}
 for(const k of ['aria-controls','aria-labelledby'])if(n.attrs[k]!==undefined&&!/^uip-\d+$/.test(n.attrs[k]))throw Error('ARIA 引用必须为本地 ID');
 if(n.attrs.role!==undefined&&!['tab','tabpanel','tablist'].includes(n.attrs.role)||n.attrs.tabindex!==undefined&&!['0','-1'].includes(n.attrs.tabindex)||['aria-selected','aria-hidden'].some(k=>n.attrs[k]!==undefined&&!['true','false'].includes(n.attrs[k]))||n.attrs.hidden!==undefined&&n.attrs.hidden!=='')throw Error('可访问状态不合法');
 if(n.tag==='input'&&n.attrs.type==='number'&&(!['min','max','step','value'].every(k=>typeof n.attrs[k]==='string'&&n.attrs[k].trim()!==''&&Number.isFinite(Number(n.attrs[k])))||Number(n.attrs.min)!==-100||Number(n.attrs.max)!==100||Number(n.attrs.step)!==.01||Number(n.attrs.value)<-100||Number(n.attrs.value)>100))throw Error('数字控件静态数值不合法');
 if(n.tag==='input'&&(!['range','checkbox','radio','number'].includes(n.attrs.type)||n.attrs.disabled!=='')||n.tag==='button'&&n.attrs.disabled!=='')throw Error('控件必须静态禁用');
 own(n.style,styleProps);for(const v of Object.values(n.style))if(!safeCss(v)&&!localReference(v))throw Error('活动样式不合法');
 if(n.state){own(n.state,['scrollTop','scrollLeft']);for(const v of Object.values(n.state))if(!Number.isFinite(v)||v<0||v>1e6)throw Error('状态不合法');}
 if(n.resourceId&&(!ids.has(n.resourceId)||n.tag!=='img'))throw Error('资源不存在');
 list(n.children,LIMITS.nodes);if(n.ns==='html'&&['input','img','br','hr'].includes(n.tag)&&n.children.length)throw Error('HTML 空元素不能包含子节点');n.children.forEach(c=>walk(c,depth+1));}
 walk(s.tree,0);if(!['1.3.0',VERSION].includes(s.schemaVersion)&&s.behaviors?.some(b=>!['fourier@1','table@1'].includes(b.recipe)))throw Error('旧版不支持新适配器');if(s.schemaVersion==='1.1.0'&&s.behaviors?.some(b=>b.evidence!=='fixture-equivalence-v1'))throw Error('IR 1.1 不支持模型校验标记');if(s.schemaVersion==='1.0.0'&&s.behaviors)throw Error('旧版不允许交互');validateBehaviors(s);if(bytes(s)>LIMITS.bytes)throw Error('快照超过 4 MB');return s;
}
export async function verifyResources(s){validateSnapshot(s);for(const r of s.resources){const data=resourceBytes(r);if(await sha256(data)!==r.sha256)throw Error('资源 SHA-256 不一致');const hex=[...data.slice(0,12)].map(x=>x.toString(16).padStart(2,'0')).join('');if(!(r.mime==='image/png'&&hex.startsWith('89504e470d0a1a0a')||r.mime==='image/jpeg'&&hex.startsWith('ffd8ff')||r.mime==='image/webp'&&hex.startsWith('52494646')&&hex.slice(16)==='57454250'))throw Error('资源 MIME 与文件签名不一致');rasterDimensions(data,r.mime);if(typeof createImageBitmap==='function'){const decoded=await createImageBitmap(new Blob([data],{type:r.mime}));const tooLarge=decoded.width*decoded.height>1000000||decoded.width>4096||decoded.height>4096;decoded.close();if(tooLarge)throw Error('解码图片超过安全像素限制');}}return s;}
export const serialize=s=>JSON.stringify(validateSnapshot(s),null,2);
export const diagnostic=s=>{validateSnapshot(s);return {kind:'ui-portability-diagnostic',schemaVersion:VERSION,capability:s.capability,createdAt:s.createdAt,dimensions:s.dimensions,omissions:s.omissions,limitations:s.limitations,security:s.security,resourceSummary:s.resources.map(({id,mime,sha256,status})=>({id,mime,sha256,status}))};};
export function migrate(input){if(input?.schemaVersion===VERSION)return validateSnapshot(input);if(['1.0.0','1.1.0','1.2.0','1.3.0'].includes(input?.schemaVersion)){validateSnapshot(input);return validateSnapshot({...input,schemaVersion:VERSION,behaviors:input.behaviors||[]});}if(input?.schemaVersion==='0.2.0'&&input.kind==='static-snapshot'&&typeof input.html==='string'&&input.html.length<LIMITS.bytes)return {requiresSanitizedHTML:input.html};throw Error('不支持的版本；v0.2 必须经过隔离 HTML 迁移');}
