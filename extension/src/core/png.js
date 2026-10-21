// Bounded PNG parsing: retain pixel/color chunks, discard metadata, never execute or fetch.
import {checkArchiveDimensions} from './image-archive.js';
const signature=Uint8Array.of(137,80,78,71,13,10,26,10),enc=new TextEncoder();
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function join(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return out;}
function chunk(type,data){const out=new Uint8Array(data.length+12),v=new DataView(out.buffer);v.setUint32(0,data.length);out.set(enc.encode(type),4);out.set(data,8);v.setUint32(out.length-4,crc(out.subarray(4,out.length-4)));return out;}
export function parsePNG(bytes){
 if(bytes.length>36000000||signature.some((b,i)=>bytes[i]!==b))throw Error('PNG 签名或容量不合法');
 const parts=[],ids=[],colors=[];let chunks=0;let header,palette,alpha,end=false,offset=8,idatEnded=false;const seen=new Set();
 while(offset<bytes.length){if(++chunks>10000||offset+12>bytes.length)throw Error('PNG 块不完整');const v=new DataView(bytes.buffer,bytes.byteOffset+offset,bytes.length-offset),size=v.getUint32(0),stop=offset+size+12;if(stop>bytes.length)throw Error('PNG 块越界');const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8)),data=bytes.subarray(offset+8,stop-4);if(!/^[A-Za-z]{4}$/.test(type)||crc(bytes.subarray(offset+4,stop-4))!==v.getUint32(size+8))throw Error('PNG 块校验失败');
 if(!header&&type!=='IHDR'||end)throw Error('PNG 块顺序不合法');
 if(ids.length&&type!=='IDAT')idatEnded=true;if(['IHDR','PLTE','tRNS','sRGB','gAMA','cHRM','iCCP'].includes(type)){if(seen.has(type)||ids.length)throw Error('PNG 块重复或顺序不合法');seen.add(type);}
 if(type==='IHDR'){if(header||size!==13)throw Error('PNG 文件头不合法');header=data;checkArchiveDimensions({width:new DataView(data.buffer,data.byteOffset).getUint32(0),height:new DataView(data.buffer,data.byteOffset).getUint32(4)});}
 else if(type==='IDAT'){if(idatEnded)throw Error('PNG 像素块不连续');ids.push(data);}else if(type==='PLTE')palette=data;else if(type==='tRNS')alpha=data;else if(type==='IEND'){if(size)throw Error('PNG 结尾不合法');end=true;}else if(type==='acTL')throw Error('动画 PNG 无法完整静态归档；请先选择需要保存的帧');else if(type[0]===type[0].toUpperCase())throw Error('未知 PNG 关键块');
 if(['sRGB','gAMA','cHRM','iCCP'].includes(type))colors.push(bytes.subarray(offset,stop));
 if(['IHDR','PLTE','tRNS','IDAT','IEND','sRGB','gAMA','cHRM','iCCP'].includes(type))parts.push(bytes.subarray(offset,stop));offset=stop;
 }
 if(!end||!ids.length)throw Error('PNG 缺少像素数据');const depth=header[8],type=header[9],valid=({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]})[type];if(!valid?.includes(depth)||header[10]||header[11]||header[12]>1)throw Error('PNG 编码格式不合法');if(palette&&(palette.length<3||palette.length>768||palette.length%3)||type===3&&!palette)throw Error('PNG 调色板不合法');if(alpha&&((type===0&&alpha.length!==2)||(type===2&&alpha.length!==6)||(type===3&&alpha.length>palette.length/3)||![0,2,3].includes(type)))throw Error('PNG 透明度数据不合法');return{bytes:join([signature,...parts]),header,palette,alpha,ids,colors};
}
async function inflate(ids,limit){const reader=new Blob(ids).stream().pipeThrough(new DecompressionStream('deflate')).getReader(),parts=[];let total=0;try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limit)throw Error('PNG 解压数据超过尺寸预算');parts.push(value);}}finally{await reader.cancel();reader.releaseLock();}if(total!==limit)throw Error('PNG 像素数据尺寸不符');return join(parts);}
export async function decodePNG(bytes){const p=parsePNG(bytes),v=new DataView(p.header.buffer,p.header.byteOffset),width=v.getUint32(0),height=v.getUint32(4),depth=p.header[8],type=p.header[9],channels=({0:1,2:3,3:1,4:2,6:4})[type];
 if(depth!==8||!channels||p.header[10]||p.header[11]||p.header[12])throw Error('此 PNG 位深或隔行格式不支持分块像素归档；请选择仅 ZIP 模式保留原始像素');
 if((type===0||type===4)&&p.colors.some(c=>String.fromCharCode(...c.subarray(4,8))==='iCCP'))throw Error('灰度 ICC PNG 无法安全转为 RGBA 分块；请选择仅 ZIP 模式保留原始颜色');
 const stride=width*channels,raw=await inflate(p.ids,(stride+1)*height),pixels=new Uint8Array(width*height*4);let prior=new Uint8Array(stride);
 const paeth=(a,b,c)=>{const q=a+b-c,x=Math.abs(q-a),y=Math.abs(q-b),z=Math.abs(q-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)],row=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));if(filter>4)throw Error('PNG 过滤器不合法');for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=prior[x],c=x>=channels?prior[x-channels]:0;row[x]=(row[x]+(filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0))&255;}
 for(let x=0;x<width;x++){const i=x*channels,o=(y*width+x)*4,r=row[i];if(type===3){if(!p.palette||r*3+2>=p.palette.length)throw Error('PNG 调色板不合法');pixels.set(p.palette.subarray(r*3,r*3+3),o);pixels[o+3]=p.alpha?.[r]??255;}else{pixels[o]=r;pixels[o+1]=type===0||type===4?r:row[i+1];pixels[o+2]=type===0||type===4?r:row[i+2];pixels[o+3]=type===4?row[i+1]:type===6?row[i+3]:255;if(p.alpha&&type===0&&r===p.alpha[1])pixels[o+3]=0;if(p.alpha&&type===2&&r===p.alpha[1]&&row[i+1]===p.alpha[3]&&row[i+2]===p.alpha[5])pixels[o+3]=0;}}
 prior=row;}return{width,height,pixels,colors:p.colors};
}
export async function encodeRGBA(width,height,pixels,colors=[]){checkArchiveDimensions({width,height});if(pixels.length!==width*height*4)throw Error('RGBA 尺寸不一致');const raw=new Uint8Array((width*4+1)*height);for(let y=0;y<height;y++)raw.set(pixels.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);const compressed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()),header=new Uint8Array(13),v=new DataView(header.buffer);v.setUint32(0,width);v.setUint32(4,height);header[8]=8;header[9]=6;return join([signature,chunk('IHDR',header),...colors,chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);}
export function cropRGBA(pixels,sourceWidth,left,top,width,height){const out=new Uint8Array(width*height*4);for(let y=0;y<height;y++)out.set(pixels.subarray(((top+y)*sourceWidth+left)*4,((top+y)*sourceWidth+left+width)*4),y*width*4);return out;}
