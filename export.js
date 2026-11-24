async function loadCover(urls){for(const url of urls){try{const r=await fetch(url,{signal:AbortSignal.timeout(9000)});if(!r.ok)continue;return await createImageBitmap(await r.blob())}catch{}}return null}
export async function downloadBoard(board,colors,labels,urls){
 const pad=30,width=1120,perRow=10,tileW=88,tileH=120,gap=7,left=154;
 const groups=Array.from({length:11},(_,i)=>({rank:10-i,games:board.games.filter(g=>g.rank===10-i)})).filter(g=>g.rank||g.games.length);
 const lineHeight=g=>Math.max(53,Math.ceil(g.games.length/perRow)*(tileH+gap)+10);
 const titleCanvas=document.createElement('canvas'),measure=titleCanvas.getContext('2d');measure.font='bold 36px Arial';
 const titleLines=[];let line='';for(const char of board.name){if(measure.measureText(line+char).width>width-2*pad){titleLines.push(line);line=''}line+=char}titleLines.push(line);
 const top=81+titleLines.length*43,height=top+groups.reduce((sum,g)=>sum+lineHeight(g)+6,0)+pad;
 const canvas=document.createElement('canvas');const scale=height*2<=16384 && width*height*4<=32000000 ? 2 : 1;
 canvas.width=width*scale;canvas.height=height*scale;
 const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#111019';ctx.fillRect(0,0,width,height);ctx.fillStyle='#b99ae8';ctx.font='bold 18px Arial';ctx.fillText('Tierdeck',pad,40);
 ctx.font='bold 36px Arial';ctx.fillStyle='#f3effa';titleLines.forEach((s,i)=>ctx.fillText(s,pad,84+i*43));
 let y=top,missing=false;
 for(const group of groups){const h=lineHeight(group),rank=group.rank;ctx.fillStyle='#252230';ctx.fillRect(pad,y,width-pad*2,h);
 ctx.fillStyle=rank?colors[rank-1]:'#b299d3';ctx.fillRect(pad,y,6,h);ctx.fillStyle=rank?colors[rank-1]:'#d5c3ef';ctx.font='bold '+(rank?'28':'17')+'px Arial';ctx.fillText(rank?String(rank):'Без оценки',pad+17,y+(rank?29:32));if(rank){ctx.font='13px Arial';ctx.fillStyle='#c5bdcf';ctx.fillText(labels[rank-1],pad+17,y+46)}
 for(let start=0;start<group.games.length;start+=perRow){const chunk=group.games.slice(start,start+perRow);const imgs=await Promise.all(chunk.map(g=>loadCover(urls(g.id,g))));imgs.forEach((img,i)=>{const x=left+i*(tileW+gap),ty=y+7+Math.floor(start/perRow)*(tileH+gap);
 if(img){if(img.width>img.height){ctx.fillStyle='#352d40';ctx.fillRect(x,ty,tileW,tileH);const ih=tileW*img.height/img.width;ctx.drawImage(img,x,ty+(tileH-ih)/2,tileW,ih)}else{const cutH=Math.min(img.height,img.width*tileH/tileW);ctx.drawImage(img,0,(img.height-cutH)/2,img.width,cutH,x,ty,tileW,tileH)}img.close()}else{missing=true;ctx.fillStyle='#393143';ctx.fillRect(x,ty,tileW,tileH);ctx.font='12px Arial';ctx.fillStyle='#fff';let text='',ln=0;for(const ch of chunk[i].name){if(ctx.measureText(text+ch).width>tileW-10){ctx.fillText(text,x+5,ty+17+ln++*14);text='';if(ln>=7)break}text+=ch}if(ln<7)ctx.fillText(text,x+5,ty+17+ln*14)}})}
 y+=h+6}
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/png'));const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=board.name.replace(/[\\/:*?"<>|]/g,'_')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);return missing
}
