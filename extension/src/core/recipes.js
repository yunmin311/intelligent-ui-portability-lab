// Owned, versioned recipes. No source-page code or expressions are evaluated.
export function fourierPath(state){
 const {harmonics,amplitude,phase}=state;
 if(!Number.isInteger(harmonics)||harmonics<1||harmonics>12||!Number.isFinite(amplitude)||amplitude<0||amplitude>1.5||!Number.isFinite(phase)||phase< -3.14||phase>3.14)throw Error('Fourier 参数超限');
 const points=[];for(let i=0;i<=240;i++){const x=i/240*2*Math.PI;let y=0;for(let n=1;n<=harmonics;n++)y+=Math.sin(n*x+phase)/n;points.push((i?'L':'M')+(i*2.5).toFixed(2)+','+(90-y*amplitude*32).toFixed(2));}return points.join(' ');
}
export function tableOrder(rows,state){
 if(!Number.isFinite(state.minimum)||state.minimum<0||state.minimum>50||!['asc','desc'].includes(state.direction)||rows.length>200||rows.some(r=>r.length!==2||r.some(c=>typeof c!=='string'||c.length>100)||!Number.isFinite(Number(r[1]))||Number(r[1])<0||Number(r[1])>50))throw Error('表格参数超限');
 return rows.map((_,i)=>i).filter(i=>Number(rows[i][1])>=state.minimum).sort((a,b)=>(Number(rows[a][1])-Number(rows[b][1]))*(state.direction==='asc'?1:-1)||a-b);
}
