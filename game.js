const T=30,COLS=31,ROWS=21,WORLD_W=930,WORLD_H=630,canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
let levels=[],L=null,player={x:0,y:0},ecos=[],keys={},stick={x:0,y:0},last=0,won=false,hintTimer=null;
const $=s=>document.querySelector(s),levelEl=$("#level"),ecosEl=$("#ecos"),modal=$("#modal"),msg=$("#msg"),title=$("#title"),hint=$("#hint");
fetch("levels.json").then(r=>r.json()).then(d=>{levels=d.levels;load(Number(localStorage.getItem("eco_level")||1));requestAnimationFrame(loop)});
const center=o=>({x:(o.x+.5)*T,y:(o.y+.5)*T});
function wall(x,y){return x<0||y<0||x>=COLS||y>=ROWS||L.grid[y][x]==="#"}
function doorAt(x,y){return L.doors.find(d=>d.x===x&&d.y===y)}
function doorOpen(d){return ecos.some(e=>e.buttonId===d.requires)}
function passable(x,y){const d=doorAt(x,y);return !wall(x,y)&&(!d||doorOpen(d))}
function load(n){n=Math.max(1,Math.min(levels.length,n));L=levels[n-1];levelEl.textContent=n;player=center(L.start);ecos=[];ecosEl.textContent=0;won=false;modal.style.display="none";hint.classList.remove("hide");clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.classList.add("hide"),3500)}
function reset(){load(L.id)}
function makeEco(){
 if(won)return;
 const b=L.buttons.find(b=>b.x===Math.floor(player.x/T)&&b.y===Math.floor(player.y/T));
 if(!b){hint.textContent="Párate sobre el núcleo para crear un ECO.";hint.classList.remove("hide");return}
 if(ecos.some(e=>e.buttonId===b.id))return;
 ecos.push({buttonId:b.id,x:player.x,y:player.y});
 ecosEl.textContent=ecos.length;hint.textContent="ECO fijado · puerta "+b.id+" abierta";hint.classList.remove("hide");
 setTimeout(()=>hint.classList.add("hide"),1200);navigator.vibrate?.(25);check();
}
function check(){
 if(!L.buttons.every(b=>ecos.some(e=>e.buttonId===b.id)))return;
 const e=center(L.exit);
 if(Math.hypot(player.x-e.x,player.y-e.y)<13){
  won=true;modal.style.display="grid";
  title.textContent=L.id===120?"ECO COMPLETADO":"NIVEL SUPERADO";
  msg.textContent=L.id===120?"Has terminado los 120 niveles verificados.":"Todos los núcleos están activos. La salida está libre.";
  if(L.id<120)localStorage.setItem("eco_level",String(L.id+1));
  navigator.vibrate?.([35,45,60]);
 }
}
function move(dx,dy,dt){
 const speed=165,step=speed*dt,nx=player.x+dx*step,ny=player.y+dy*step,r=7;
 function ok(x,y){
  const l=Math.floor((x-r)/T),rr=Math.floor((x+r)/T),t=Math.floor((y-r)/T),bb=Math.floor((y+r)/T);
  for(let yy=t;yy<=bb;yy++)for(let xx=l;xx<=rr;xx++)if(!passable(xx,yy))return false;
  return true;
 }
 if(ok(nx,player.y))player.x=nx;if(ok(player.x,ny))player.y=ny;check();
}
function direction(){
 let x=0,y=0;
 if(keys.ArrowLeft||keys.a)x--;if(keys.ArrowRight||keys.d)x++;
 if(keys.ArrowUp||keys.w)y--;if(keys.ArrowDown||keys.s)y++;
 if(x||y){const m=Math.hypot(x,y);x/=m;y/=m}
 return (stick.x||stick.y)?stick:{x,y};
}
function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const scale=Math.min(canvas.width/WORLD_W,canvas.height/WORLD_H);
 const ox=(canvas.width-WORLD_W*scale)/2,oy=(canvas.height-WORLD_H*scale)/2;
 ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 ctx.fillStyle="#070c15";ctx.fillRect(0,0,WORLD_W,WORLD_H);
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const px=x*T,py=y*T;
  if(L.grid[y][x]==="#"){
   ctx.fillStyle="#0d1624";ctx.fillRect(px,py,T,T);
   ctx.strokeStyle="#18283e";ctx.strokeRect(px+.5,py+.5,T-1,T-1);
   if(y+1<ROWS&&L.grid[y+1][x]==="."){ctx.fillStyle="#16243a";ctx.fillRect(px,py+T-4,T,4)}
  }else{
   ctx.fillStyle=(x+y)%2?"#0a121f":"#0b1422";ctx.fillRect(px,py,T,T);
   ctx.fillStyle="#111d2c";ctx.fillRect(px+2,py+2,T-4,1);
  }
 }
 for(const d of L.doors){
  const q=center(d),o=doorOpen(d);
  ctx.fillStyle=o?"#174a42":"#642c3a";ctx.fillRect(d.x*T+3,d.y*T+3,T-6,T-6);
  ctx.strokeStyle=o?"#63f0d1":"#ff627c";ctx.lineWidth=2;ctx.strokeRect(d.x*T+5,d.y*T+5,T-10,T-10);
  ctx.fillStyle="#fff";ctx.font="900 10px system-ui";ctx.textAlign="center";ctx.fillText(d.requires,q.x,q.y+3);
 }
 for(const b of L.buttons){
  const q=center(b),on=ecos.some(e=>e.buttonId===b.id);
  ctx.beginPath();ctx.arc(q.x,q.y,10,0,Math.PI*2);ctx.fillStyle=on?"#5fe6c9":"#3d4d66";ctx.fill();
  ctx.beginPath();ctx.arc(q.x,q.y,15,0,Math.PI*2);ctx.strokeStyle=on?"#5fe6c9":"#53647e";ctx.globalAlpha=.65;ctx.stroke();ctx.globalAlpha=1;
  ctx.fillStyle="#e8f2ff";ctx.font="900 9px system-ui";ctx.fillText(b.id,q.x,q.y-19);
 }
 const ex=center(L.exit);
 ctx.beginPath();ctx.arc(ex.x,ex.y,14,0,Math.PI*2);ctx.strokeStyle="#719cff";ctx.lineWidth=3;ctx.stroke();
 ctx.beginPath();ctx.arc(ex.x,ex.y,5,0,Math.PI*2);ctx.fillStyle="#719cff";ctx.fill();
 ctx.fillStyle="#91b2ff";ctx.font="900 8px system-ui";ctx.fillText("SALIDA",ex.x,ex.y+25);
 for(const e of ecos){
  ctx.beginPath();ctx.arc(e.x,e.y,14,0,Math.PI*2);ctx.strokeStyle="#719cff";ctx.globalAlpha=.3;ctx.lineWidth=5;ctx.stroke();ctx.globalAlpha=1;
  ctx.beginPath();ctx.arc(e.x,e.y,9,0,Math.PI*2);ctx.fillStyle="#719cff";ctx.fill();
  ctx.fillStyle="#fff";ctx.font="900 8px system-ui";ctx.fillText("E"+e.buttonId,e.x,e.y+3);
 }
 ctx.beginPath();ctx.arc(player.x,player.y,19,0,Math.PI*2);ctx.fillStyle="#62f2d21c";ctx.fill();
 ctx.beginPath();ctx.arc(player.x,player.y,9,0,Math.PI*2);ctx.fillStyle="#f7ffff";ctx.fill();
 ctx.strokeStyle="#62f2d2";ctx.lineWidth=2;ctx.stroke();
 ctx.restore();
}
function loop(t){const dt=Math.min((t-last)/1000,.035);last=t;if(!won){const d=direction();move(d.x,d.y,dt)}draw();requestAnimationFrame(loop)}
addEventListener("keydown",e=>{keys[e.key]=true;if(e.key===" "){e.preventDefault();makeEco()}});
addEventListener("keyup",e=>keys[e.key]=false);
$("#make").onclick=makeEco;$("#reset").onclick=reset;$("#again").onclick=reset;
$("#next").onclick=()=>{if(L.id<120)load(L.id+1)};
$("#full").onclick=()=>requestFull();
async function requestFull(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();screen.orientation?.lock?.("landscape").catch(()=>{})}catch(e){}}
document.addEventListener("pointerdown",()=>{if(!document.fullscreenElement)requestFull()},{once:true});
let drag=false;
function stickSet(e){const r=$("#joy").getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.36),y=(e.clientY-cy)/(r.height*.36),m=Math.hypot(x,y);if(m>1){x/=m;y/=m}stick={x,y};$("#knob").style.transform=`translate(${x*22}px,${y*22}px)`}
$("#joy").onpointerdown=e=>{drag=true;$("#joy").setPointerCapture(e.pointerId);stickSet(e)}
$("#joy").onpointermove=e=>{if(drag)stickSet(e)}
$("#joy").onpointerup=$("#joy").onpointercancel=()=>{drag=false;stick={x:0,y:0};$("#knob").style.transform="translate(0,0)"}
