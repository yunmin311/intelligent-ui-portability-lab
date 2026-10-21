import test from 'node:test';
import assert from 'node:assert/strict';
import {rasterDimensions} from '../../extension/src/core/raster.js';
import {preflightRaster,fitRaster,raster,RASTER_INPUT_LIMITS} from '../../extension/src/import-raster.js';
const png=(width,height)=>{const a=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,0,0,0,0,0]);const d=new DataView(a.buffer);d.setUint32(16,width);d.setUint32(20,height);return a;};
const image=(width,height)=>new File([png(width,height)],'capture.png',{type:'image/png'});
test('screenshot preflight accepts 4K with bounded input policy but existing resources stay limited',async()=>{
 assert.throws(()=>rasterDimensions(png(3840,2160),'image/png'),/100/);
 const info=await preflightRaster(image(3840,2160));assert.deepEqual(info.dimensions,{width:3840,height:2160});assert.equal(info.mime,'image/png');
 for(const [w,h] of [[16385,1],[10000,5000]])await assert.rejects(preflightRaster(image(w,h)),/40|16384/);
 await assert.rejects(preflightRaster(new File([new Uint8Array(RASTER_INPUT_LIMITS.bytes+1)],'huge.png',{type:'image/png'})),/16 MB/);
 await assert.rejects(preflightRaster(new File(['<svg/>'],'evil.png',{type:'image/png'})),/签名/);
});
test('raster fit always retains aspect ratio within 1 MP and 4096 sides',()=>{
 for(const [w,h] of [[3840,2160],[16384,1],[1,16384],[4000,10000],[100,100]]){const d=fitRaster(w,h);assert.ok(d.width*d.height<=1000000);assert.ok(Math.max(d.width,d.height)<=4096);assert.ok(d.width>=1&&d.height>=1);}
 assert.deepEqual(fitRaster(100,100),{width:100,height:100});
});
test('abort and invalid headers stop screenshot import before browser decoder',async()=>{
 let calls=0;const old=globalThis.createImageBitmap;globalThis.createImageBitmap=()=>{calls++;throw Error('decoder called');};
 try{await assert.rejects(raster(image(10000,5000)),/40|16384/);const controller=new AbortController();controller.abort();await assert.rejects(raster(image(1,1),{signal:controller.signal}),e=>e.name==='AbortError');assert.equal(calls,0);}finally{globalThis.createImageBitmap=old;}
});

test('complete raster geometry rejects gaps, overlap, transformed or out-of-budget composites',async()=>{
 const {rasterLayout}=await import('../../extension/src/core/image-archive.js');
 const tile=(left,top,width,height,id)=>({tag:'img',ns:'html',attrs:{},style:{position:'absolute',display:'block',left:left+'px',top:top+'px',width:width+'px',height:height+'px'},resourceId:id,children:[]});
 const s={source:{type:'image'},capability:'visual-only',dimensions:{width:1500,height:1000},resources:[{id:'r0'},{id:'r1'}],tree:{tag:'div',style:{position:'relative',width:'1500px',height:'1000px',overflow:'hidden'},children:[tile(0,0,1000,1000,'r0'),tile(1000,0,500,1000,'r1')]}};
 assert.equal(rasterLayout(s).length,2);assert.equal(rasterLayout({...s,tree:{...s.tree,children:[s.tree.children[0],tile(900,0,500,1000,'r1')]}}),null);
 assert.equal(rasterLayout({...s,dimensions:{width:12000,height:12000}}),null);assert.equal(rasterLayout({...s,tree:{...s.tree,children:[{...s.tree.children[0],style:{...s.tree.children[0].style,transform:'scale(2)'}},s.tree.children[1]]}}),null);
});

test('PNG pixel codec preserves partial alpha and invisible RGB without canvas quantization',async()=>{
 const {PNG}=await import('pngjs');const {parsePNG,decodePNG,encodeRGBA,cropRGBA}=await import('../../extension/src/core/png.js');
 const original=Buffer.from([127,64,250,1,13,33,55,128,24,35,46,0]);const png=PNG.sync.write({width:3,height:1,data:original});
 const decoded=await decodePNG(png);assert.deepEqual(Buffer.from(decoded.pixels),original);
 assert.deepEqual(PNG.sync.read(Buffer.from(await encodeRGBA(3,1,decoded.pixels))).data,original);
 assert.deepEqual(PNG.sync.read(Buffer.from(parsePNG(png).bytes)).data,original);
 assert.deepEqual(Buffer.from(cropRGBA(decoded.pixels,3,1,0,2,1)),original.subarray(4));
 const corrupt=Buffer.from(png);corrupt[30]^=1;assert.throws(()=>parsePNG(corrupt),/校验/);
});

test('complete raster recognition rejects hidden roots and tiles',async()=>{
 const {rasterLayout}=await import('../../extension/src/core/image-archive.js');
 const tree={tag:'div',attrs:{},style:{position:'relative',width:'1px',height:'1px',overflow:'hidden'},children:[{tag:'img',ns:'html',attrs:{alt:'pixel'},style:{position:'absolute',display:'block',left:'0px',top:'0px',width:'1px',height:'1px'},resourceId:'r0',children:[]}]};
 const s={source:{type:'image'},capability:'visual-only',dimensions:{width:1,height:1},resources:[{id:'r0'}],tree};assert.equal(rasterLayout(s).length,1);tree.attrs.hidden='';assert.equal(rasterLayout(s),null);delete tree.attrs.hidden;tree.children[0].attrs.hidden='';assert.equal(rasterLayout(s),null);
});
