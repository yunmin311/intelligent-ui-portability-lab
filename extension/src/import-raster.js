import {rasterDimensions} from './core/raster.js';
import {sha256,verifyResources,VERSION,LIMITS} from './core/ir.js';

// Input decode budget is deliberately distinct from the unchanged stored-resource budget.
export const RASTER_INPUT_LIMITS=Object.freeze({bytes:16000000,maxPixels:40000000,maxDimension:16384});
const checkAbort=signal=>{if(signal?.aborted)throw new DOMException('图片导入已取消','AbortError');};
export function fitRaster(width,height,scale=1){
 const ratio=Math.min(1,Math.sqrt(1000000/(width*height)),4096/width,4096/height)*scale;
 return {width:Math.max(1,Math.floor(width*ratio)),height:Math.max(1,Math.floor(height*ratio))};
}
export async function preflightRaster(file,{signal}={}){
 checkAbort(signal);
 if(!file||!Number.isFinite(file.size)||file.size<1||file.size>RASTER_INPUT_LIMITS.bytes)throw Error('截图文件必须非空且不超过 16 MB');
 const bytes=new Uint8Array(await file.arrayBuffer());checkAbort(signal);
 const head=Array.from(bytes.slice(0,12),x=>x.toString(16).padStart(2,'0')).join('');
 const mime=head.startsWith('89504e470d0a1a0a')?'image/png':head.startsWith('ffd8ff')?'image/jpeg':head.startsWith('52494646')&&head.slice(16)==='57454250'?'image/webp':null;
 if(!mime)throw Error('图片签名不支持；仅接受 PNG、JPEG 和 WebP');
 if(file.type&&file.type!==mime&&file.type!=='application/octet-stream')throw Error('图片 MIME 与文件签名不一致');
 return {bytes,mime,dimensions:rasterDimensions(bytes,mime,RASTER_INPUT_LIMITS)};
}
const encode=(canvas,mime,quality)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片重新编码失败')),mime,quality));
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
export async function raster(file,{signal,onProgress=()=>{},preserveResolution=false}={}){
 onProgress('正在检查截图尺寸…');const input=await preflightRaster(file,{signal});
 if(preserveResolution)return archiveRaster(input,{signal,onProgress});
 let bitmap,canvas;
 try{
  const target=fitRaster(input.dimensions.width,input.dimensions.height);
  onProgress('正在解码并缩放截图…');checkAbort(signal);
  // Decode directly into the bounded target. Header validation precedes the decoder.
  bitmap=await createImageBitmap(new Blob([input.bytes],{type:input.mime}),{resizeWidth:target.width,resizeHeight:target.height,resizeQuality:'high',imageOrientation:'none'});checkAbort(signal);
  if(bitmap.width!==target.width||bitmap.height!==target.height)throw Error('浏览器未遵守安全解码尺寸，请使用兼容浏览器');
  canvas=document.createElement('canvas');canvas.width=target.width;canvas.height=target.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器无法创建图片转换画布');
  ctx.drawImage(bitmap,0,0);bitmap.close();bitmap=null;
  let encoded,mime='image/png',encodedBytes;let lossy=false;
  // PNG first preserves pixels; bounded JPEG fallbacks never retain metadata or source URLs.
  for(let attempt=0;attempt<5;attempt++){
   checkAbort(signal);onProgress(attempt?'正在压缩截图以满足离线资源限制…':'正在封装截图资源…');
   checkAbort(signal);mime=attempt?'image/jpeg':'image/png';
   if(attempt===1){ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';}
   encoded=await encode(canvas,mime,[undefined,.9,.75,.6,.4][attempt]);checkAbort(signal);
   if(encoded.type!==mime)throw Error('浏览器不支持安全的图片编码格式');
   // Base64 grows to 4*ceil(bytes/3), bound before constructing the string.
   if(4*Math.ceil(encoded.size/3)<=LIMITS.resource){encodedBytes=new Uint8Array(await encoded.arrayBuffer());checkAbort(signal);lossy=attempt>0;break;}
  }
  if(!encodedBytes)throw Error('截图压缩后仍超过资源限制；请裁剪截图后重试');
  const dimensions={width:canvas.width,height:canvas.height},original=input.dimensions;
  const changed=original.width!==dimensions.width||original.height!==dimensions.height;
  const snapshot={schemaVersion:VERSION,kind:'ui-portability-snapshot',capability:'visual-only',createdAt:new Date().toISOString(),source:{type:'image',origin:'local'},dimensions,background:'#fff',tree:{tag:'img',ns:'html',attrs:{alt:'用户主动导入的截图'},style:{display:'block',width:dimensions.width+'px',height:dimensions.height+'px'},resourceId:'r0',component:'image',children:[]},resources:[{id:'r0',mime,data:base64(encodedBytes),sha256:await sha256(encodedBytes),status:'captured'}],provenance:{method:'raster-import',status:'external-unverified'},security:{redacted:false,remoteResources:false,scripts:false},omissions:['仅保存视觉像素，未恢复文字语义、按钮、滑块或原始交互。','图片中的正文、账号及其他敏感信息不会自动脱敏，请在导入前检查。'],limitations:[`原图 ${original.width} × ${original.height} px；保存 ${dimensions.width} × ${dimensions.height} px。`,changed?'已受控缩放至不超过 100 万像素；细小文字可能损失清晰度。':'未缩放；保留输入像素尺寸。',lossy?'为满足资源限制已使用 JPEG 有损压缩，透明区域合成为白色；不是原图归档。':'重新编码为 PNG 并移除原文件元数据；不是原始文件归档。']};
  checkAbort(signal);await verifyResources(snapshot);checkAbort(signal);return snapshot;
 }finally{bitmap?.close();if(canvas){canvas.width=0;canvas.height=0;}}
}

// Archive mode bounds the source decode separately; stored tiles keep the existing 1 MP / 2 MB limits.
export const ARCHIVE_LIMITS=Object.freeze({maxPixels:8400000,maxDimension:12000,tile:1000,base64Bytes:2500000});
async function archiveRaster(input,{signal,onProgress}){
 const {width,height}=input.dimensions;
 if(width*height>ARCHIVE_LIMITS.maxPixels||Math.max(width,height)>ARCHIVE_LIMITS.maxDimension)throw Error('原尺寸归档最多 840 万像素、单边 12000 px；请裁剪图片或选择标准模式');
 let bitmap,canvas;
 try{
  checkAbort(signal);onProgress('正在解码原尺寸图片…');
  bitmap=await createImageBitmap(new Blob([input.bytes],{type:input.mime}),{imageOrientation:'none'});checkAbort(signal);
  if(bitmap.width!==width||bitmap.height!==height)throw Error('原图解码尺寸与文件头不符；请转换为 PNG 后重试');
  canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器无法创建图片转换画布');
  const resources=[],children=[];let total=0;
  const count=Math.ceil(width/ARCHIVE_LIMITS.tile)*Math.ceil(height/ARCHIVE_LIMITS.tile);
  for(let top=0;top<height;top+=ARCHIVE_LIMITS.tile)for(let left=0;left<width;left+=ARCHIVE_LIMITS.tile){
   checkAbort(signal);onProgress(`正在无损封装原尺寸分块 ${resources.length+1} / ${count}…`);
   const w=Math.min(ARCHIVE_LIMITS.tile,width-left),h=Math.min(ARCHIVE_LIMITS.tile,height-top);
   canvas.width=w;canvas.height=h;ctx.drawImage(bitmap,left,top,w,h,0,0,w,h);
   const blob=await encode(canvas,'image/png');checkAbort(signal);
   const size=4*Math.ceil(blob.size/3);
   if(blob.type!=='image/png'||size>LIMITS.resource||total+size>ARCHIVE_LIMITS.base64Bytes)throw Error('原尺寸无损归档超过资源容量限制；请裁剪图片或选择标准模式，未自动降低质量');
   const bytes=new Uint8Array(await blob.arrayBuffer());checkAbort(signal);
   const id='r'+resources.length;resources.push({id,mime:'image/png',data:base64(bytes),sha256:await sha256(bytes),status:'captured'});total+=size;
   children.push({tag:'img',ns:'html',attrs:{alt:`原尺寸图片分块 ${resources.length} / ${count}`},style:{position:'absolute',left:left+'px',top:top+'px',width:w+'px',height:h+'px',display:'block'},resourceId:id,component:'image',children:[]});
  }
  const snapshot={schemaVersion:VERSION,kind:'ui-portability-snapshot',capability:'visual-only',createdAt:new Date().toISOString(),source:{type:'image',origin:'local'},dimensions:{width,height},background:'transparent',tree:{tag:'div',ns:'html',attrs:{},style:{position:'relative',width:width+'px',height:height+'px',overflow:'hidden'},children},resources,provenance:{method:'raster-import',status:'external-unverified'},security:{redacted:false,remoteResources:false,scripts:false},omissions:['仅保存视觉像素，未恢复文字语义或交互。','图片中的正文、账号及其他敏感信息不会自动脱敏，请在导入前检查。'],limitations:[`原图 ${width} × ${height} px；保存 ${width} × ${height} px；${resources.length} 个 PNG 分块。`,'原尺寸无损像素归档：未缩放、未使用 JPEG 压缩；移除原文件元数据，不保存原始文件字节。','请使用 HTML 或 ZIP 中 index.html 查看完整拼合画面；notes.md 展示独立图片块，不保持拼合布局。']};
  checkAbort(signal);await verifyResources(snapshot);checkAbort(signal);return snapshot;
 }finally{bitmap?.close();if(canvas){canvas.width=0;canvas.height=0;}}
}
