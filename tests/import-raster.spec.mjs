import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('screenshot helper safely scales real 4K pixels, validates resources and cancels',async({page})=>{
 const root=path.resolve('extension');
 await page.route('**/raster-helper/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice('/raster-helper/'.length);
  if(name==='blank.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Raster helper verification</title>'});
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep))return route.abort();
  await route.fulfill({contentType:'text/javascript',body:await fs.readFile(file)});
 });
 await page.goto('/raster-helper/blank.html');
 const result=await page.evaluate(async()=>{
  const {raster}=await import('/raster-helper/src/import-raster.js');
  const {verifyResources,resourceBytes}=await import('/raster-helper/src/core/ir.js');
  const canvas=document.createElement('canvas');canvas.width=3840;canvas.height=2160;
  const context=canvas.getContext('2d');context.fillStyle='#123456';context.fillRect(0,0,3840,2160);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  const progress=[];const s=await raster(new File([blob],'system-capture.png',{type:blob.type}),{onProgress:t=>progress.push(t)});
  await verifyResources(s);
  const bitmap=await createImageBitmap(new Blob([resourceBytes(s.resources[0])],{type:s.resources[0].mime}));
  const sample=document.createElement('canvas');sample.width=1;sample.height=1;const target=sample.getContext('2d');target.drawImage(bitmap,0,0,1,1);bitmap.close();
  const rgb=Array.from(target.getImageData(0,0,1,1).data);
  const controller=new AbortController();controller.abort();let aborted=false;
  try{await raster(new File([blob],'cancel.png',{type:blob.type}),{signal:controller.signal});}catch(e){aborted=e.name==='AbortError';}
  const noise=document.createElement('canvas');noise.width=1000;noise.height=1000;const noiseCtx=noise.getContext('2d');const pixels=noiseCtx.createImageData(1000,1000);let seed=7;for(let i=0;i<pixels.data.length;i+=4){for(let j=0;j<3;j++){seed=(1664525*seed+1013904223)>>>0;pixels.data[i+j]=seed>>>24;}pixels.data[i+3]=255;}noiseCtx.putImageData(pixels,0,0);const noisyBlob=await new Promise(resolve=>noise.toBlob(resolve,'image/png'));const noisy=await raster(new File([noisyBlob],'noise.png',{type:'image/png'}));
  return {noisy:{mime:noisy.resources[0].mime,size:noisy.resources[0].data.length,limitations:noisy.limitations},dimensions:s.dimensions,capability:s.capability,security:s.security,limitations:s.limitations,mime:s.resources[0].mime,rgb,aborted,progress};
 });
 expect(result.dimensions.width*result.dimensions.height).toBeLessThanOrEqual(1000000);
 expect(result.capability).toBe('visual-only');expect(result.security.redacted).toBe(false);
 expect(result.limitations.join(' ')).toContain('3840 × 2160');expect(result.limitations.join(' ')).toContain('缩放');
 expect(result.mime).toBe('image/png');expect(result.rgb).toEqual([18,52,86,255]);expect(result.aborted).toBe(true);
 expect(result.noisy.mime).toBe('image/jpeg');expect(result.noisy.size).toBeLessThanOrEqual(2000000);expect(result.noisy.limitations.join(' ')).toContain('有损');
 expect(result.progress.length).toBeGreaterThanOrEqual(3);
});
