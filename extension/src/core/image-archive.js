import {resourceBytes} from './ir.js';
import {decodePNG,encodeRGBA} from './png.js';
// Separate bounded image archive budget. Never raises IR, individual tile or session limits.
export const IMAGE_ARCHIVE_LIMITS=Object.freeze({maxPixels:8400000,maxDimension:12000,pngBytes:36000000});
export function checkArchiveDimensions({width,height}){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>IMAGE_ARCHIVE_LIMITS.maxPixels||Math.max(width,height)>IMAGE_ARCHIVE_LIMITS.maxDimension)throw Error('原尺寸归档最多 840 万像素、单边 12000 px；请裁剪图片或选择标准模式');}
// Recognize only the exact, unstyled tile layout produced by our raster importer.
// Do not silently flatten arbitrary imported DOM, crops, transforms or overlays.
export function rasterLayout(s){
 if(s.source.type!=='image'||s.capability!=='visual-only')return null;
 try{checkArchiveDimensions(s.dimensions);}catch{return null;}
 const {width,height}=s.dimensions,root=s.tree;
 if(root.tag!=='div'||Object.keys(root.attrs||{}).length||Object.keys(root.style).some(k=>!['position','width','height','overflow'].includes(k))||root.style.position!=='relative'||root.style.width!==width+'px'||root.style.height!==height+'px'||root.style.overflow!=='hidden')return null;
 const tiles=[];let index=0;
 for(let top=0;top<height;top+=1000)for(let left=0;left<width;left+=1000){const n=root.children[index++],w=Math.min(1000,width-left),h=Math.min(1000,height-top);
 if(!n||n.tag!=='img'||Object.keys(n.attrs||{}).some(k=>k!=='alt')||n.ns!=='html'||n.children.length||!s.resources.some(r=>r.id===n.resourceId)||Object.keys(n.style).some(k=>!['position','display','left','top','width','height'].includes(k))||n.style.position!=='absolute'||n.style.display!=='block'||n.style.left!==left+'px'||n.style.top!==top+'px'||n.style.width!==w+'px'||n.style.height!==h+'px')return null;
 tiles.push({id:n.resourceId,left,top,width:w,height:h});}
 return index===root.children.length?tiles:null;
}
export async function encodePNG(width,height,paint,{signal}={}){
 checkArchiveDimensions({width,height});signal?.throwIfAborted();
 const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器无法创建无损归档画布');
 try{await paint(ctx);signal?.throwIfAborted();const blob=await canvas.convertToBlob({type:'image/png'});signal?.throwIfAborted();if(blob.type!=='image/png'||blob.size>IMAGE_ARCHIVE_LIMITS.pngBytes)throw Error('无损 PNG 超过 36 MB 归档限制；未降低质量');return new Uint8Array(await blob.arrayBuffer());}
 finally{canvas.width=0;canvas.height=0;}
}
export async function completeRaster(s){const tiles=rasterLayout(s);if(!tiles)return null;
 const {width,height}=s.dimensions,pixels=new Uint8Array(width*height*4);let colors,colorKey;
 for(const t of tiles){const r=s.resources.find(r=>r.id===t.id);if(r.mime!=='image/png')throw Error('无损分块必须为 PNG');const decoded=await decodePNG(resourceBytes(r)),key=JSON.stringify(decoded.colors.map(c=>Array.from(c)));if(colorKey!==undefined&&colorKey!==key)throw Error('分块颜色配置不一致；无法无损合成');colorKey=key;colors=decoded.colors;if(decoded.width!==t.width||decoded.height!==t.height)throw Error('图片分块尺寸与布局不一致；无法无损合成');for(let y=0;y<t.height;y++)pixels.set(decoded.pixels.subarray(y*t.width*4,(y+1)*t.width*4),((t.top+y)*width+t.left)*4);}
 return encodeRGBA(width,height,pixels,colors);
}
