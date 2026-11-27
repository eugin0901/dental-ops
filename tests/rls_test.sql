\set ON_ERROR_STOP 0
\pset footer off
-- users: A1 admin of clinic A, A2 staff joins A, B1 admin of clinic B, OP operator
insert into auth.users(id,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','{"name":"김원장"}'),('00000000-0000-0000-0000-0000000000a2','{"name":"이위생"}'),
 ('00000000-0000-0000-0000-0000000000b1','{"name":"박원장"}'),('00000000-0000-0000-0000-00000000000f','{"name":"운영자"}');
insert into public.operators values ('00000000-0000-0000-0000-00000000000f');
set role authenticated;
-- A1 creates clinic A
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
select 'A1 create' t, public.create_clinic('미소치과') is not null ok;
select 'A1 cannot create 2nd' t; select public.create_clinic('두번째');
insert into public.records(clinic_id,module,id,data) values (public.my_clinic(),'inv','x1','{"name":"큐렛"}');
insert into public.records(clinic_id,module,id,data) values (public.my_clinic(),'staffpriv','s1','{"salary":"300"}');
insert into public.records(clinic_id,module,id,data) values (public.my_clinic(),'notice','n1','{"title":"공지"}');
select public.log_usage('inv','view'); select public.log_usage('inv','view'); select public.log_usage('inv','edit');
-- B1 creates clinic B and tries to read/write A
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000b1';
select 'B1 create' t, public.create_clinic('행복치과') is not null ok;
select 'B1 sees A records (expect 0)' t, count(*) from public.records where module='inv';
select 'B1 sees clinics (expect 1)' t, count(*) from public.clinics;
select 'B1 insert into A (expect error)' t;
insert into public.records(clinic_id,module,id,data) select id,'inv','evil','{}' from public.clinics limit 0;
insert into public.records(clinic_id,module,id,data) values ((select clinic_id from public.profiles where id='00000000-0000-0000-0000-0000000000a1'),'inv','evil','{}');
-- A2 joins A by code
reset role; select invite_code as code from public.clinics where name='미소치과' \gset
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2';
select 'A2 wrong code (expect error)' t; select public.join_clinic('ZZZZZZ');
select 'A2 join' t, public.join_clinic(:'code');
select 'A2 pending sees records (expect 0)' t, count(*) from public.records;
select 'A2 self-approve (expect 0 rows)' t; update public.profiles set approved=true where id=auth.uid();
select 'A2 change clinic_id (expect permission error)' t; update public.profiles set clinic_id=null where id=auth.uid();
-- A1 approves A2
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
update public.profiles set approved=true where id='00000000-0000-0000-0000-0000000000a2';
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2';
select 'A2 approved sees inv,notice not staffpriv' t, string_agg(module,',' order by module) from public.records;
select 'A2 delete A1 notice (expect 0 deleted)' t; with d as (delete from public.records where module='notice' returning 1) select count(*) from d;
select 'A2 move record to B via update (clinic_id kept)' t; update public.records set clinic_id=(select id from public.clinics limit 1) where id='x1';
select 'A2 storage lab ok' t; insert into storage.objects(bucket_id,name) values ('lab-photos',public.my_clinic()::text||'/lab/r1/1.jpg');
select 'A2 storage staff-docs (expect error)' t; insert into storage.objects(bucket_id,name) values ('staff-docs',public.my_clinic()::text||'/staff/s1/1.pdf');
select 'A2 storage other clinic path (expect error)' t; insert into storage.objects(bucket_id,name) values ('lab-photos','00000000-0000-0000-0000-000000000000/lab/x.jpg');
insert into public.feedback(clinic_id,user_id,module,kind,message) values (public.my_clinic(),auth.uid(),'inv','요청','바코드 스캔 있었으면');
select 'A2 op_clinics (expect 0, not operator)' t, count(*) from public.op_clinics();
-- B1 reads A storage / feedback
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000b1';
select 'B1 sees A storage (expect 0)' t, count(*) from storage.objects;
select 'B1 sees A feedback (expect 0)' t, count(*) from public.feedback;
select 'B1 remove A2 (no effect)' t; select public.remove_member('00000000-0000-0000-0000-0000000000a2');
-- operator
set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000f';
select 'OP clinics' t, name, members, pending, records, active_users_7d from public.op_clinics();
select 'OP usage' t, module, kind, total from public.op_usage(30);
select 'OP feedback' t, message from public.feedback;
select 'OP reads records (expect 0)' t, count(*) from public.records;
-- A1 removes A2, resets code
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
select 'A1 reset code' t, length(public.reset_invite_code());
select public.remove_member('00000000-0000-0000-0000-0000000000a2');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a2';
select 'A2 after removal sees (expect 0)' t, count(*) from public.records;
reset role;
select 'final A2 profile' t, clinic_id is null as no_clinic, approved from public.profiles where id='00000000-0000-0000-0000-0000000000a2';
select 'x1 clinic still A' t, (select name from public.clinics c where c.id=r.clinic_id) from public.records r where id='x1';
