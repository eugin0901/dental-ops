insert into auth.users(id,raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000a1','{"name":"관리자"}'),('00000000-0000-0000-0000-0000000000a2','{"name":"이위생"}'),('00000000-0000-0000-0000-0000000000a3','{"name":"최조무"}');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1'; select public.create_clinic('미소치과') is not null;
reset role; select invite_code code from public.clinics \gset
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2'; select public.join_clinic(:'code');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a3'; select public.join_clinic(:'code');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
update public.profiles set approved=true, rank='사원' where id='00000000-0000-0000-0000-0000000000a2';
update public.profiles set approved=true, rank='총괄실장' where id='00000000-0000-0000-0000-0000000000a3';
select name, rank, role from public.profiles order by name;
\echo '--- demote 총괄실장 to 팀장'
update public.profiles set rank='팀장' where id='00000000-0000-0000-0000-0000000000a3';
select name, rank, role from public.profiles where id='00000000-0000-0000-0000-0000000000a3';
\echo '--- try to demote the only admin (expect error)'
update public.profiles set rank='사원' where id='00000000-0000-0000-0000-0000000000a1';
\echo '--- staff tries to promote self (expect 0 rows)'
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2';
with u as (update public.profiles set rank='원장' where id='00000000-0000-0000-0000-0000000000a2' returning 1) select count(*) from u;
