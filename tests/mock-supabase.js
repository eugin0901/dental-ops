window.APP_CONFIG={SUPABASE_URL:'https://x.supabase.co',SUPABASE_ANON_KEY:'k',SERVICE_NAME:'치과 운영 관리',OCR_ENABLED:false};
(function(){
 const K='mock3';const st=JSON.parse(localStorage.getItem(K)||'null')||{uid:null,users:{},profiles:[],clinics:[],records:[],feedback:[],usage:[],operators:[],files:{}};
 const save=()=>localStorage.setItem(K,JSON.stringify(st));window.__st=st;window.__save=save;
 const me=()=>st.profiles.find(p=>p.id===st.uid);
 function q(table){let f=[],op='select',payload=null,single=false,ord=null,lim=null,opts=null;const api={
  select(){return api},order(k,o){ord=[k,o];return api},range(a,b){api._r=[a,b];return api},limit(n){lim=n;return api},
  eq(k,v){f.push([k,v]);return api},maybeSingle(){single=true;return api},
  upsert(p,o){op='upsert';payload=p;opts=o;return api},insert(p){op='insert';payload=p;return api},update(p){op='update';payload=p;return api},delete(){op='delete';return api},
  then(res,rej){let rows=st[table];const m=r=>f.every(([k,v])=>r[k]===v);let out;
   if(op==='select'){let d=rows.filter(m);if(ord)d=[...d].sort((a,b)=>(a[ord[0]]>b[ord[0]]?1:-1)*((ord[1]&&ord[1].ascending===false)?-1:1));if(lim)d=d.slice(0,lim);if(api._r)d=d.slice(api._r[0],api._r[1]+1);out={data:single?(d[0]||null):d,error:null}}
   else if(op==='upsert'){const i=rows.findIndex(r=>r.clinic_id===payload.clinic_id&&r.module===payload.module&&r.id===payload.id);const row={...payload,created_by:i<0?st.uid:rows[i].created_by};if(i<0)rows.push(row);else rows[i]=row;save();out={error:null}}
   else if(op==='insert'){rows.push({id:rows.length+1,created_at:new Date().toISOString(),status:'새 의견',...payload});save();out={error:null}}
   else if(op==='update'){rows.filter(m).forEach(r=>Object.assign(r,payload));save();out={error:null}}
   else {const del=rows.filter(m);st[table]=rows.filter(r=>!m(r));save();out={data:del.map(r=>({id:r.id})),error:null}}
   return Promise.resolve(out).then(res,rej)}};return api}
 const err=m=>({data:null,error:{message:m}});
 const code=()=>Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
 const R={
  ensure_profile(){if(!me()){st.profiles.push({id:st.uid,name:st.users[st.uid],clinic_id:null,role:'staff',approved:false,created_at:new Date().toISOString()});save()}return{data:null,error:null}},
  create_clinic({p_name}){const p=me();if(p.clinic_id)return err('이미 다른 치과에 소속돼 있어요');const id='c'+(st.clinics.length+1);st.clinics.push({id,name:p_name,invite_code:code(),settings:{stage:1,menus_off:['inv','order','lab','ster','equip','repair','vendor','attend','manual','kpi','mkt']},created_at:new Date().toISOString()});Object.assign(p,{clinic_id:id,role:'admin',rank:'원장',approved:true});save();return{data:id,error:null}},
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
  storage:{from(){return{upload(p,b){st.files[p]=b.size;save();return Promise.resolve({error:null})},createSignedUrl(){return Promise.resolve({data:{signedUrl:'data:image/gif;base64,R0lGODlhAQABAAAAACw='},error:null})},remove(ps){ps.forEach(p=>delete st.files[p]);save();return Promise.resolve({error:null})}}}},
  functions:{invoke(){return Promise.resolve({data:{},error:null})}},
  auth:{onAuthStateChange(cb){setTimeout(()=>cb('INITIAL_SESSION',st.uid?{user:{id:st.uid}}:null),10);return{data:{}}},signInWithOAuth(){return Promise.resolve({error:null})},signOut(){st.uid=null;save();return Promise.resolve({})}}}}};
 window.__login=(id,name)=>{st.uid=id;st.users[id]=name;if(!st.profiles.find(p=>p.id===id))st.profiles.push({id,name,clinic_id:null,role:'staff',approved:false,created_at:new Date().toISOString()});save()};
})();
