// Inspect encoded dimensions BEFORE browser decoding. Unsupported/malformed headers fail closed.
export function rasterDimensions(bytes,mime,{maxPixels=1000000,maxDimension=4096}={}){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let width,height;
 const ascii=(start,n)=>String.fromCharCode(...bytes.slice(start,start+n));
 if(mime==='image/png'&&bytes.length>=24&&ascii(12,4)==='IHDR'){width=v.getUint32(16);height=v.getUint32(20);}
 else if(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216){let p=2;while(p+4<=bytes.length){if(bytes[p++]!==255)break;while(bytes[p]===255)p++;const marker=bytes[p++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const size=v.getUint16(p);if(size<2||p+size>bytes.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&size>=8){height=v.getUint16(p+3);width=v.getUint16(p+5);break;}p+=size;}}
 else if(mime==='image/webp'&&bytes.length>=30&&ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP'){
 const kind=ascii(12,4);
 if(kind==='VP8X'){width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
 else if(kind==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42){width=v.getUint16(26,true)&16383;height=v.getUint16(28,true)&16383;}
 else if(kind==='VP8L'&&bytes[20]===47){width=1+bytes[21]+((bytes[22]&63)<<8);height=1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10);}
 }
 if(!width||!height)throw Error('图片头损坏或不支持，无法安全确认尺寸');
 if(width>maxDimension||height>maxDimension||width*height>maxPixels)throw Error(`图片超过 ${maxPixels===1000000?'100 万':maxPixels/1000000+' MP'}像素或 ${maxDimension} px，请先缩小`);
 return {width,height};
}
