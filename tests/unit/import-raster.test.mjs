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
