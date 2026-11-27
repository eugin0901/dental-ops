insert into auth.users(id,raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000a1','{"name":"김실장"}'),('00000000-0000-0000-0000-0000000000a2','{"name":"이위생"}'),('00000000-0000-0000-0000-0000000000a3','{"name":"박원장"}');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1'; select public.create_clinic('미소치과') is not null;
reset role; select id cid, invite_code code from public.clinics \gset
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2'; select public.join_clinic(:'code');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a3'; select public.join_clinic(:'code');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
update public.profiles set rank='실장' where id='00000000-0000-0000-0000-0000000000a1';
update public.profiles set approved=true, rank='사원' where id='00000000-0000-0000-0000-0000000000a2';
\echo '--- 1. 원장이 없을 때 실장이 박원장을 원장으로 지정 (성공)'
update public.profiles set approved=true, rank='원장' where id='00000000-0000-0000-0000-0000000000a3';
select name, rank, role from public.profiles order by name;
\echo '--- 2. 실장이 스스로 원장으로 (오류 기대)'
update public.profiles set rank='원장' where id='00000000-0000-0000-0000-0000000000a1';
\echo '--- 3. 실장이 원장님 정보 쓰기 (오류 기대)'
insert into public.records(clinic_id,module,id,data) values (:'cid','staffpriv','s1','{"salary":"300"}');
\echo '--- 4. 원장이 쓰기 (성공)'
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a3';
insert into public.records(clinic_id,module,id,data) values (:'cid','staffpriv','s1','{"salary":"300"}');
select '원장 보기', count(*) from public.records where module='staffpriv';
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
select '실장 보기', count(*) from public.records where module='staffpriv';
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2';
select '사원 보기', count(*) from public.records where module='staffpriv';
\echo '--- 5. 원장이 실장을 원장으로, 본인은 실장으로 (성공)'
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a3';
update public.profiles set rank='원장' where id='00000000-0000-0000-0000-0000000000a1';
update public.profiles set rank='실장' where id='00000000-0000-0000-0000-0000000000a3';
select name, rank from public.profiles order by name;
\echo '--- 6. 마지막 원장이 스스로 내려가기 (오류 기대)'
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
update public.profiles set rank='실장' where id='00000000-0000-0000-0000-0000000000a1';
