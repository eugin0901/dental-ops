// demo/tour.js 의 안내 문장을 docs/체험판_음성_대본.csv 로 뽑아요. 실행: node tools/voice_script.js
const path=require('path'),fs=require('fs');
global.window={sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},addEventListener(){}};
global.document={readyState:'loading',addEventListener(){},querySelector(){}};global.addEventListener=()=>{};
require(path.join(__dirname,'..','demo','tour.js'));
const r=window.__tourScript(),q=s=>'"'+String(s).replace(/"/g,'""')+'"';
const rows=[['순서','장','파일 이름','쓰이는 체험','읽을 문장','글자 수']].concat(r.map((x,i)=>[i+1,x[0],x[1]+'.mp3',x[2],x[3],x[3].length]));
fs.writeFileSync(path.join(__dirname,'..','docs','체험판_음성_대본.csv'),'﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n'));
console.log(r.length+'개 문장');
