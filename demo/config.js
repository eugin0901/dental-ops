(function(){try{const t='__t';window.localStorage.setItem(t,'1');window.localStorage.removeItem(t)}catch(e){const m={};const st={getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]},clear:()=>{for(const k in m)delete m[k]}};try{Object.defineProperty(window,'localStorage',{value:st,configurable:true})}catch(x){}}})();

window.__seed=function(){
 const p=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const dw=(new Date().getDay()+6)%7, mon=p(-dw);
 const R=[],C=(m,id,data,by)=>R.push({clinic_id:'c1',module:m,id,data,created_by:by||'a1'});
 C('staff','s0',{name:'박원장',role:'원장',rank:'원장',uid:'a0',hire:'2018-03-01',leaveTotal:15,phone:'010-0000-0000'});
 C('staffpriv','s2',{ctype:'정규직',cend:'2027-03-01',salary:'월 280만 원 (예시)',bank:'○○은행 (예시)',addr:'서울 ○○구 (예시)',emer:'모 · 010-0000-9999 (예시)',pmemo:'1년 차 면담 예정 (예시)'});
 C('staff','s1',{name:'김실장',role:'실장',rank:'실장',uid:'a1',hire:'2021-04-01',leaveTotal:17,phone:'010-0000-0001'});
 C('staff','s2',{name:'이위생',role:'치과위생사',rank:'사원',uid:'a2',hire:'2025-03-02',leaveTotal:15,phone:'010-0000-0002'});
 C('staff','s3',{name:'최조무',role:'간호조무사',hire:'2024-09-16',leaveTotal:15});
 C('staff','s4',{name:'박데스크',role:'데스크',hire:'2026-02-02',leaveTotal:11});
 const W=['종일','종일','오전','종일','종일','오전','휴무'];
 C('shift',mon,{cells:{s1:W,s2:['종일','종일','종일','오후','종일','오전','휴무'],s3:['종일','휴무','종일','종일','종일','오전','휴무'],s4:W}});
 C('leave','l1',{staff:'이위생',date:p(-3),days:1,type:'연차',note:'개인 일정'},'a2');
 C('leave','l2',{staff:'이위생',date:p(19),days:1,type:'연차',note:'12월 연차'},'a2');
 C('leave','l3',{staff:'최조무',date:p(7),days:0.5,type:'반차'});
 C('invcfg','main',{mgr_clinic:'이위생',mgr_office:'박데스크',mgr_implant:'김실장',orderDay:10});
 [['i1','글러브 M','치과재료 외 소모품',2,3,'박스'],['i2','석션팁','치과재료 외 소모품',1,3,'박스'],['i3','레진 A2','보존',6,3,'개'],['i4','알지네이트','보철',4,2,'봉'],['i5','불소 바니시','예방',10,4,'개'],['i6','복사용지','사무용품',5,2,'박스'],['i7','힐링 어버트먼트','임플란트',8,5,'개']].forEach(([id,name,cat,qty,min,unit])=>C('inv',id,{name,cat,qty,min,unit,price:{i1:12000,i2:8000,i3:15000,i4:9000}[id]||'',vendor:{i3:'미래덴탈',i4:'미래덴탈',i6:''}[id]??'한빛치재'}));
 C('notice','n1',{cat:'일정',rsvp:'예',edate:'2026-12-19',title:'12월 송년회 안내',body:'12/19(금) 저녁 7시, 장소는 추후 공지할게요.',rsvpDue:p(14),author:'김실장',date:p(-1)});
 C('notice','n2',{cat:'일정',title:'감염관리 보수교육 신청',body:'이번 달 안에 신청해 주세요.',author:'김실장',date:p(-4)});
 C('task','t1',{from:'김실장',to:'이위생',title:'석션 업체에 수리 일정 연락',pri:'급함',status:'전달됨',due:p(1),sent:p(-1)});
 C('task','t2',{from:'김실장',to:'이위생',title:'다음 달 희망 휴무 제출',status:'전달됨',due:p(4),sent:p(-2)});
 C('task','t4',{from:'김실장',to:'최조무',title:'파노라마 점검 업체 견적 받기',status:'확인함',due:p(-1),sent:p(-5)});
 C('task','t5',{from:'박데스크',to:'김실장',title:'신환 상담 일정 정리해서 공유',status:'확인함',due:p(0),sent:p(-1)},'a1');
 C('task','t6',{from:'김실장',to:'박데스크',title:'12월 예약 현황 정리',status:'완료',due:p(-1),sent:p(-4),doneOn:p(-1)});
 C('task','t7',{from:'이위생',to:'김실장',title:'석션팁 주문 승인',status:'완료',due:p(0),sent:p(-1),doneOn:p(0)},'a2');
 C('task','t3',{from:'이위생',to:'최조무',title:'멸균 파우치 재고 확인',status:'확인함',due:p(2),sent:p(-3)},'a2');
 C('vendor','v1',{name:'한빛치재',type:'재료업체',person:'김OO 대리',mobile:'010-0000-1111',kakao:'카톡 주문'});
 C('vendor','v2',{name:'미래덴탈',type:'재료업체',person:'이OO 과장',phone:'02-000-2222'});
 C('vendor','v3',{name:'바른장비서비스',type:'장비업체',person:'박OO 기사',mobile:'010-0000-3333'});
 C('equip','e1',{name:'유니트체어 3번',vendor:'바른장비서비스',model:'오셀라 OSD-3',cat:'진료 장비',place:'3번 진료실',owner:'이위생',cycle:12,last:p(-200)});
 C('equip','e2',{name:'오토클레이브',cat:'소독·멸균 장비',place:'소독실',owner:'이위생',cycle:6,last:p(-178)});
 C('equip','e3',{name:'파노라마',cat:'영상 장비',place:'촬영실',owner:'최조무',cycle:12,last:p(-90)});
 C('equip','e4',{name:'컴프레서',cat:'설비',place:'기계실',owner:'이위생',cycle:3,last:p(-30)});
 C('manual','m0',{title:'신입 첫 주 교육 (사진 매뉴얼)',cat:'행정',body:'PDF를 올리면 이렇게 쪽마다 넘겨 볼 수 있어요.',pages:[1,2,3,4,5].map(i=>({ref:'sample/manual-'+i+'.jpg',w:1400,h:990})),files:[]});
 C('manual','m1',{title:'오픈 준비 순서',cat:'진료 세팅',body:'1. 출근 기록\n2. 유니트체어·컴프레서·석션 전원 켜기\n3. 물 라인 2분 플러싱\n4. 오늘 예약 확인 (기공물 장착, 수술 환자 먼저)\n5. 진료실별 기구·재료 세팅'});
 C('manual','m2',{title:'전화 응대 기본',cat:'데스크·응대',body:'1. "감사합니다, 미소치과 ○○○입니다."\n2. 예약 문의: 이름·연락처·원하는 날짜 확인\n3. 통증·붓기 등 급한 증상은 원장님께 바로 전달\n4. 통화 끝: 예약 날짜·시간 다시 확인'});
 C('manual','m3',{title:'기구 소독·멸균 흐름',cat:'감염관리',body:'1. 사용 기구 회수 (보호장갑)\n2. 세척 → 건조 → 파우치 포장, 날짜 표시\n3. 오토클레이브 멸균, CI 색 변화 확인\n4. 멸균 기록 작성'});
 C('repair','r1',{equip:'유니트체어 3번',symptom:'석션 흡입력 약함',status:'접수',date:p(-1)});
 C('alert','al1',{msg:'3번 체어 석션 고장, 수리 전까지 쓰지 마세요',by:'김실장',at:Date.now()-20*60000});
 C('alert','al2',{msg:'오늘 오후 2시 소독기 점검 기사님 방문해요',by:'박팀장',at:Date.now()-3*86400000});
 C('alert','al3',{msg:'정수기 필터 교체 완료, 물 사용 가능해요',by:'김실장',at:Date.now()-6*86400000});
 C('alert','al4',{msg:'내일 오전 진료 30분 늦게 시작해요',by:'김실장',at:Date.now()-12*86400000});
 C('alertack','al2_u2',{aid:'al2',uid:'u2',name:'이위생',at:Date.now()-3*86400000});
 C('alertack','al4_u2',{aid:'al4',uid:'u2',name:'이위생',at:Date.now()-12*86400000});
 C('closed','2026-12-25',{date:'2026-12-25',reason:'성탄절'});
 C('closed','2027-01-01',{date:'2027-01-01',reason:'신정'});
 C('event','ev2',{title:'치과 학회 (원장님)',date:p(10),end:p(11),kind:'교육·학회'});
 C('event','ev3',{title:'월간 직원 회의',date:p(6),kind:'회의'});
 C('leave','l4',{staff:'최조무',date:p(9),days:2,type:'경조사',note:'결혼식'});
 C('role','ro1',{name:'오픈 준비',days:'진료일 (월~토)',order:1,staff:['박데스크'],items:'유니트체어 전원·물 라인 플러싱\n석션·컴프레서 가동 확인\n오늘 예약·기공물 장착 환자 확인'});
 C('role','ro2',{name:'소독실',days:'진료일 (월~토)',order:2,staff:['이위생'],items:'오토클레이브 가동 및 CI 확인\n소독액 농도 확인\n멸균 기록 작성\n[월] BI(생물학적 지표) 검사'});
 C('role','ro3',{name:'진료실 정리',days:'진료일 (월~토)',order:3,staff:['이위생','최조무'],items:'체어별 표면 소독\n석션 라인 세척\n[토] 석션 필터 청소'});
 C('role','ro4',{name:'마감',days:'진료일 (월~토)',order:4,staff:['김실장'],items:'장비 전원 끄기\n의료폐기물 정리\n내일 예약 확인·준비물 체크'});
 C('lab','lb1',{chart:'A-1023',item:'지르코니아 크라운',vendor:'미소기공소',status:'의뢰',sent:p(-5),due:p(2)});
 return {uid:'a2',users:{a1:'김실장',a2:'이위생'},
  profiles:[{id:'a0',name:'박원장',clinic_id:'c1',role:'admin',rank:'원장',approved:true,created_at:p(-70)},{id:'a1',name:'김실장',clinic_id:'c1',role:'admin',rank:'실장',approved:true,created_at:p(-60)},{id:'a2',name:'이위생',clinic_id:'c1',role:'staff',rank:'사원',approved:true,created_at:p(-50)}],
  clinics:[{id:'c1',name:'미소치과 (체험)',invite_code:'DEMO23',settings:{stage:3,menus_off:[],wifi_ips:['체험판 와이파이'],wifi_lock:true,auto_in:true,leave_remind:'18:30'}}],
  records:R,feedback:[],usage:[],operators:[],files:{}};
};
window.APP_CONFIG={SUPABASE_URL:'https://x.supabase.co',SUPABASE_ANON_KEY:'k',SERVICE_NAME:'치과 운영 관리',OCR_ENABLED:false,PUSH_ENABLED:false,VAPID_PUBLIC_KEY:'BDg6KDbxUa2Hzr84rEt5oyc7aeN36Qn_HLlK_i3iJs9o5mFLbtw3_cyee3fZEhBgkAHFz5baW7fBd1rHVBMSVNw'};
(function(){
 const K='dental-demo-v19';const LS=(()=>{try{const t='__t';localStorage.setItem(t,'1');localStorage.removeItem(t);return localStorage}catch(e){const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}}})();window.__LS=LS;
 if(!LS.getItem(K))LS.setItem(K,JSON.stringify(window.__seed()));
 const st=JSON.parse(LS.getItem(K)||'null')||{uid:null,users:{},profiles:[],clinics:[],records:[],feedback:[],usage:[],operators:[],files:{}};
 const save=()=>LS.setItem(K,JSON.stringify(st));window.__st=st;window.__save=save;
 const me=()=>st.profiles.find(p=>p.id===st.uid);
 function q(table){let f=[],op='select',payload=null,single=false,ord=null,lim=null,opts=null;const api={
  select(){return api},order(k,o){ord=[k,o];return api},range(a,b){api._r=[a,b];return api},limit(n){lim=n;return api},
  eq(k,v){f.push([k,v]);return api},maybeSingle(){single=true;return api},
  upsert(p,o){op='upsert';payload=p;opts=o;return api},insert(p){op='insert';payload=p;return api},update(p){op='update';payload=p;return api},delete(){op='delete';return api},
  then(res,rej){let rows=st[table];const m=r=>f.every(([k,v])=>r[k]===v);let out;
   if(op==='select'){let d=rows.filter(m);if(ord)d=[...d].sort((a,b)=>(a[ord[0]]>b[ord[0]]?1:-1)*((ord[1]&&ord[1].ascending===false)?-1:1));if(lim)d=d.slice(0,lim);if(api._r)d=d.slice(api._r[0],api._r[1]+1);out={data:single?(d[0]||null):d,error:null}}
   else if(op==='upsert'){const i=rows.findIndex(r=>r.clinic_id===payload.clinic_id&&r.module===payload.module&&r.id===payload.id);const row={...payload,created_by:i<0?st.uid:rows[i].created_by};if(i<0)rows.push(row);else rows[i]=row;save();out={error:null}}
   else if(op==='insert'){rows.push({id:rows.length+1,created_at:new Date().toISOString(),status:'새 의견',...payload});save();out={error:null}}
   else if(op==='update'){const tg=rows.filter(m);if(payload&&payload.rank&&tg[0]&&tg[0].role==='admin'&&!['원장','총괄실장','실장'].includes(payload.rank)&&!rows.some(r=>r.id!==tg[0].id&&r.role==='admin'&&r.approved&&r.clinic_id===tg[0].clinic_id)){out={error:{message:'관리자가 한 명은 있어야 해요'}}}else{tg.forEach(r=>{Object.assign(r,payload);if(payload&&payload.rank&&'role' in r)r.role=['원장','총괄실장','실장'].includes(payload.rank)?'admin':'staff'});save();out={error:null}}}
   else {const del=rows.filter(m);st[table]=rows.filter(r=>!m(r));save();out={data:del.map(r=>({id:r.id})),error:null}}
   return Promise.resolve(out).then(res,rej)}};return api}
 const err=m=>({data:null,error:{message:m}});
 const code=()=>Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
 const ok={data:null,error:null};
 const R={
  save_push_sub(a){st.push=(st.push||[]).filter(x=>x.p_endpoint!==a.p_endpoint);st.push.push({...a,uid:st.uid});save();return ok},
  delete_push_sub(a){st.push=(st.push||[]).filter(x=>x.p_endpoint!==a.p_endpoint);save();return ok},
  get_push_prefs(){st.prefs=st.prefs||{};return{data:{...(st.prefs[st.uid]||{}),devices:(st.push||[]).filter(x=>x.uid===st.uid).length},error:null}},
  set_push_prefs({p}){st.prefs=st.prefs||{};st.prefs[st.uid]=p;save();return ok},
  ensure_profile(){if(!me()){st.profiles.push({id:st.uid,name:st.users[st.uid],clinic_id:null,role:'staff',approved:false,created_at:new Date().toISOString()});save()}return{data:null,error:null}},
  create_clinic({p_name}){const p=me();if(p.clinic_id)return err('이미 다른 치과에 소속돼 있어요');const id='c'+(st.clinics.length+1);st.clinics.push({id,name:p_name,invite_code:code(),settings:{stage:1,menus_off:['inv','order','lab','ster','equip','repair','vendor','attend','manual','kpi','mkt']},created_at:new Date().toISOString()});Object.assign(p,{clinic_id:id,role:'admin',approved:true});save();return{data:id,error:null}},
  join_clinic({p_code}){const p=me();const c=st.clinics.find(c=>c.invite_code===p_code);if(!c)return err('초대코드가 맞지 않아요');Object.assign(p,{clinic_id:c.id,role:'staff',approved:false});save();return{data:c.name,error:null}},
  leave_clinic(){Object.assign(me(),{clinic_id:null,approved:false,role:'staff'});save();return{data:null,error:null}},
  remove_member({p_user}){const t=st.profiles.find(p=>p.id===p_user);Object.assign(t,{clinic_id:null,approved:false,role:'staff'});save();return{data:null,error:null}},
  reset_invite_code(){const c=st.clinics.find(c=>c.id===me().clinic_id);c.invite_code=code();save();return{data:c.invite_code,error:null}},
  update_clinic({p_name,p_settings}){const c=st.clinics.find(c=>c.id===me().clinic_id);if(p_name)c.name=p_name;if(p_settings)c.settings=p_settings;save();return{data:null,error:null}},
  log_usage({p_module,p_kind}){st.usage.push({clinic_id:me().clinic_id,user_id:st.uid,module:p_module,kind:p_kind});save();return{data:null,error:null}},
  is_operator(){return{data:st.operators.includes(st.uid),error:null}},
  op_clinics(){return{data:st.clinics.map(c=>({id:c.id,name:c.name,created_at:c.created_at,members:st.profiles.filter(p=>p.clinic_id===c.id&&p.approved).length,pending:st.profiles.filter(p=>p.clinic_id===c.id&&!p.approved).length,records:st.records.filter(r=>r.clinic_id===c.id).length,last_active:new Date().toISOString().slice(0,10),active_users_7d:new Set(st.usage.filter(u=>u.clinic_id===c.id).map(u=>u.user_id)).size,menus_off:(c.settings||{}).menus_off||[]})),error:null}},
  op_usage(){const m={};for(const u of st.usage){const k=u.clinic_id+'|'+u.module+'|'+u.kind;m[k]=m[k]||{clinic_id:u.clinic_id,module:u.module,kind:u.kind,total:0,users:new Set(),days:1};m[k].total++;m[k].users.add(u.user_id)}return{data:Object.values(m).map(x=>({...x,users:x.users.size})),error:null}}
 };
 window.supabase={createClient(){return{
  from:q,rpc(n,a){return Promise.resolve(R[n]?R[n](a||{}):err('no rpc '+n))},
  channel(){const c={on(){return c},subscribe(){return c}};return c},removeChannel(){},
  storage:{from(){return{upload(p,b){st.files[p]=b.size;try{(window.__BLOBS=window.__BLOBS||{})[p]=URL.createObjectURL(b)}catch(e){}save();return Promise.resolve({error:null})},createSignedUrl(p){const B=window.__BLOBS||{};return Promise.resolve({data:{signedUrl:B[p]||(/^sample\//.test(p)?p:'data:image/gif;base64,R0lGODlhAQABAAAAACw=')},error:null})},remove(ps){ps.forEach(p=>delete st.files[p]);save();return Promise.resolve({error:null})}}}},
  functions:{invoke(n,o){const bd=(o&&o.body)||{};
   if(n==='punch'){const cl=st.clinics[0];cl.settings=cl.settings||{};const prof=st.profiles.find(p=>p.id===st.uid)||{};
     if(bd.register||bd.clear){if(prof.role!=='admin')return Promise.resolve({data:{status:'denied'},error:null});cl.settings.wifi_ips=bd.clear?[]:['체험판 와이파이'];save();return Promise.resolve({data:{status:'ok',count:cl.settings.wifi_ips.length},error:null})}
     if(!(cl.settings.wifi_ips||[]).length)return Promise.resolve({data:{status:'not_wifi',registered:false},error:null});
     if(bd.auto&&!cl.settings.auto_in)return Promise.resolve({data:{status:'off'},error:null});
     const sr=st.records.find(r=>r.module==='staff'&&r.data.uid===st.uid);if(!sr)return Promise.resolve({data:{status:'nolink'},error:null});
     const z=new Date(),pd=x=>String(x).padStart(2,'0'),dt=z.getFullYear()+'-'+pd(z.getMonth()+1)+'-'+pd(z.getDate()),tm=pd(z.getHours())+':'+pd(z.getMinutes()),id=dt+'_'+sr.id;
     let r=st.records.find(x=>x.module==='att'&&x.id===id);const kind=bd.kind==='out'?'out':'in';
     if(kind==='in'&&r&&r.data.in)return Promise.resolve({data:{status:'already',time:r.data.in},error:null});
     if(!r){r={clinic_id:'c1',module:'att',id,data:{staff:sr.data.name,sid:sr.id,date:dt,in:'',out:'',note:''},created_by:st.uid};st.records.push(r)}
     r.data[kind]=tm;let lg=st.records.find(x=>x.module==='attlog'&&x.id===id);if(!lg){lg={clinic_id:'c1',module:'attlog',id,data:{sid:sr.id,date:dt},created_by:st.uid};st.records.push(lg)}lg.data[kind+'_via']=bd.outside?'outside':bd.auto?'wifi-auto':'wifi';save();return Promise.resolve({data:{status:'ok',time:tm,kind,auto:!!bd.auto},error:null})}
   st.invokes=st.invokes||[];st.invokes.push({fn:n,uid:st.uid,...bd});save();return Promise.resolve({data:{sent:1},error:null})}},
  auth:{onAuthStateChange(cb){setTimeout(()=>cb('INITIAL_SESSION',st.uid?{user:{id:st.uid}}:null),10);return{data:{}}},signInWithOAuth(){return Promise.resolve({error:null})},signOut(){st.uid=null;save();return Promise.resolve({})}}}}};
 window.__login=(id,name)=>{st.uid=id;st.users[id]=name;if(!st.profiles.find(p=>p.id===id))st.profiles.push({id,name,clinic_id:null,role:'staff',approved:false,created_at:new Date().toISOString()});save()};
})();

document.addEventListener('DOMContentLoaded',()=>{
 const st=window.__st;const b=document.createElement('div');b.id='demobar';
 b.innerHTML=`<b>체험판</b> <span>지금: ${st.uid==='a0'?'박원장 (원장)':st.uid==='a1'?'김실장 (관리자)':'이위생 (직원)'}</span>
  <button type="button" data-as="a2"${st.uid==='a2'?' disabled':''}>직원 화면</button><button type="button" data-as="a1"${st.uid==='a1'?' disabled':''}>관리자 화면</button><button type="button" data-as="a0"${st.uid==='a0'?' disabled':''}>원장 화면</button><button type="button" data-reset>처음으로</button><button type="button" data-guide>가이드</button>`;
 const css=document.createElement('style');css.textContent='#demobar{position:fixed;left:8px;bottom:calc(8px + var(--dbo,0px));z-index:50;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#10232a;color:#fff;padding:6px 8px;border-radius:12px;font:13px/1.2 sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:calc(100vw - 140px)}@media(max-width:600px){#demobar{--dbo:72px}}#demobar button{min-height:32px;padding:0 10px;border-radius:8px;border:0;background:#fff;color:#10232a;font-size:13px;cursor:pointer}#demobar button[disabled]{opacity:.45}#demobar span{opacity:.85}';
 document.head.appendChild(css);document.body.appendChild(b);
 b.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.as){st.uid=t.dataset.as;window.__save();location.hash=t.dataset.as==='a2'?'#my':'#home';location.reload()}if('guide' in t.dataset){window.__tour&&window.__tour();return}if('reset' in t.dataset){window.__LS.removeItem('dental-demo-v19');location.hash='#my';location.reload()}});
});
