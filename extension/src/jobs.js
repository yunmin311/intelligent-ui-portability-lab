// Terminate worker CPU work on deadline or explicit cancellation.
export function job(data,{signal}={}){return new Promise((resolve,reject)=>{
 if(signal?.aborted){reject(signal.reason||Error('已取消'));return;}
 const worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
 const done=()=>{clearTimeout(timer);worker.terminate();signal?.removeEventListener('abort',abort);};
 const abort=()=>{done();reject(signal.reason||Error('已取消'));};
 const timer=setTimeout(()=>{done();reject(Error('转换超时，工作线程已终止；请减小文件'));},10000);
 signal?.addEventListener('abort',abort,{once:true});worker.onmessage=e=>{done();e.data.error?reject(Error(e.data.error)):resolve(e.data.result);};worker.onerror=e=>{done();reject(Error(e.message));};worker.postMessage(data);
});}
