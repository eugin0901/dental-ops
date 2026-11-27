/* 체험판 가이드 투어: 강조된 곳을 직접 눌러 보며 하루 업무 흐름을 체험해요. (체험판 전용) */
(function(){
const LSK='dental-demo-v19';
const SS=window.sessionStorage;
const ss={get:k=>{try{return SS.getItem(k)}catch(e){return null}},set:(k,v)=>{try{SS.setItem(k,v)}catch(e){}},del:k=>{try{SS.removeItem(k)}catch(e){}}};
const APPLY=(window.APP_CONFIG&&window.APP_CONFIG.APPLY_URL)||'';

// id = 음성 파일 이름(audio/<id>.mp3), q = 빠른 체험에도 포함
const STEPS=[
 {id:'a01',q:1,sec:'내 화면',route:'#my',sel:'.abars [data-ack]',t:'급한 알림은 모든 화면 맨 위에',d:'실장님이 보낸 한 줄 알림이에요. 어느 화면에 있든 맨 위에 떠요. [확인]을 눌러 보세요. 누가 확인했는지 실장님 화면에 이름이 남아요.'},
 {id:'a02',q:1,sec:'내 화면',route:'#my',sel:'[data-mytile=note]',t:'안 읽은 공지는 빨간 테두리로',d:'로그인하면 가장 먼저 보이는 내 화면이에요. 안 읽은 공지와 받은 업무는 빨간 테두리로 표시돼요. [새 공지]를 눌러 보세요.'},
 {id:'a03',q:1,sec:'내 화면',route:'#my',sel:'[data-rsvp="n1|참석"]',t:'일정 공지에는 참석·불참',d:'송년회 같은 일정 공지에는 참석 여부 버튼이 붙어요. [참석]을 눌러 보세요. 인원이 자동으로 모이고 월별 일정에도 들어가요.'},
 {id:'a04',sec:'내 화면',route:'#my',sel:'[data-mytile=today]',t:'오늘 내 근무',d:'오늘 몇 시부터 몇 시까지 근무인지 보여요. 눌러 보세요.'},
 {id:'a05',sec:'내 화면',route:'#my',sel:'.pweek',t:'이번 주 내 근무',d:'이번 주 7일 동안의 내 근무가 한 줄로 보여요. 근무표를 따로 찾아볼 필요가 없어요.',next:1},
 {id:'a06',sec:'내 화면',route:'#my',sel:'[data-mytile=leave]',t:'남은 연차는 자동 계산',d:'입사일부터 1년 단위로 연차가 자동으로 계산돼요. [남은 연차]를 눌러 보세요. 휴가는 직원이 직접 등록할 수 있어요.'},
 {id:'a07',sec:'내 화면',route:'#my',sel:'[data-mytile2=eq2]',t:'내가 맡은 장비',d:'내가 담당하는 장비 중 점검일이 다가온 것만 골라서 보여 줘요. [내 담당 장비]를 눌러 보세요.'},
 {id:'a08',sec:'내 화면',route:'#my',sel:'#view [data-eqdone]',t:'점검 완료는 버튼 하나',d:'점검을 마쳤으면 [오늘 점검 완료]를 눌러요. 다음 점검일이 자동으로 다시 잡혀요. 눌러 보세요.'},
 {id:'a09',q:1,sec:'내 화면',route:'#my',sel:'#view [data-rs$="|완료"]',t:'내 역할 · 오늘 할 일',d:'나에게 맡겨진 역할의 오늘 할 일이에요. 하나를 끝냈다고 생각하고 [완료]를 눌러 보세요. 담당자가 쉬는 날엔 누구나 대신 체크할 수 있어요.'},
 {id:'a10',sec:'내 화면',route:'#my',sel:'.wplan',t:'이번 주 일정',d:'휴진, 동료의 연차, 회의, 학회가 7일로 보여요. 오른쪽 위 [월별 일정]을 누르면 3개월치를 볼 수 있어요.',next:1},
 {id:'b01',q:1,sec:'오늘',route:'#home',sel:'.phblock',t:'오픈 준비 · 마감 현황',d:'치과 전체의 오픈 준비와 마감이 몇 개 남았는지 보여요. 오전에는 오픈 준비가, 오후에는 마감이 진하게 강조돼요.',next:1},
 {id:'b02',sec:'오늘',route:'#home',sel:'[data-go=inv]',t:'오늘 챙길 일',d:'재고 부족, 다가오는 장비 점검, 안 읽은 공지, 나에게 온 업무가 칸마다 숫자로 보여요. 칸을 누르면 해당 화면으로 바로 가요.',next:1},
 {id:'c01',sec:'공지·전달',route:'#notice',sel:'.upst',t:'다가오는 일정',d:'공지·전달 화면 맨 위에는 앞으로 있을 회의, 학회, 휴진, 행사가 모여 있어요.',next:1},
 {id:'c02',sec:'공지·전달',route:'#notice',sel:'#view [data-read]',t:'공지 읽음 확인',d:'공지를 읽고 [읽었어요]를 누르면, 실장님이 누가 읽었는지 이름으로 확인할 수 있어요. 눌러 보세요.'},
 {id:'c03',q:1,sec:'공지·전달',route:'#notice',sel:'[data-ts="확인함"]',t:'받은 업무 확인',d:'실장님이 기한을 정해 보낸 업무예요. [확인했어요]를 누르면 보낸 사람 화면에 바로 표시돼요. 눌러 보세요.'},
 {id:'c04',sec:'공지·전달',route:'#notice',sel:'#view [data-ts="완료"]',t:'업무를 끝내면 완료',d:'일을 마치면 [완료]를 눌러요. 누가, 언제, 무엇을 끝냈는지 기록이 남아요. 눌러 보세요.'},
 {id:'c05',q:1,sec:'공지·전달',route:'#notice',sel:'#al-open',t:'급한 한 줄은 알리기로',d:'"2번 체어 물이 안 나와요"처럼 급한 내용은 오른쪽 아래 [알리기]로 보내요. 눌러 보세요.'},
 {id:'c06',q:1,sec:'공지·전달',sel:'#apanel [data-asend]',prep:()=>{const m=document.getElementById('a-msg');if(m&&!m.value)m.value='2번 체어 물이 안 나와요, 업체 연락 중이에요'},t:'전체에게 보내기',d:'알림 문구를 넣어 두었어요. [보내기]를 누르면 모든 직원 화면 맨 위와 휴대폰 알림으로 가요.',after:()=>closeAl()},
 {id:'c07',sec:'공지·전달',route:'#notice',sel:'#ahsec',t:'지난 알리기',d:'보낸 알림은 모두 쌓여요. 내용이나 보낸 사람으로 검색할 수 있고, 누가 확인했는지도 남아요.',next:1},
 {id:'d01',sec:'근무·일정',route:'#shift',sel:'#view table.grid',t:'주간 근무표',d:'칸을 눌러 종일, 오전, 오후, 야간, 휴무를 골라요. 연차가 있는 날은 자동으로 표시되고, [지난주 복사]로 매주 입력을 줄일 수 있어요.',next:1},
 {id:'d02',sec:'근무·일정',route:'#attend',sel:'#view .punch',t:'와이파이 출퇴근',d:'치과 와이파이에 연결된 휴대폰으로만 출근을 찍을 수 있어요. 설정하면 앱을 열 때 자동으로 출근이 찍혀요. 퇴근은 어디서나 찍을 수 있어요.',next:1},
 {id:'d03',q:1,sec:'근무·일정',route:'#year',sel:'.ygrid',t:'월별 일정',d:'전체 휴진, 직원 휴무, 연차, 경조사, 치과 행사가 한 달력에 모여요. 날짜를 누르면 그날 일정이 보여요.',next:1},
 {id:'e01',q:1,sec:'재료',route:'#inv',sel:'[data-q="-1"][data-id="i2"]',t:'재료를 쓰면 빼기',d:'석션팁을 하나 썼다고 해 볼게요. [빼기]를 눌러 보세요. 최소 수량 아래로 내려가면 담당자에게 재고 부족 알림이 가요.'},
 {id:'e02',sec:'재료',route:'#inv',sel:'[data-qrsheet]',t:'QR 스티커',d:'재료나 서랍장에 QR 스티커를 붙여 두면, 휴대폰으로 찍고 바로 수량을 바꿀 수 있어요.',next:1},
 {id:'e03',q:1,sec:'재료',route:'#order',sel:'[data-neworder]',t:'주문 견적서 자동 작성',d:'[이번 달 견적서 만들기]를 누르면 지금 부족한 재료가 자동으로 들어가요. 눌러 보세요.'},
 {id:'e04',sec:'재료',route:'#order',sel:'tr[data-ord]',skip:()=>!document.querySelector('tr[data-ord]')||document.querySelector('.osend'),t:'견적서 열기',d:'만들어진 견적서를 눌러 열어 보세요.'},
 {id:'e05',q:1,sec:'재료',route:'#order',sel:'.vscard [data-vsend=kakao]',t:'거래처에 바로 주문',d:'견적서가 거래처별로 나뉘고 주문 문구가 자동으로 만들어져요. 휴대폰에서는 [문자로 주문]을 누르면 번호와 내용이 채워져요. 여기서는 [카톡용 문구 복사]를 눌러 보세요.'},
 {id:'e06',sec:'재료',route:'#vendor',sel:'#view table.stack',t:'거래처',d:'재료업체, 장비업체, 기공소의 담당자와 연락처, 주문 방법을 모아 둬요. 연락처를 넣어 두면 주문과 수리 요청 버튼이 생겨요.',next:1},
 {id:'f01',sec:'장비',route:'#equip',sel:'#view table.stack',t:'장비 점검 주기',d:'장비마다 점검 주기를 넣으면 다음 점검일이 자동으로 계산돼요. 30일 안에 다가오면 오늘 화면과 담당자 화면에 알려 줘요.',next:1},
 {id:'f02',q:1,sec:'장비',route:'#repair',sel:'[data-rsend=copy]',t:'고장 나면 업체에 바로 연락',d:'장비명, 모델, 위치, 증상이 들어간 수리 요청 문구가 자동으로 만들어져요. [문구 복사]를 눌러 보세요. 연락하면 상태가 수리 중으로 바뀌어요.'},
 {id:'g01',sec:'매뉴얼',route:'#manual',sel:'#view .cards',t:'업무 매뉴얼',d:'오픈, 마감, 소독, 전화 응대 같은 업무 순서를 적어 두고 신입 교육에 써요. 처음에는 예시 매뉴얼을 불러와 우리 치과에 맞게 고치면 돼요.',next:1},
 {id:'g02',sec:'매뉴얼',route:'#manual',sel:'[data-manview=m0]',t:'PDF·사진 매뉴얼',d:'가지고 있는 매뉴얼 PDF나 사진을 올리면 쪽마다 이미지로 바뀌어요. [이미지로 보기]를 눌러 보세요.'},
 {id:'g03',sec:'매뉴얼',sel:'#mvnext',t:'한 장씩 넘겨 보기',d:'[다음]을 누르거나 휴대폰에서 옆으로 밀면 순서대로 넘어가요. 사진을 누르면 크게 볼 수 있어요. [다음]을 눌러 보세요.',after:()=>{const x=document.getElementById('mvx');if(x){pass=true;x.click();pass=false}}},
 {id:'h00',sec:'관리자',route:'#my',sel:'#view .mystrip',t:'이제 실장님 화면으로',d:'지금까지 직원 화면을 봤어요. [다음]을 누르면 관리자인 김실장 화면으로 바뀌어요.',next:1,switchTo:'a1'},
 {id:'h01',sec:'관리자',route:'#srole',sel:'[data-sr="ro1|이위생"]',t:'역할 맡기기',d:'관리자는 직원 이름 옆 역할을 눌러 맡기거나 뺄 수 있어요. 이위생에게 오픈 준비를 맡겨 보세요.'},
 {id:'h02',sec:'관리자',route:'#srole',sel:'.ttb',t:'업무 전달 현황',d:'직원끼리 주고받은 업무가 날짜별로 정리돼요. 누가 누구에게 무엇을 보냈고, 확인했는지, 끝냈는지 한눈에 보여요.',next:1},
 {id:'h03',sec:'관리자',route:'#shift',sel:'#view .czb',t:'전체 휴진 지정',d:'날짜 위 [전체 휴진]을 누르면 치과 전체가 쉬는 날로 표시돼요. 직원 연차에서는 빠지지 않아요.',next:1},
 {id:'h04',sec:'관리자',route:'#staff',sel:'#view table.stack',t:'직원 관리',d:'입사일, 면허, 연차를 관리해요. 근무 형태, 계약 만료일, 급여, 계좌, 주소 같은 민감한 정보는 실장님도 볼 수 없고 원장님만 볼 수 있어요.',next:1},
 {id:'h05',sec:'관리자',route:'#users',sel:'[data-copyinv]',t:'직원 초대',d:'초대 문구를 복사해 단톡방에 보내면, 직원이 카카오로 로그인하고 합류 신청을 해요. 관리자가 승인해야 들어올 수 있어요.',next:1},
 {id:'h06',sec:'관리자',route:'#users',sel:'.stages',t:'단계별로 시작',d:'처음엔 1단계로 공지, 근무표, 역할만 켜요. 직원들이 익숙해지면 재료, 장비, 출퇴근을 차례로 켜면 돼요.',next:1},
 {id:'h07',sec:'관리자',route:'#users',sel:'[data-wopen]',t:'처음 설정 도우미',d:'진료 시간, 시작 단계, 직원, 예시 역할과 매뉴얼을 5분 안에 한 번에 정해요. [시작하기]를 눌러 보세요.'},
 {id:'h08',sec:'관리자',sel:'#wpanel',t:'5분이면 셋팅 끝',d:'이 순서대로 [다음]만 누르면 우리 치과에 맞게 셋팅돼요. 나중에 언제든 다시 열어 고칠 수 있어요.',next:1,after:()=>{const x=document.querySelector('#wpanel [data-wclose]');if(x){pass=true;x.click();pass=false}}},
];
function closeAl(){const x=document.querySelector('[data-aclose]');if(x){pass=true;x.click();pass=false}}
const SECS=[...new Set(STEPS.map(s=>s.sec))];
const MODE=()=>ss.get('tour-mode')==='quick'?'quick':'full';
const LIST=()=>MODE()==='quick'?STEPS.filter(s=>s.q):STEPS;

let pass=false,cur=-1,voice=ss.get('tour-voice')!=='0',timer=null,root,hole,bub,busy=false;
const $=s=>document.querySelector(s);
let AU=null;const AUDIO_ON=!(window.APP_CONFIG&&window.APP_CONFIG.TOUR_AUDIO===false);
function tts(t){try{const u=new SpeechSynthesisUtterance(t.replace(/[\[\]"]/g,''));u.lang='ko-KR';u.rate=1.05;const v=speechSynthesis.getVoices().find(v=>/ko/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
function hush(){try{speechSynthesis.cancel()}catch(e){}if(AU){AU.onerror=null;AU.pause();AU=null}}
// 사람 목소리 파일(audio/<key>.mp3)이 있으면 그걸 틀고, 없으면 브라우저 음성으로 읽어요.
function speak(t,key){hush();if(!voice||!t)return;if(!key||!AUDIO_ON){tts(t);return}
 const a=new Audio('audio/'+key+'.mp3');AU=a;let fell=false;const fb=()=>{if(fell||AU!==a)return;fell=true;AU=null;tts(t)};a.onerror=fb;a.play().catch(fb)}
function css(){const s=document.createElement('style');s.textContent=`
#tour-root{position:fixed;inset:0;z-index:1000;pointer-events:none}
#tour-hole{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px rgba(6,24,28,.62);transition:all .25s ease;pointer-events:none}
#tour-hole::after{content:"";position:absolute;inset:-5px;border:3px solid #ff7a59;border-radius:17px;animation:tpulse 1.3s ease-in-out infinite}
@keyframes tpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.03)}}
#tour-bub{position:fixed;pointer-events:auto;width:min(380px,calc(100vw - 24px));background:#fff;color:#14272b;border-radius:18px;padding:16px 18px 14px;box-shadow:0 18px 50px rgba(0,0,0,.3);font:15px/1.55 "Pretendard","Noto Sans KR",sans-serif;transition:top .25s,left .25s}
#tour-bub .tk{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#0e7c86;font-weight:700;margin-bottom:4px}
#tour-bub .tk span{margin-left:auto;color:#8a9a9d;font-weight:500}
#tour-bub h4{font-size:17.5px;margin:0 0 4px;line-height:1.35}
#tour-bub p{margin:0;color:#43575b}
#tour-bub .tb{display:flex;gap:8px;align-items:center;margin-top:12px}
#tour-bub .tb .sp{margin-left:auto}
#tour-bub button{font:inherit;border:0;border-radius:10px;min-height:38px;padding:0 14px;cursor:pointer;background:#eef3f4;color:#14272b}
#tour-bub button.pri{background:#0b5563;color:#fff;font-weight:700}
#tour-bub .ic{min-width:38px;padding:0}
#tour-bub .bar{height:4px;background:#e6eeef;border-radius:4px;margin-bottom:10px;overflow:hidden}
#tour-bub .bar i{display:block;height:100%;background:#0e7c86;border-radius:4px}
@media(max-width:640px){#tour-bub{left:12px!important;right:12px;width:auto;padding:12px 14px}#tour-bub h4{font-size:16px}#tour-bub p{font-size:14px}}
#tour-intro{position:fixed;inset:0;z-index:1001;background:linear-gradient(160deg,#0b5563,#082f37);color:#fff;overflow:auto;display:flex;align-items:center;justify-content:center;padding:28px 18px;font-family:"Pretendard","Noto Sans KR",sans-serif}
#tour-intro .in{width:min(860px,100%)}
#tour-intro .k{color:#8fd3d9;font-weight:700;font-size:14px;letter-spacing:.06em}
#tour-intro h1{font-size:clamp(28px,5vw,44px);line-height:1.2;margin:8px 0 10px}
#tour-intro .lead{color:#cfe6e8;font-size:17px;margin:0 0 22px}
#tour-intro ol{list-style:none;padding:0;margin:0 0 22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
#tour-intro li{background:rgba(255,255,255,.09);border-radius:14px;padding:0}#tour-intro .chb{all:unset;display:block;box-sizing:border-box;width:100%;height:100%;padding:12px 14px;border-radius:14px;cursor:pointer}#tour-intro .chb:hover,#tour-intro .chb:focus-visible{background:rgba(255,255,255,.12);outline:2px solid #8fd3d9}
#tour-intro li b{display:block;font-size:16px}#tour-intro li small{color:#cfe6e8;font-size:13.5px;line-height:1.45;display:block;margin-top:2px}
#tour-intro li i{font-style:normal;display:inline-flex;width:24px;height:24px;border-radius:50%;background:#ff7a59;color:#fff;font-weight:800;font-size:13px;align-items:center;justify-content:center;margin-bottom:6px}
#tour-intro .cta{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
#tour-intro .cta button,#tour-intro a.b{font:inherit;font-size:17px;font-weight:700;border:0;border-radius:14px;min-height:54px;padding:0 26px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
#tour-intro .go{background:#ff7a59;color:#fff}#tour-intro .ghost{background:rgba(255,255,255,.12);color:#fff}
#tour-intro .note{color:#9fc4c8;font-size:13px;margin-top:16px;line-height:1.6}
#tour-intro label{display:inline-flex;gap:6px;align-items:center;color:#cfe6e8;font-size:14px;margin-left:6px}
#tour-end h1{font-size:clamp(26px,4.5vw,38px)}
#tour-intro .cta small{font-weight:500;font-size:13px;opacity:.85;margin-left:8px}
#tour-intro .chh{color:#9fc4c8;font-size:14px;font-weight:700;margin:22px 0 8px}
#tour-intro label.tvl{white-space:nowrap;display:inline-flex;align-items:center;gap:8px}#tour-intro label.tvl input{width:20px;height:20px;min-height:0;margin:0;flex:none;accent-color:#ff7a59}
@media(max-width:640px){#tour-intro{align-items:flex-start;padding:22px 16px 28px}#tour-intro h1{font-size:25px;margin:6px 0 8px}#tour-intro .lead{font-size:15px;margin-bottom:16px}
#tour-intro .cta{flex-direction:column;align-items:stretch;gap:8px}#tour-intro .cta button,#tour-intro a.b{width:100%;justify-content:center;min-height:50px;font-size:16px;padding:0 14px}#tour-intro label.tvl{margin:4px 0 0;justify-content:center}
#tour-intro ol{grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px}#tour-intro .chb{padding:9px 10px;display:flex;align-items:center;gap:8px}#tour-intro li i{margin:0;flex:none;width:22px;height:22px;font-size:12px}#tour-intro li b{font-size:14.5px}#tour-intro .chb small{display:none}#tour-intro .chh{margin-top:18px}#tour-intro .note{font-size:12.5px;margin-top:8px}}
body.touring #demobar{display:none!important}`;document.head.appendChild(s)}

const say=x=>(x.t+'. '+x.d).replace(/[\[\]"]/g,'');
const CH={'내 화면':'로그인하면 보이는 나만의 화면, 근무·연차·담당 장비·역할 체크','오늘':'치과 전체 현황, 오픈 준비·마감','공지·전달':'읽음 확인, 업무 전달·완료, 알리기 팝업','근무·일정':'근무표, 와이파이 출퇴근, 월별 일정','재료':'재고 차감, QR, 견적서 자동 작성, 거래처 주문','장비':'점검 주기, 고장 시 업체 연락','매뉴얼':'업무 매뉴얼, PDF·사진을 넘겨 보기','관리자':'역할 배정, 전체 휴진, 직원 초대, 설정 도우미'};
function startAt(mode,i){ss.set('tour-seen','1');ss.set('tour-mode',mode);ss.set('tour-step',String(i));try{localStorage.removeItem(LSK)}catch(x){}location.hash='#my';location.reload()}
function intro(){const o=document.createElement('div');o.id='tour-intro';o.setAttribute('role','dialog');o.setAttribute('aria-label','체험 안내');
 const nq=STEPS.filter(s=>s.q).length,nf=STEPS.length;
 o.innerHTML=`<div class="in"><div class="k">치과 운영 관리 · 무료 체험</div><h1>가입 없이,<br>우리 치과의 하루를 체험해 보세요</h1><p class="lead">가상 치과 "미소치과"의 치과위생사 <b>이위생</b>이 되어, 강조된 곳을 직접 눌러 보면 돼요. 전체 체험은 마지막에 <b>관리자 화면</b>까지 보여 드려요.</p>
 <div class="cta"><button type="button" class="go" data-tgo="full">전체 체험 <small>${nf}단계 · 약 7분</small></button><button type="button" class="ghost" data-tgo="quick">빠른 체험 <small>${nq}단계 · 2분</small></button><button type="button" class="ghost" data-tfree>그냥 둘러보기</button>${APPLY?`<a class="b ghost" href="${APPLY}" target="_blank" rel="noopener">시범 치과 신청</a>`:''}<label class="tvl"><input type="checkbox" data-tvoice ${voice?'checked':''}> 음성 안내 켜기</label></div>
 <p class="chh">또는 보고 싶은 부분부터 시작하기</p>
 <ol>${SECS.map((x,i)=>`<li><button type="button" class="chb" data-tch="${x}"><i>${i+1}</i><b>${x}</b><small>${CH[x]||''}</small></button></li>`).join('')}</ol>
 <p class="note">가상 치과·가상 직원이고, 저장·문자·카톡 버튼은 실제로 아무것도 보내지 않아요. 언제든 × 버튼으로 끝낼 수 있어요.</p></div>`;
 document.body.appendChild(o);document.body.classList.add('touring');o.querySelector('[data-tgo]').focus();
 o.addEventListener('click',e=>{const b=e.target;
  if(b.matches('[data-tvoice]')){voice=b.checked;ss.set('tour-voice',voice?'1':'0');return}
  const g=b.closest('[data-tgo]');if(g){startAt(g.dataset.tgo,0);return}
  const c=b.closest('[data-tch]');if(c){startAt('full',STEPS.findIndex(s=>s.sec===c.dataset.tch));return}
  if(b.closest('[data-tfree]')){ss.set('tour-seen','1');o.remove();document.body.classList.remove('touring')}})}

function endScreen(){stop(false);const quick=MODE()==='quick';const o=document.createElement('div');o.id='tour-intro';o.innerHTML=`<div class="in" id="tour-end"><div class="k">체험 완료</div><h1>단톡방·종이 체크리스트·엑셀을<br>한 화면으로 옮겨 보세요</h1>
 <p class="lead">${quick?'빠른 체험에서는 핵심만 봤어요. 전체 체험에서는 근무·연차, 담당 장비, 지난 알리기, 거래처, 매뉴얼, 관리자 화면까지 볼 수 있어요.':'직원 화면부터 관리자 화면까지 모두 둘러봤어요. 이제 메뉴를 자유롭게 눌러 보세요.'}</p>
 <ol><li><b>시범 치과 모집</b><small>시범 치과 8곳은 1년 무료, 이후 월 5,000원. 카카오 로그인으로 바로 시작해요.</small></li><li><b>5분 셋팅</b><small>처음 설정 도우미로 진료 시간, 직원, 역할, 매뉴얼을 한 번에 정해요.</small></li><li><b>환자 정보는 저장하지 않아요</b><small>청구 프로그램은 그대로 쓰시고, 직원 업무만 옮겨 오세요.</small></li></ol>
 <div class="cta">${quick?'<button type="button" class="go" data-tfull>전체 체험하기</button>':''}<button type="button" class="${quick?'ghost':'go'}" data-tfree>자유롭게 둘러보기</button><button type="button" class="ghost" data-tagain>처음 화면으로</button>${APPLY?`<a class="b ghost" href="${APPLY}" target="_blank" rel="noopener">시범 치과 신청</a>`:''}</div></div>`;
 document.body.appendChild(o);document.body.classList.add('touring');speak(quick?END_Q:END_F,quick?'end-quick':'end-full');
 o.addEventListener('click',e=>{const b=e.target;
  if(b.closest('[data-tfree]')){o.remove();document.body.classList.remove('touring')}
  if(b.closest('[data-tfull]')){window.__st.uid='a2';window.__save();startAt('full',0)}
  if(b.closest('[data-tagain]')){o.remove();window.__st.uid='a2';window.__save();ss.del('tour-seen');location.hash='#my';location.reload()}})}
const END_Q='빠른 체험을 마쳤어요. 전체 체험에서는 관리자 화면까지 볼 수 있어요.';
const END_F='체험을 모두 마쳤어요. 이제 메뉴를 자유롭게 눌러 보세요. 시범 치과 8곳은 1년 동안 무료로 쓸 수 있어요.';

function build(){root=document.createElement('div');root.id='tour-root';hole=document.createElement('div');hole.id='tour-hole';bub=document.createElement('div');bub.id='tour-bub';bub.setAttribute('role','dialog');bub.setAttribute('aria-live','polite');root.append(hole,bub);document.body.appendChild(root);document.body.classList.add('touring');
 bub.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tx!=null){stop(true);return}
  if(b.dataset.tv!=null){voice=!voice;ss.set('tour-voice',voice?'1':'0');b.textContent=voice?'🔊':'🔈';b.setAttribute('aria-label',voice?'음성 끄기':'음성 켜기');const s=LIST()[cur];if(voice&&s)speak(say(s),s.id);else hush();return}
  if(b.dataset.tn!=null){advance();return}
  if(b.dataset.tp!=null){go(Math.max(0,cur-1));return}})}

function stop(clear){clearInterval(timer);timer=null;hush();if(root)root.remove();root=null;document.body.classList.remove('touring');if(clear){ss.del('tour-step')}}

function place(){const s=LIST()[cur];if(!s||!root)return;const el=$(s.sel);if(!el){hole.style.opacity=0;return}
 const r=el.getBoundingClientRect(),p=8;hole.style.opacity=1;Object.assign(hole.style,{left:r.left-p+'px',top:r.top-p+'px',width:r.width+p*2+'px',height:Math.min(r.height+p*2,innerHeight*.7)+'px'});
 if(innerWidth<=640){const bh=bub.offsetHeight,mid=r.top+Math.min(r.height,innerHeight*.7)/2;if(mid>innerHeight/2){bub.style.top=Math.max(8,Math.min(r.top-bh-18,innerHeight-bh-8))+'px'}else{bub.style.top=Math.min(innerHeight-bh-8,r.top+Math.min(r.height,innerHeight*.5)+18)+'px'}bub.style.bottom='auto';return}
 const bw=bub.offsetWidth,bh=bub.offsetHeight,rb=r.top+Math.min(r.height,innerHeight*.7);let top=rb+16,left=Math.min(Math.max(12,r.left),innerWidth-bw-12);
 if(top+bh>innerHeight-12)top=r.top-bh-16;if(top<12){top=Math.min(innerHeight-bh-12,Math.max(12,r.top));left=r.right+16+bw<innerWidth?r.right+16:Math.max(12,r.left-bw-16)}
 bub.style.top=top+'px';bub.style.left=left+'px'}

function wait(sel,ms){return new Promise(res=>{const t0=Date.now();(function f(){const e=$(sel);if(e&&e.getClientRects().length)return res(e);if(Date.now()-t0>ms)return res(null);setTimeout(f,120)})()})}

async function go(i){const L=LIST();if(i>=L.length){ss.del('tour-step');endScreen();return}
 cur=i;ss.set('tour-step',String(i));const s=L[i];busy=false;
 if(s.route&&location.hash!==s.route){location.hash=s.route;await new Promise(r=>setTimeout(r,350))}
 if(s.skip&&s.skip()){return go(i+1)}
 if(!root)build();
 const secs=[...new Set(L.map(x=>x.sec))],k=secs.indexOf(s.sec);
 bub.innerHTML=`<div class="bar"><i style="width:${Math.round((i+1)/L.length*100)}%"></i></div><div class="tk">${k+1}. ${s.sec}<span>${i+1} / ${L.length}</span></div><h4>${s.t}</h4><p>${s.d}</p>
  <div class="tb">${i?'<button type="button" data-tp>이전</button>':''}${s.next?'<button type="button" class="pri" data-tn>다음</button>':'<small style="color:#0e7c86;font-weight:700">강조된 곳을 눌러 보세요 ☝</small>'}<button type="button" class="ic sp" data-tv aria-label="${voice?'음성 끄기':'음성 켜기'}">${voice?'🔊':'🔈'}</button><button type="button" class="ic" data-tx aria-label="체험 끝내기">×</button></div>`;
 const el=await wait(s.sel,4000);
 if(cur!==i)return;
 if(!el){go(i+1);return}
 if(s.prep)s.prep();
 el.scrollIntoView({block:el.offsetHeight>innerHeight*.6?'start':'center',behavior:'smooth'});setTimeout(place,350);place();speak(say(s),s.id);
 if(s.next){const b=bub.querySelector('[data-tn]');if(b)b.focus()}}

function advance(){const s=LIST()[cur];if(busy)return;busy=true;
 if(s&&s.switchTo){hush();ss.set('tour-step',String(cur+1));window.__st.uid=s.switchTo;window.__save();const n=LIST()[cur+1];location.hash=(n&&n.route)||'#home';location.reload();return}
 setTimeout(()=>{if(s&&s.after)s.after();go(cur+1)},s&&s.next?0:650)}

// 강조된 곳 말고는 누르지 못하게 (말풍선은 예외)
document.addEventListener('click',e=>{if(pass||!root||cur<0)return;const s=LIST()[cur];if(!s||e.target.closest('#tour-bub'))return;
 const el=$(s.sel);if(el&&!s.next&&el.contains(e.target)){advance();return}
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root){e.stopImmediatePropagation();stop(true)}},true);
addEventListener('resize',()=>root&&place());addEventListener('scroll',()=>root&&place(),true);

function boot(){css();
 const st=ss.get('tour-step');
 if(st!=null){setTimeout(()=>{timer=setInterval(()=>root&&place(),300);go(Number(st))},900);return}
 if(!ss.get('tour-seen'))intro();}
window.__tourScript=()=>STEPS.map(x=>[x.sec,x.id,x.q?'빠른·전체':'전체',say(x)]).concat([['마무리','end-quick','빠른',END_Q],['마무리','end-full','전체',END_F]]);
window.__tour=()=>{ss.del('tour-seen');ss.del('tour-step');intro()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
