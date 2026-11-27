// 작은 QR 코드 생성기 (바이트 모드, 오류 정정 M, 버전 1~10)
const QR=(()=>{
  const EXP=new Array(512),LOG=new Array(256);
  for(let i=0,x=1;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11d}
  for(let i=255;i<512;i++)EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  const gen=n=>{let g=[1];for(let i=0;i<n;i++){const ng=new Array(g.length+1).fill(0);for(let j=0;j<g.length;j++){ng[j]^=g[j];ng[j+1]^=mul(g[j],EXP[i])}g=ng}return g};
  const ecc=(data,n)=>{const g=gen(n),r=new Array(n).fill(0);for(const d of data){const f=d^r[0];r.shift();r.push(0);if(f)for(let j=0;j<n;j++)r[j]^=mul(g[j+1],f)}return r};
  // 버전별 [블록당 ECC 수, [블록 수, 블록당 데이터 수]...] (레벨 M)
  const T=[null,[10,[1,16]],[16,[1,28]],[26,[1,44]],[18,[2,32]],[24,[2,43]],[16,[4,27]],[18,[4,31]],[22,[2,38],[2,39]],[22,[3,36],[2,37]],[26,[4,43],[1,44]]];
  const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  const cap=v=>T[v].slice(1).reduce((a,[n,k])=>a+n*k,0);
  function encode(text){
    const bytes=[...new TextEncoder().encode(text)];
    let v=1;while(v<=10&&cap(v)<bytes.length+(v<10?2:3))v++;
    if(v>10)throw new Error('QR 내용이 너무 길어요');
    const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
    put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
    const total=cap(v)*8;put(0,Math.min(4,total-bits.length));while(bits.length%8)bits.push(0);
    const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
    for(let p=0;data.length<cap(v);p++)data.push(p%2?0x11:0xec);
    // 블록 나누기 + 오류 정정 + 섞기
    const blocks=[];let o=0;const ne=T[v][0];
    for(const [n,k] of T[v].slice(1))for(let i=0;i<n;i++){const d=data.slice(o,o+k);o+=k;blocks.push([d,ecc(d,ne)])}
    const out=[];const mx=Math.max(...blocks.map(b=>b[0].length));
    for(let i=0;i<mx;i++)for(const b of blocks)if(i<b[0].length)out.push(b[0][i]);
    for(let i=0;i<ne;i++)for(const b of blocks)out.push(b[1][i]);
    const size=17+4*v,M=[...Array(size)].map(()=>new Array(size).fill(null)),F=[...Array(size)].map(()=>new Array(size).fill(false));
    const set=(r,c,val)=>{M[r][c]=val;F[r][c]=true};
    const finder=(r,c)=>{for(let i=-1;i<=7;i++)for(let j=-1;j<=7;j++){const y=r+i,x=c+j;if(y<0||x<0||y>=size||x>=size)continue;const on=i>=0&&i<=6&&j>=0&&j<=6&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));set(y,x,on)}};
    finder(0,0);finder(0,size-7);finder(size-7,0);
    for(let i=8;i<size-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const al=ALIGN[v],L=al.length-1;al.forEach((r,a)=>al.forEach((c,b)=>{if((a===0&&b===0)||(a===0&&b===L)||(a===L&&b===0))return;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)set(r+i,c+j,Math.max(Math.abs(i),Math.abs(j))!==1)}));
    set(size-8,8,true);
    for(let i=0;i<9;i++){if(!F[8][i])set(8,i,false);if(!F[i][8])set(i,8,false)}
    for(let i=0;i<8;i++){set(8,size-1-i,false);set(size-1-i,8,false)}
    if(v>=7)for(let i=0;i<6;i++)for(let j=0;j<3;j++){set(i,size-11+j,false);set(size-11+j,i,false)}
    // 데이터 배치
    const db=[];out.forEach(b=>{for(let i=7;i>=0;i--)db.push((b>>i)&1)});
    let k=0,up=true;
    for(let c=size-1;c>0;c-=2){if(c===6)c--;
      for(let t=0;t<size;t++){const r=up?size-1-t:t;for(let d=0;d<2;d++){const x=c-d;if(!F[r][x]){M[r][x]=k<db.length?db[k]===1:false;k++}}}
      up=!up}
    const MASKS=[(r,c)=>(r+c)%2===0,(r)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];
    const fmtBits=m=>{const d=(0<<3)|m;let b=d<<10;for(let i=14;i>=10;i--)if(b&(1<<i))b^=0x537<<(i-10);return ((d<<10)|b)^0x5412}; // M = 00
    const verBits=()=>{let b=v<<12;for(let i=17;i>=12;i--)if(b&(1<<i))b^=0x1f25<<(i-12);return (v<<12)|b};
    const build=m=>{const G=M.map((row,r)=>row.map((val,c)=>F[r][c]?val:(val!==MASKS[m](r,c))));
      const f=fmtBits(m);
      const B=i=>((f>>i)&1)===1;
      for(let i=0;i<=5;i++)G[i][8]=B(i);G[7][8]=B(6);G[8][8]=B(7);G[8][7]=B(8);for(let i=9;i<15;i++)G[8][14-i]=B(i);
      for(let i=0;i<8;i++)G[8][size-1-i]=B(i);for(let i=8;i<15;i++)G[size-15+i][8]=B(i);G[size-8][8]=true;
      if(v>=7){const vb=verBits();for(let i=0;i<18;i++){const bit=((vb>>i)&1)===1,a=Math.floor(i/3),b=size-11+i%3;G[a][b]=bit;G[b][a]=bit}}
      return G};
    const penalty=G=>{let p=0;const n=size;
      for(let r=0;r<n;r++)for(const line of [G[r],G.map(x=>x[r])]){let run=1;for(let i=1;i<n;i++){if(line[i]===line[i-1]){run++;if(i===n-1&&run>=5)p+=run-2}else{if(run>=5)p+=run-2;run=1}}
        const s=line.map(x=>x?1:0).join('');for(const pat of ['10111010000','00001011101'])for(let i=s.indexOf(pat);i>=0;i=s.indexOf(pat,i+1))p+=40}
      for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const a=G[r][c];if(a===G[r+1][c]&&a===G[r][c+1]&&a===G[r+1][c+1])p+=3}
      const dark=G.flat().filter(Boolean).length;p+=Math.floor(Math.abs(dark*20/(n*n)-10))*10;return p};
    let best=null,bp=Infinity;for(const m of [0,2,3,4,5,6,7]){const G=build(m),p=penalty(G);if(p<bp){bp=p;best=G}}
    return best;
  }
  function svg(text,px){const G=encode(text),n=G.length,q=4;let d='';
    G.forEach((row,r)=>row.forEach((on,c)=>{if(on)d+=`M${c+q} ${r+q}h1v1h-1z`}));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+2*q} ${n+2*q}"${px?` width="${px}" height="${px}"`:''} shape-rendering="crispEdges" role="img" aria-label="QR 코드"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
  return {encode,svg};
})();
if(typeof module!=='undefined')module.exports=QR;
